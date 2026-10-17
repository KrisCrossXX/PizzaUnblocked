/* Pizza Unblocked — persistent saves for butterscotch ports.
   The runner's --save-folder is /saves in the in-memory wasm FS, so this
   mirrors it to browser OPFS at /pu-saves/<game>/ and back. Also applies
   pending 101%-save injections and exports backups as .zip downloads. */
const PU_SAVES = (() => {
    const ROOT = 'pu-saves';
    const SAVE_FS = '/saves';

    function dirKeyFromPath() {
        const parts = location.pathname.split('/').filter(Boolean);
        return parts[parts.length - 1] || 'unknown';
    }

    async function dirHandle(dirKey, create = true) {
        const root = await navigator.storage.getDirectory();
        const a = await root.getDirectoryHandle(ROOT, { create });
        return a.getDirectoryHandle(dirKey, { create });
    }

    // recurse one level — PT writes flat inis, mods may nest a subdir
    async function* walkOpfs(dir, prefix = '') {
        for await (const [name, h] of dir.entries()) {
            if (h.kind === 'file') yield { name: prefix + name, handle: h };
            else if (h.kind === 'directory') yield* walkOpfs(h, prefix + name + '/');
        }
    }

    function fsMkdirs(Module, p) {
        let cur = '';
        for (const part of p.split('/')) {
            if (!part) continue;
            cur += '/' + part;
            try { Module.FS.mkdir(cur); } catch {}
        }
    }

    function* walkMemfs(Module, p, prefix = '') {
        for (const name of Module.FS.readdir(p)) {
            if (name === '.' || name === '..') continue;
            const full = p + '/' + name;
            const st = Module.FS.stat(full);
            if (Module.FS.isDir(st.mode)) yield* walkMemfs(Module, full, prefix + name + '/');
            else yield { name: prefix + name, path: full };
        }
    }

    async function opfsMkdirs(dir, rel) {
        const parts = rel.split('/');
        parts.pop();
        for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true });
        return dir;
    }

    async function restore(Module, dirKey) {
        try {
            const dir = await dirHandle(dirKey, false).catch(() => null);
            if (!dir) return;
            fsMkdirs(Module, SAVE_FS);
            for await (const { name, handle } of walkOpfs(dir)) {
                const f = await handle.getFile();
                fsMkdirs(Module, SAVE_FS + '/' + name.split('/').slice(0, -1).join('/'));
                Module.FS.writeFile(SAVE_FS + '/' + name, new Uint8Array(await f.arrayBuffer()));
            }
            console.log('[saves] restored from opfs');
        } catch (e) { console.warn('[saves] restore failed', e); }
    }

    async function injectIfPending(Module, dirKey) {
        try {
            const raw = sessionStorage.getItem('pu_saveinject_' + dirKey);
            if (!raw) return;
            const files = JSON.parse(raw);
            const dir = await dirHandle(dirKey).catch(() => null);
            for (const [name, text] of Object.entries(files)) {
                Module.FS.writeFile(SAVE_FS + '/' + name, text);
                if (dir) {
                    const fh = await dir.getFileHandle(name, { create: true });
                    const w = await fh.createWritable();
                    await w.write(text);
                    await w.close();
                }
            }
            sessionStorage.removeItem('pu_saveinject_' + dirKey);
            console.log('[saves] injected 101% save');
        } catch (e) { console.warn('[saves] inject failed', e); }
    }

    async function flushOut(Module, dirKey) {
        try {
            const dir = await dirHandle(dirKey);
            for (const { name, path } of walkMemfs(Module, SAVE_FS)) {
                const data = Module.FS.readFile(path);
                const sub = await opfsMkdirs(dir, name);
                const fh = await sub.getFileHandle(name.split('/').pop(), { create: true });
                const w = await fh.createWritable();
                await w.write(data);
                await w.close();
            }
        } catch (e) { /* /saves may not exist yet or opfs unavailable */ }
    }

    function arm(Module, dirKey) {
        setInterval(() => flushOut(Module, dirKey), 5000);
        addEventListener('pagehide', () => { flushOut(Module, dirKey); });
    }

    // --- store-only zip for backups ---
    const CRC_TABLE = (() => {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            t[n] = c;
        }
        return t;
    })();
    function crc32(d) {
        let c = 0xFFFFFFFF;
        for (const b of d) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    }
    function zipStore(files) {
        const enc = new TextEncoder();
        const chunks = [], central = [];
        let off = 0;
        for (const [name, data] of Object.entries(files)) {
            const nb = enc.encode(name), crc = crc32(data);
            const h = new DataView(new ArrayBuffer(30));
            h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true);
            h.setUint32(14, crc, true); h.setUint32(18, data.length, true);
            h.setUint32(22, data.length, true); h.setUint16(26, nb.length, true);
            chunks.push(h.buffer, nb, data);
            const c = new DataView(new ArrayBuffer(46));
            c.setUint32(0, 0x02014b50, true); c.setUint16(6, 20, true);
            c.setUint32(16, crc, true); c.setUint32(20, data.length, true);
            c.setUint32(24, data.length, true); c.setUint16(28, nb.length, true);
            c.setUint32(42, off, true);
            central.push(c.buffer, nb);
            off += 30 + nb.length + data.length;
        }
        const cdSize = central.reduce((s, b) => s + b.byteLength, 0);
        const e = new DataView(new ArrayBuffer(22));
        e.setUint32(0, 0x06054b50, true);
        const n = Object.keys(files).length;
        e.setUint16(8, n, true); e.setUint16(10, n, true);
        e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
        return new Blob([...chunks, ...central, e.buffer], { type: 'application/zip' });
    }

    async function readOpfsFiles(dirKey) {
        const dir = await dirHandle(dirKey, false).catch(() => null);
        const files = {};
        if (dir) for await (const { name, handle } of walkOpfs(dir)) {
            const f = await handle.getFile();
            files[name] = new Uint8Array(await f.arrayBuffer());
        }
        return files;
    }

    async function downloadBackup(dirKey) {
        const files = await readOpfsFiles(dirKey);
        if (!Object.keys(files).length) return false;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipStore(files));
        a.download = dirKey + '-saves-backup.zip';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        return true;
    }

    return { dirKeyFromPath, restore, injectIfPending, flushOut, arm, downloadBackup, readOpfsFiles, zipStore };
})();
