/* Catalog — entries show up as cards on the mods/extras pages.
   dir = folder under games/ containing a web port (index.html + runner files).
   img = thumbnail under assets/. */

const MODS = [
    { name: 'pizza tower: scoutdigo', desc: 'full scoutdigo mod', dir: 'scoutdigo', img: 'assets/thumb-scoutdigo.png' },
    { name: 'pizza tower: co-op', desc: 'online co-op mod', dir: 'coop', img: 'assets/thumb-coop.png' },
    { name: 'swabs expedition', desc: '', dir: 'swabs', img: 'assets/thumb-swabs.png' },
    { name: 'super bo noise', desc: '', dir: 'superbonoise', img: 'assets/thumb-sbn.png' },
    { name: 'pt: cheesed up', desc: '', dir: 'cheesypizza', img: 'assets/thumb-cheesypizza.png' },
    { name: "egg's lap mod", desc: 'lap 3+4 overhaul', dir: 'elm', img: 'assets/thumb-elm.png' },
];

const FANGAMES = [
    { name: 'sugary spire', desc: '', dir: 'sugaryspire', img: 'assets/thumb-ss.png' },
    { name: 'pat the peppino', desc: '', dir: 'patpeppino', img: 'assets/thumb-pat.png' },
    { name: 'kill the noise', desc: '', dir: 'killnoise', img: 'assets/thumb-killnoise.gif' },
    { name: 'john wick vs lario', desc: '', dir: 'jwvl', img: 'assets/thumb-jwl.png' },
    { name: 'internship', desc: '', dir: 'internship', img: 'assets/thumb-internship.jpg' },
];

/* Changelog entries shown in the changelog popup.
   groups = array of { label, items[] } rendered in order. */
const CHANGELOG = [
    {
        title: 'update 0.3',
        date: 'october 15, 2026',
        groups: [
            { label: 'new ports', items: [
                'pizza tower: co-op',
                'swabs expedition',
                'super bo noise',
                'sugary spire',
                'pat the peppino',
                'kill the noise',
                'john wick vs lario',
            ]},
            { label: 'bug fixes', items: [
                'mods no longer render squashed in the corner',
            ]},
            { label: 'new features', items: [
                'single file download — whole site as one html',
                'discord button',
            ]},
        ],
    },
    {
        title: 'update 0.2',
        date: 'october 15, 2026',
        groups: [
            { label: 'new ports', items: [
                'pizza tower 1.1.0 — official-runner web build (real sprites + audio)',
                'pizza tower: scoutdigo',
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
