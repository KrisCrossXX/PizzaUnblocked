/* GPU texture cap for the Butterscotch ports. The wads warm up ~370 texture
   pages (mostly 2048x2048 ≈ 16MB each) at boot, which blows past the browser's
   VRAM budget: page allocations start failing -> sprites come back blank
   (missing Peppino/Noise), and on weaker GPUs the WebGL context is lost
   entirely -> black screen.
   There is no texture_flush builtin in the runner, so instead we shrink every
   oversized upload at the GL boundary: texImage2D with a >1024px dimension
   gets box-downscaled before upload. Sprite UVs are normalized to the page's
   LOGICAL size, so a half-size upload samples identically — just softer. */
(() => {
    const CAP = 1024;
    function down(px, w, h, ch) {
        const nw = w >> 1, nh = h >> 1;
        const out = new Uint8Array(nw * nh * ch);
        for (let y = 0; y < nh; y++) {
            const s0 = (y * 2) * w * ch, s1 = s0 + w * ch, d0 = y * nw * ch;
            for (let x = 0; x < nw; x++) {
                const si = s0 + x * 2 * ch, sj = s1 + x * 2 * ch, di = d0 + x * ch;
                for (let c = 0; c < ch; c++)
                    out[di + c] = (px[si + c] + px[si + ch + c] + px[sj + c] + px[sj + ch + c]) >> 2;
            }
        }
        return out;
    }
    function wrap(proto) {
        if (!proto || proto.__puTexCap) return;
        const orig = proto.texImage2D;
        proto.texImage2D = function (target, level, internalformat, w, h, border, format, type, pixels) {
            if (arguments.length === 9 && (w > CAP || h > CAP) &&
                pixels instanceof Uint8Array && type === 0x1401) {   // UNSIGNED_BYTE
                const ch = format === 0x1908 ? 4 : format === 0x1907 ? 3 : format === 0x190A ? 2 : 4;
                while (w > CAP || h > CAP) { pixels = down(pixels, w, h, ch); w >>= 1; h >>= 1; }
            }
            return orig.apply(this, arguments);
        };
        proto.__puTexCap = true;
    }
    wrap(self.WebGLRenderingContext && WebGLRenderingContext.prototype);
    wrap(self.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
})();
