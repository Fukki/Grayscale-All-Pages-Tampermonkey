// ==UserScript==
// @name         Grayscale All Pages
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  เปลี่ยนทุกหน้าเว็บไซต์เป็นขาวดำ (grayscale). Toggle ด้วย Shift+G
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(async function() {
    'use strict';

    const DEFAULT_ENABLED = true;
    const STORAGE_KEY = 'grayscale_enabled_v1';
    const EXCLUDE_HOSTS = [
        // เช่น 'youtube.com', 'example.com'
    ];

    function isExcluded(host) {
        if (!host) return false;
        return EXCLUDE_HOSTS.some(ex => host === ex || host.endsWith('.' + ex));
    }

    const STYLE_ID = 'tm-grayscale-style-v1';
    const css = `
        html, body {
            -webkit-filter: grayscale(100%) !important;
            filter: grayscale(100%) !important;
            transition: filter 0.2s ease !important;
        }
        img, video, svg, canvas {}
        .no-grayscale {
            -webkit-filter: none !important;
            filter: none !important;
        }
    `;

    function addStyle() {
        if (!document.getElementById(STYLE_ID)) {
            const style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
        }
    }
    function removeStyle() {
        const el = document.getElementById(STYLE_ID);
        if (el) el.remove();
    }

    function showOverlayMessage(text, color = '#00ff88') {
        let el = document.createElement('div');
        el.textContent = text;
        Object.assign(el.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.7)',
            color: color,
            fontSize: '2em',
            fontWeight: 'bold',
            padding: '0.6em 1.4em',
            borderRadius: '0.8em',
            zIndex: 999999,
            textAlign: 'center',
            opacity: '1',
            transition: 'opacity 0.8s ease',
            pointerEvents: 'none',
            fontFamily: 'sans-serif',
        });
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; }, 800);
        setTimeout(() => { el.remove(); }, 1600);
    }

    let enabled = await GM_getValue(STORAGE_KEY, DEFAULT_ENABLED);
    if (isExcluded(location.host)) enabled = false;

    if (enabled) addStyle();

    GM_registerMenuCommand(enabled ? 'Turn grayscale OFF' : 'Turn grayscale ON', async () => {
        enabled = !enabled;
        await GM_setValue(STORAGE_KEY, enabled);
        enabled ? addStyle() : removeStyle();
        showOverlayMessage(enabled ? '🟢 Grayscale ON' : '🔴 Grayscale OFF', enabled ? '#00ff88' : '#ff5555');
    });

    window.addEventListener('keydown', async e => {
        if (e.shiftKey && e.code === 'KeyG') {
            const tag = e.target?.tagName || '';
            if (['INPUT', 'TEXTAREA'].includes(tag) || e.target.isContentEditable) return;
            enabled = !enabled;
            await GM_setValue(STORAGE_KEY, enabled);
            enabled ? addStyle() : removeStyle();
            showOverlayMessage(enabled ? '🟢 Grayscale ON' : '🔴 Grayscale OFF', enabled ? '#00ff88' : '#ff5555');
        }
    });

    const observer = new MutationObserver(() => {
        if (enabled && !document.getElementById(STYLE_ID)) addStyle();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
