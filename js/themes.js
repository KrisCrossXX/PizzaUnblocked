// Local theme browser, inspired by the Toby Web theme screens.
(() => {
    const CUSTOM_KEY = 'pu_custom_themes';
    const INSTALLED_KEY = 'pu_installed_themes';
    const FAVORITES_KEY = 'pu_theme_favorites';
    const countKey = 'pu_theme_applies';
    let customCache;
    const tabs = document.getElementById('themeNav');
    const sections = {
        mine: document.getElementById('themeViewMine'),
        discover: document.getElementById('themeViewDiscover'),
        create: document.getElementById('themeViewCreate'),
        stats: document.getElementById('themeViewStats'),
    };
    const read = (key, fallback) => {
        try {
            const value = JSON.parse(localStorage.getItem(key) || 'null');
            return value ?? fallback;
        } catch { return fallback; }
    };
    customCache = read(CUSTOM_KEY, []);
    const customThemes = () => customCache.filter(theme => theme && theme.id && theme.name);
    const installedThemes = () => read(INSTALLED_KEY, []);
    const activeKey = () => localStorage.getItem('pu_theme_custom') || `official:${localStorage.getItem('pu_theme') || PU_THEMES[0].name}`;
    let selectedTab = 'mine';
    let previewObjectUrl = '';
    let discoverLimit = 12;

    function openThemeDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('pizza-unblocked-themes', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('state');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async function readDb(key) {
        const db = await openThemeDb();
        return new Promise((resolve, reject) => {
            const request = db.transaction('state').objectStore('state').get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async function writeDb(key, value) {
        const db = await openThemeDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('state', 'readwrite');
            transaction.objectStore('state').put(value, key);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    }
    async function removeDb(key) {
        const db = await openThemeDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('state', 'readwrite');
            transaction.objectStore('state').delete(key);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
    async function loadPersistedThemes() {
        try {
            const stored = await readDb('custom');
            if (Array.isArray(stored)) customCache = stored;
            else {
                const legacy = read(CUSTOM_KEY, []);
                if (Array.isArray(legacy) && legacy.length) {
                    customCache = legacy;
                    await writeDb('custom', customCache);
                }
            }
            localStorage.setItem(CUSTOM_KEY, '[]');
            const active = customThemes().find(theme => theme.id === localStorage.getItem('pu_theme_custom'));
            if (active) window.applyPuTheme({ ...active, custom: true }, false);
            renderAll();
            refreshDraftSelect();
        } catch {
            document.getElementById('themeFormNote').textContent = 'browser storage is unavailable; themes may not save';
        }
    }

    function crc32(bytes) {
        let crc = -1;
        for (const byte of bytes) {
            crc ^= byte;
            for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
        return (crc ^ -1) >>> 0;
    }
    function zipStore(files) {
        const encoder = new TextEncoder();
        const localParts = [], centralParts = [];
        let offset = 0;
        for (const file of files) {
            const name = encoder.encode(file.name), data = file.data instanceof Uint8Array ? file.data : encoder.encode(file.data);
            const crc = crc32(data);
            const local = new Uint8Array(30 + name.length + data.length), lv = new DataView(local.buffer);
            lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint32(14, crc, true);
            lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true);
            local.set(name, 30); local.set(data, 30 + name.length); localParts.push(local);
            const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
            cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
            cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
            cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true); central.set(name, 46);
            centralParts.push(central); offset += local.length;
        }
        const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
        const end = new Uint8Array(22), view = new DataView(end.buffer);
        view.setUint32(0, 0x06054b50, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true);
        view.setUint32(12, centralSize, true); view.setUint32(16, offset, true);
        return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
    }
    function dataUrlBytes(url) {
        if (!url || !url.startsWith('data:')) return null;
        const [meta, encoded] = url.split(',', 2);
        if (!meta.includes(';base64')) return new TextEncoder().encode(decodeURIComponent(encoded));
        const raw = atob(encoded), bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        return bytes;
    }
    async function exportTheme(theme) {
        const bgName = `background.${theme.bg?.match(/^data:image\/([^;]+)/)?.[1] || 'bin'}`;
        const songName = `music.${theme.song?.match(/^data:audio\/([^;]+)/)?.[1] || 'bin'}`;
        const metadata = { ...theme, bg: theme.bg?.startsWith('data:') ? bgName : theme.bg, song: theme.song?.startsWith('data:') ? songName : theme.song };
        const files = [{ name: 'theme.json', data: JSON.stringify(metadata, null, 2) }];
        const background = dataUrlBytes(theme.bg);
        if (background) files.push({ name: bgName, data: background });
        const music = dataUrlBytes(theme.song);
        if (music) files.push({ name: songName, data: music });
        const blob = zipStore(files), url = URL.createObjectURL(blob), anchor = document.createElement('a');
        anchor.href = url; anchor.download = `${theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'theme'}.zip`;
        anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    }

    function selectTab(name) {
        selectedTab = name in sections ? name : 'mine';
        for (const [key, section] of Object.entries(sections)) section.hidden = key !== selectedTab;
        for (const button of tabs.querySelectorAll('[data-theme-tab]')) {
            const selected = button.dataset.themeTab === selectedTab;
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-current', selected ? 'page' : 'false');
        }
        if (selectedTab === 'stats') renderStats();
    }

    function addTile(container, theme, { custom = false, discover = false } = {}) {
        const key = custom ? theme.id : `official:${theme.name}`;
        const tile = document.createElement('article');
        tile.className = 'theme-tile';
        if (activeKey() === key) tile.classList.add('active');

        const image = document.createElement('button');
        image.type = 'button';
        image.className = 'theme-tile-image';
        image.setAttribute('aria-label', `Apply ${theme.name}`);
        image.style.background = `center / cover url("${theme.bg}") #111`;
        image.addEventListener('click', () => {
            window.applyPuTheme({ ...theme, custom });
            renderAll();
        });
        tile.appendChild(image);

        const title = document.createElement('strong');
        title.className = 'theme-tile-title';
        title.textContent = theme.name;
        tile.appendChild(title);
        const creator = document.createElement('span');
        creator.className = 'theme-tile-creator';
        creator.textContent = theme.creator || (custom ? 'local creator' : 'Pizza Unblocked');
        tile.appendChild(creator);

        const favoriteIds = new Set(read(FAVORITES_KEY, []));
        const favorite = document.createElement('button');
        favorite.type = 'button'; favorite.className = 'theme-favorite';
        favorite.textContent = favoriteIds.has(key) ? '★' : '☆';
        favorite.title = favoriteIds.has(key) ? 'remove favorite theme' : 'favorite theme';
        favorite.setAttribute('aria-pressed', String(favoriteIds.has(key)));
        favorite.addEventListener('click', () => {
            const next = new Set(read(FAVORITES_KEY, []));
            if (next.has(key)) next.delete(key); else next.add(key);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
            favorite.textContent = next.has(key) ? '★' : '☆';
            favorite.setAttribute('aria-pressed', String(next.has(key)));
        });
        tile.appendChild(favorite);

        const actions = document.createElement('div');
        actions.className = 'theme-tile-actions';
        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'theme-action';
        if (discover) {
            action.textContent = installedThemes().includes(key) ? 'installed' : 'install';
            action.disabled = installedThemes().includes(key);
            action.addEventListener('click', () => {
                const installed = new Set(installedThemes());
                installed.add(key);
                localStorage.setItem(INSTALLED_KEY, JSON.stringify([...installed]));
                window.applyPuTheme({ ...theme, custom });
                renderAll();
            });
        } else {
            action.textContent = 'apply';
            action.addEventListener('click', () => {
                window.applyPuTheme({ ...theme, custom });
                renderAll();
            });
        }
        actions.appendChild(action);

        if (custom && !discover) {
            const exportButton = document.createElement('button');
            exportButton.type = 'button'; exportButton.className = 'theme-action'; exportButton.textContent = 'export zip';
            exportButton.addEventListener('click', () => exportTheme(theme));
            actions.appendChild(exportButton);
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'theme-action';
            remove.textContent = 'delete';
            remove.addEventListener('click', () => {
                const remaining = customThemes().filter(item => item.id !== theme.id);
                customCache = remaining;
                writeDb('custom', customCache).catch(() => {});
                localStorage.setItem(INSTALLED_KEY, JSON.stringify(installedThemes().filter(item => item !== theme.id)));
                if (localStorage.getItem('pu_theme_custom') === theme.id) window.applyPuTheme(PU_THEMES[0]);
                renderAll();
            });
            actions.appendChild(remove);
        }
        tile.appendChild(actions);
        container.appendChild(tile);
    }

    function renderMine() {
        const officialGrid = document.getElementById('themeOfficialGrid');
        const installedGrid = document.getElementById('themeInstalledGrid');
        officialGrid.replaceChildren();
        installedGrid.replaceChildren();
        for (const theme of PU_THEMES) addTile(officialGrid, theme);
        for (const theme of customThemes()) addTile(installedGrid, theme, { custom: true });
        document.getElementById('themeInstalledEmpty').hidden = customThemes().length > 0;
    }

    function renderDiscover() {
        const grid = document.getElementById('themeDiscoverGrid');
        const empty = document.getElementById('themeDiscoverEmpty');
        const query = document.getElementById('themeSearch').value.trim().toLowerCase();
        const sort = document.getElementById('themeSort').value;
        let themes = [...PU_THEMES].filter(theme => theme.name.toLowerCase().includes(query));
        if (sort === 'az') themes.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === 'favorites') themes = themes.filter(theme => read(FAVORITES_KEY, []).includes(`official:${theme.name}`));
        grid.replaceChildren();
        for (const theme of themes.slice(0, discoverLimit)) addTile(grid, theme, { discover: true });
        document.getElementById('themeDiscoverMore').hidden = themes.length <= discoverLimit;
        empty.hidden = themes.length > 0;
    }

    function draftValue() {
        return {
            name: nameInput.value.trim(), creator: document.getElementById('themeCreator').value.trim(),
            description: document.getElementById('themeDescription').value.trim(),
            accent: accentInput.value, text: textInput.value, bgColor: bgColorInput.value,
            buttonLayout: document.getElementById('themeButtonLayout').value,
            background: fileInput.files?.[0] || null, music: musicInput.files?.[0] || null,
        };
    }
    async function fileToDataUrl(file) {
        if (!file) return '';
        return new Promise((resolve, reject) => {
            const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    async function readDrafts() { return (await readDb('drafts')) || []; }
    async function refreshDraftSelect() {
        const select = document.getElementById('themeDraftSelect');
        if (!select) return;
        const previous = select.value;
        let drafts = [];
        try { drafts = await readDrafts(); } catch {}
        select.replaceChildren(new Option('select a draft', ''));
        drafts.forEach(draft => select.add(new Option(draft.name || 'untitled draft', draft.id)));
        if (drafts.some(draft => draft.id === previous)) select.value = previous;
    }
    async function saveDraft() {
        const value = draftValue();
        const bg = value.background, song = value.music;
        if (bg && bg.size > 30 * 1024 * 1024) throw new Error('background images must be 30 MB or smaller');
        if (song && song.size > 50 * 1024 * 1024) throw new Error('music files must be 50 MB or smaller');
        const drafts = await readDrafts();
        const draft = {
            id: `draft-${Date.now()}`, name: value.name || 'untitled draft', creator: value.creator,
            description: value.description, accent: value.accent, text: value.text, bgColor: value.bgColor,
            bg: bg ? await fileToDataUrl(bg) : '', song: song ? await fileToDataUrl(song) : '',
        };
        drafts.unshift(draft);
        await writeDb('drafts', drafts.slice(0, 20));
        await refreshDraftSelect();
        document.getElementById('themeFormNote').textContent = 'draft saved in this browser';
    }
    async function loadDraft() {
        const id = document.getElementById('themeDraftSelect').value;
        const draft = (await readDrafts()).find(item => item.id === id);
        if (!draft) return;
        nameInput.value = draft.name || ''; document.getElementById('themeCreator').value = draft.creator || '';
        document.getElementById('themeDescription').value = draft.description || '';
        accentInput.value = draft.accent || '#ffd75e'; textInput.value = draft.text || '#fff4e0'; bgColorInput.value = draft.bgColor || '#1e1a16';
        document.getElementById('themeButtonLayout').value = draft.buttonLayout || 'default';
        fileInput.value = ''; musicInput.value = '';
        const restoreFile = (input, data, name, fallbackType) => {
            if (!data) return;
            const bytes = dataUrlBytes(data);
            const type = data.slice(5, data.indexOf(';')) || fallbackType;
            const transfer = new DataTransfer();
            transfer.items.add(new File([bytes], name, { type })); input.files = transfer.files;
        };
        try { restoreFile(fileInput, draft.bg, 'theme-background', 'image/png'); } catch {}
        try { restoreFile(musicInput, draft.song, 'theme-music', 'audio/mpeg'); } catch {}
        if (draft.bg) preview.style.backgroundImage = `url("${draft.bg}")`;
        updatePreview(); document.getElementById('themeFormNote').textContent = 'draft loaded; reselect media files if you want to edit them';
    }

    function renderStats() {
        const grid = document.getElementById('themeStats');
        const currentCustom = customThemes().find(theme => theme.id === localStorage.getItem('pu_theme_custom'));
        const current = currentCustom?.name || localStorage.getItem('pu_theme') || PU_THEMES[0].name;
        const rows = [
            ['current theme', current],
            ['installed themes', new Set([...installedThemes(), ...customThemes().map(theme => theme.id)]).size],
            ['themes you created', customThemes().length],
            ['theme changes on this device', Number(localStorage.getItem(countKey) || 0)],
        ];
        grid.replaceChildren();
        for (const [label, value] of rows) {
            const row = document.createElement('div');
            row.className = 'theme-stat';
            const title = document.createElement('span');
            title.textContent = label;
            const count = document.createElement('strong');
            count.textContent = String(value);
            row.append(title, count);
            grid.appendChild(row);
        }
    }

    function renderAll() {
        renderMine();
        renderDiscover();
        if (selectedTab === 'stats') renderStats();
    }

    document.getElementById('themeBtn').addEventListener('click', () => showPage('themes'));
    document.getElementById('themeBack').addEventListener('click', () => showPage('home'));
    tabs.addEventListener('click', event => {
        const button = event.target.closest('[data-theme-tab]');
        if (button) selectTab(button.dataset.themeTab);
    });
    document.getElementById('themeSearch').addEventListener('input', () => { discoverLimit = 12; renderDiscover(); });
    document.getElementById('themeSort').addEventListener('change', () => { discoverLimit = 12; renderDiscover(); });

    const form = document.getElementById('themeCreateForm');
    const preview = document.getElementById('themePreview');
    const previewTitle = preview.querySelector('.preview-title');
    const nameInput = document.getElementById('themeName');
    const fileInput = document.getElementById('themeBackground');
    const musicInput = document.getElementById('themeMusic');
    const accentInput = document.getElementById('themeAccent');
    const textInput = document.getElementById('themeText');
    const bgColorInput = document.getElementById('themeColorBg');
    const buttonLayoutInput = document.getElementById('themeButtonLayout');
    function updatePreview() {
        previewTitle.textContent = nameInput.value.trim() || 'my theme';
        preview.style.color = textInput.value;
        preview.style.backgroundColor = bgColorInput.value;
        preview.style.borderColor = accentInput.value;
        preview.dataset.layout = buttonLayoutInput.value;
        for (const button of preview.querySelectorAll('.preview-buttons i')) button.style.borderColor = accentInput.value;
    }
    for (const input of [nameInput, accentInput, textInput, bgColorInput, buttonLayoutInput]) input.addEventListener('input', updatePreview);
    buttonLayoutInput.addEventListener('change', updatePreview);
    fileInput.addEventListener('change', () => {
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        const file = fileInput.files?.[0];
        if (!file) return;
        previewObjectUrl = URL.createObjectURL(file);
        preview.style.backgroundImage = `url("${previewObjectUrl}")`;
    });
    const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
            const total = PU_THEMES.filter(theme => {
                const q = document.getElementById('themeSearch').value.trim().toLowerCase();
                return theme.name.toLowerCase().includes(q);
            }).length;
            if (discoverLimit < total) { discoverLimit += 12; renderDiscover(); }
        }
    });
    observer.observe(document.getElementById('themeDiscoverMore'));
    document.getElementById('themeSaveDraft').addEventListener('click', async () => {
        const note = document.getElementById('themeFormNote');
        try { await saveDraft(); }
        catch (error) { note.textContent = error.message || 'could not save draft in browser storage'; }
    });
    document.getElementById('themeLoadDraft').addEventListener('click', () => loadDraft().catch(() => {}));
    document.getElementById('themeDeleteDraft').addEventListener('click', async () => {
        const select = document.getElementById('themeDraftSelect');
        if (!select.value) return;
        const drafts = (await readDrafts()).filter(draft => draft.id !== select.value);
        await writeDb('drafts', drafts); await refreshDraftSelect();
        document.getElementById('themeFormNote').textContent = 'draft deleted';
    });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const note = document.getElementById('themeFormNote');
        const file = fileInput.files?.[0];
        const musicFile = musicInput.files?.[0];
        if (file && file.size > 30 * 1024 * 1024) {
            note.textContent = 'background images must be 30 MB or smaller';
            return;
        }
        if (musicFile && musicFile.size > 50 * 1024 * 1024) {
            note.textContent = 'music files must be 50 MB or smaller';
            return;
        }
        let bg = document.querySelector('.bgimg').src;
        if (file) {
            try { bg = await fileToDataUrl(file); }
            catch { note.textContent = 'could not read that image'; return; }
        }
        let song = '';
        if (musicFile) {
            try { song = await fileToDataUrl(musicFile); }
            catch { note.textContent = 'could not read that music file'; return; }
        }
        const theme = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            custom: true,
            name: nameInput.value.trim(),
            creator: document.getElementById('themeCreator').value.trim() || 'local creator',
            description: document.getElementById('themeDescription').value.trim(),
            bg,
            song,
            buttonLayout: buttonLayoutInput.value,
            colors: { bg: bgColorInput.value, accent: accentInput.value, text: textInput.value, muted: '#b8a89a' },
        };
        try {
            const saved = [...customThemes(), theme];
            await writeDb('custom', saved);
            customCache = saved;
            localStorage.setItem(CUSTOM_KEY, '[]');
            localStorage.setItem(INSTALLED_KEY, JSON.stringify([...new Set([...installedThemes(), theme.id])]));
            window.applyPuTheme(theme);
            note.textContent = 'theme saved and installed in this browser';
            form.reset();
            if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
            previewObjectUrl = '';
            preview.style.backgroundImage = '';
            updatePreview();
            renderAll();
            selectTab('mine');
        } catch {
            note.textContent = 'could not save in browser storage; try a smaller file';
        }
    });

    loadPersistedThemes();

    selectTab('mine');
    renderAll();
})();
