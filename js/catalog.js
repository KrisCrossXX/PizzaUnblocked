/* Catalog — entries show up as cards on the mods/extras pages.
   dir = folder under games/ containing a web port (index.html + runner files).
   img = thumbnail under assets/. */

const MODS = [
    { name: 'pizza tower: scoutdigo', desc: 'full scoutdigo mod', dir: 'scoutdigo', img: 'assets/thumb-scoutdigo.png' },
];

const FANGAMES = [
    // { name: 'sugary spire', desc: 'fangame', dir: 'sugaryspire', img: 'assets/thumb-ss.png' }, — pending better build
];

/* Changelog entries shown in the changelog popup.
   groups = array of { label, items[] } rendered in order. */
const CHANGELOG = [
    {
        title: 'update 0.2',
        date: 'october 15, 2026',
        groups: [
            { label: 'new ports', items: [
                'pizza tower 1.1.0 — official-runner web build (real sprites + audio)',
                'pizza tower: scoutdigo',
                'sugary spire',
            ]},
            { label: 'bug fixes', items: [
                'peppino renders correctly (swapped butterscotch build for the official runner)',
                'game audio works (fmod → real gm audio worklet)',
                'game canvas no longer squashed in the corner',
                'pillar decorations no longer show a gray box',
            ]},
            { label: 'new features', items: [
                'settings + changelog popups',
                'menu sound effects',
            ]},
        ],
    },
    {
        title: 'update 0.1',
        date: 'october 15, 2026',
        groups: [
            { label: 'new features', items: [
                'site launch — pizza tower web port via butterscotch',
                'homepage, mods page, theme music',
            ]},
        ],
    },
];
