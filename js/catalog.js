/* Catalog — entries show up as cards on the mods/extras pages.
   dir = folder under games/ containing a web port (index.html + runner files).
   img = thumbnail under assets/. */

const MODS = [
    { name: 'pizza tower: scoutdigo', desc: 'full scoutdigo mod', dir: 'scoutdigo', img: 'assets/thumb-scoutdigo.png' },
    { name: 'pizza tower: co-op', desc: 'online co-op mod', dir: 'coop', img: 'assets/thumb-coop.png' },
    { name: 'cheesed up (old)', desc: 'classic build', dir: 'cheesedupold', img: 'assets/thumb-cheesedup.jpg' },
    { name: 'loco tower', desc: '', dir: 'locotower', img: 'assets/thumb-loco.png' },
    { name: 'stuffed crust', desc: '', dir: 'stuffedcrust', img: 'assets/thumb-stuffed.png' },
    { name: "chef's kiss", desc: '', dir: 'chefskiss', img: 'assets/thumb-chefskiss.png' },
    { name: 'final round', desc: '', dir: 'finalround', img: 'assets/thumb-finalround.png' },
    { name: 'pizza massacre', desc: '', dir: 'pizzamassacre', img: 'assets/thumb-pizzamassacre.png' },
    { name: 'swabs expedition', desc: '', dir: 'swabs', img: 'assets/thumb-swabs.png' },
    { name: 'super bo noise', desc: '', dir: 'superbonoise', img: 'assets/thumb-sbn.png' },
    { name: 'sage 19 plus', desc: 'sage 2019 demo', dir: 'sage19plus', img: 'assets/thumb-ss.png' },
    { name: 'pizza tower: meta', desc: '', dir: 'ptmeta', img: 'assets/thumb-pts.png' },
    { name: 'frenzy worlds', desc: '', dir: 'frenzyworlds', img: 'assets/thumb-frenzy.png' },
    { name: 'septastic', desc: '', dir: 'septastic', img: 'assets/thumb-pizzamassacre.png' },
    // desktop data.win swaps (games/cheesypizza, games/elm, games/ptlap) can't
    // run on the web runner — different wad/vm format. files left in games/.
];

const FANGAMES = [
    { name: 'sugary spire', desc: '', dir: 'sugaryspire', img: 'assets/thumb-ss.png' },
    { name: 'pat the peppino', desc: '', dir: 'patpeppino', img: 'assets/thumb-pat.png' },
    { name: 'kill the noise', desc: '', dir: 'killnoise', img: 'assets/thumb-killnoise.gif' },
    { name: 'john wick vs lario', desc: '', dir: 'jwvl', img: 'assets/thumb-jwl.png' },
    { name: 'internship', desc: '', dir: 'internship', img: 'assets/thumb-internship.jpg' },
    { name: "five nights at peppino's", desc: '', dir: 'fnap', img: 'assets/thumb-fnap.png' },
    { name: 'vigilante build', desc: 'old pt build', dir: 'ptwv', img: 'assets/thumb-pts.png' },
    { name: 'demo 1 engine', desc: 'pt fangame engine', dir: 'demo1', img: 'assets/thumb-pts.png' },
    { name: 'toadlegette revolution', desc: '', dir: 'toadlegette', img: 'assets/thumb-ss.png' },
    { name: 'pizza tower network', desc: 'online multiplayer', dir: 'ptn', img: 'assets/thumb-coop.png' },
    { name: 'rando-laps', desc: 'lap hell engine mod', dir: 'randolap', img: 'assets/thumb-loco.png' },
    { name: 'hungry pepperman', desc: '', dir: 'pepperman', img: 'assets/thumb-pat.png' },
    { name: 'punch-out!! pt edition', desc: '', dir: 'popte', img: 'assets/thumb-pts.png' },
    { name: "peppino's party at the tower", desc: '', dir: 'partytower', img: 'assets/thumb-pts.png' },
    { name: 'pat the peppino: expansion', desc: '', dir: 'patpeppinox', img: 'assets/thumb-pat.png' },
    { name: 'stupid spire', desc: '', dir: 'stupidspire', img: 'assets/thumb-ss.png' },
    { name: 'flappy peppino', desc: '', dir: 'flappypeppino', img: 'assets/thumb-pts.png' },
    { name: 'tower pasta', desc: '', dir: 'towerpasta', img: 'assets/thumb-frenzy.png' },
    { name: 'noise crusher', desc: 'level editor demo', dir: 'noisecrusher', img: 'assets/thumb-killnoise.gif' },
    { name: "cooldude's lap mod", desc: 'lap mod v1.7', dir: 'ptlapmod', img: 'assets/thumb-loco.png' },
];

/* Changelog entries shown in the changelog popup.
   groups = array of { label, items[] } rendered in order. */
const CHANGELOG = [
    {
        title: 'update 0.4',
        date: 'october 16, 2026',
        groups: [
            { label: 'new ports', items: [
                'cheesed up (old)',
                'loco tower',
                'stuffed crust',
                "chef's kiss",
                'final round',
                'pizza massacre',
                'sage 19 plus',
                'pizza tower: meta',
                'frenzy worlds',
                'septastic',
                'vigilante build',
                'demo 1 engine',
                'toadlegette revolution',
                'pizza tower network',
                'rando-laps',
                'hungry pepperman',
                'punch-out!! pt edition',
                "peppino's party at the tower",
                'pat the peppino: expansion',
                'stupid spire',
                'flappy peppino',
                'tower pasta',
                'noise crusher',
                "cooldude's lap mod",
            ]},
            { label: 'bug fixes', items: [
                'crash watchdog no longer panics over fullscreen/permission errors',
                'recovered 6 lost ports from the archive',
            ]},
        ],
    },
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
