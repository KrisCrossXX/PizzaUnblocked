// credits page — site credits + per-game credits (toby-style card grid)
const SITE_CREDITS = [
    { name: 'floridiann', role: 'made the site', img: 'https://cdn.discordapp.com/avatars/1546007490624364647/9f159cd4a895dad5df44a91a4cee02d3.webp?size=128' },
    { name: 'devin', role: 'site dev, parts and bugfixes', img: 'assets/pfp-devin.png' },
    { name: 'chatgpt', role: 'site dev help', img: 'assets/pfp-chatgpt.png' },
    { name: 'mcpig', role: 'made pizza tower', img: 'assets/pfp-mcpig.png' },
];

// helpers — tiny cards under the main row
const SITE_HELPERS = [
    { name: 'theo ry', role: 'beta testing', img: 'https://cdn.discordapp.com/avatars/777722251222450186/bdd79047caa6bdaa4c1dd91ef2fbf5bd.webp?size=128' },
    { name: 'aqua', role: 'beta testing', img: 'https://cdn.discordapp.com/avatars/837075774905253988/7e6d70fc608b7d2ed72244e184ecc662.webp?size=128' },
    { name: 'eram', role: 'beta testing', img: 'https://cdn.discordapp.com/avatars/1280301110992699477/7cd6305aa5b951d993cf7b60d9b4294d.webp?size=128' },
];

// name must match the catalog name — thumbnails are pulled from MODS/EXTRAS
const GAME_CREDITS = {
    'pizza tower': 'tour de pizza',
    // mods
    'pizza tower: scoutdigo': 'scoutthesnow & only1indigo',
    'pizza tower: co-op': 'the co-op team',
    'cheesed up (old)': 'token studios',
    'loco tower': 'pikmin2wiiversion (yo) & team lt',
    'stuffed crust': 'blaize mayes & team',
    "chef's kiss": 'squishitt & the chef\u2019s kiss team',
    'final round': 'sebas & compwnter',
    'pizza massacre': 'team reslashed',
    'swabs expedition': 'voidymite / chimp lair studios',
    'super bo noise': 'desert team',
    'sage 19 plus': 'tour de pizza (sage 2019 demo)',
    'pizza tower: meta': 'mrcrabapples & guythemind',
    'frenzy worlds': 'desayuno',
    'septastic': 'septastic team',
    'weenie cop': 'mcpig (pre-pt project)',
    'virdesert': 'mr.grape / desert team',
    'demo 3': 'tour de pizza (leaked dev build)',
    'pt: gba edition': 'mineken713',
    'pt: april 2021 build': 'tour de pizza (early build)',
    // extras
    'sugary spire': 'big gnome studios / sugary spire council',
    'pat the peppino': 'scrufftuna',
    'kill the noise': 'andresbamb',
    'john wick vs lario': 'jegneg',
    'internship': 'kvassalty',
    "five nights at peppino's": 'gamexmega',
    'vigilante build': 'tour de pizza (old build)',
    'demo 1 engine': 'kaytea42 decomp + tour de pizza',
    'pizza tower network': 'scratch network team',
    'rando-laps': 'pte lap modders',
    'hungry pepperman': 'se\u00f1or t',
    'punch-out!! pt edition': 'scratchtac',
    "peppino's party at the tower": 'myers tuber',
    'pat the peppino: expansion': 'warcamoguy',
    'flappy peppino': 'jimothy',
    'tower pasta': 'superretro64',
    'noise crusher': 'kendres',
    "cooldude's lap mod": 'cooldude',
    'pizza tower network 2': 'scratch network team',
    'mininoise': 'dragonaero',
    'too big to fail': 'grayson r. & charystuj',
    "one nights at peppino's": 'onap scratch team',
    'smash bash brawl 2': 'linkthepale',
};

const GAME_CREDIT_LINKS = {
    'pizza tower': 'https://store.steampowered.com/app/2231450/Pizza_Tower/',
    'pizza tower: scoutdigo': 'https://gamebanana.com/mods/508230',
    'pizza tower: co-op': 'https://gamebanana.com/mods/501524',
    'cheesed up (old)': 'https://pizzatowermods.miraheze.org/wiki/Pizza_Tower:_Cheesed_Up',
    'stuffed crust': 'https://pizza-tower-mods.fandom.com/wiki/Pizza_Tower:_Stuffed_Crust',
    'pizza massacre': 'https://gamebanana.com/wips/94939',
    'pizza tower: meta': 'https://mrcrabapples.itch.io/pizza-tower-meta',
    'septastic': 'https://github.com/BananaBoiGames/PizzaTowerSeptasticDecompilation',
    'weenie cop': 'https://isthisreality.itch.io/wiener-dont-use-drugs-weenie-cop-reshared',
    'virdesert': 'https://pizza-tower-mods.fandom.com/wiki/VirDesert',
    'pt: gba edition': 'https://zee-scoot.itch.io/pizzatoweronthegba',
    'loco tower': 'https://yoyoyoioyo.itch.io/do-it-for-loco',
    "chef's kiss": 'https://pizza-tower-chefs-kiss.itch.io/chefs-kiss',
    'final round': 'https://finalround.itch.io/',
    'swabs expedition': 'https://voidymite.itch.io/swabs-expedition',
    'super bo noise': 'https://puffballspeakerbox.itch.io/super-bo-noise',
    'frenzy worlds': 'https://www.youtube.com/@FrenzyWorldsOfficial',
    'sage 19 plus': 'https://pizza-tower-19-plus.itch.io/pizza-tower-19-plus-sage-2024-demo',
    'demo 3': 'https://store.steampowered.com/app/2231450/Pizza_Tower/',
    'pt: april 2021 build': 'https://store.steampowered.com/app/2231450/Pizza_Tower/',
    'vigilante build': 'https://store.steampowered.com/app/2231450/Pizza_Tower/',
    'internship': 'https://thenoisequagmire.itch.io/internship-demo-2',
    "five nights at peppino's": 'https://gamejolt.com/games/fnap/898601',
    'pizza tower network': 'https://ptnscratchedofficial.itch.io/',
    'sugary spire': 'https://sugary-spire.itch.io/',
    'pat the peppino': 'https://scrufftuna.itch.io/pat-the-peppino',
    'kill the noise': 'https://andresbamb.itch.io/kill-the-noise',
    'john wick vs lario': 'https://jegneg.itch.io/john-wick-vs-lario',
    'demo 1 engine': 'https://github.com/kaytea42/Pizza-Tower-Demo-1-Engine',
    'rando-laps': 'https://scratchisstrict-itch.itch.io/rando-lap',
    'hungry pepperman': 'https://tomivargas.itch.io/hungry-pepperman-deluxe-demo',
    'punch-out!! pt edition': 'https://scratchtac.itch.io/popte',
    "peppino's party at the tower": 'https://myerstuberbutbettercn.itch.io/peppinos-party-at-the-tower',
    'pat the peppino: expansion': 'https://warcamoguy.itch.io/pat-the-peppino-expansion-pack-demo',
    'flappy peppino': 'https://jimzark.itch.io/pizza-tower-flappy-peppino',
    'noise crusher': 'https://kendreskg.itch.io/noisecrusher-level-editor-demo',
    "cooldude's lap mod": 'https://cooldude78.itch.io/pizza-tower-engine-cooldudes-lap-mod-v17',
    'pizza tower network 2': 'https://ptnscratchedofficial.itch.io/pizza-tower-network-2',
    'tower pasta': 'https://superretro64.itch.io/towerpasta-game-1',
    "one nights at peppino's": 'https://epic-le-green25.itch.io/one-nights-at-peppinos-pizza',
    'mininoise': 'https://dragonaero.itch.io/mininoise',
    'too big to fail': 'https://real-legobuzz12.itch.io/toobigtofail',
    'smash bash brawl 2': 'https://linkthepalesystem64.itch.io/smash-bash-brawl-2',
};

function renderCredits() {
    const site = document.getElementById('crSite');
    const games = document.getElementById('crGames');
    if (!site || !games) return;
    site.innerHTML = '';
    for (const c of SITE_CREDITS) {
        const card = document.createElement('div');
        card.className = 'cr-card';
        card.innerHTML =
            (c.img ? `<img class="cr-ava" src="${c.img}" alt="">` : `<span class="cr-ava cr-letter">${c.name[0]}</span>`) +
            `<span class="cr-info"><span class="cr-name">${c.name}</span><span class="cr-role">${c.role}</span></span>`;
        site.appendChild(card);
    }
    const helpers = document.createElement('div');
    helpers.className = 'cr-row cr-row-tiny';
    site.parentNode.insertBefore(helpers, site.nextSibling);
    for (const c of SITE_HELPERS) {
        const card = document.createElement('div');
        card.className = 'cr-card cr-tiny';
        card.innerHTML =
            (c.img ? `<img class="cr-ava" src="${c.img}" alt="">` : `<span class="cr-ava cr-letter">${c.name[0]}</span>`) +
            `<span class="cr-info"><span class="cr-name">${c.name}</span><span class="cr-role">${c.role}</span></span>`;
        helpers.appendChild(card);
    }
    // game credits — pull thumbnails from the catalog so cards match
    games.innerHTML = '';
    const all = [{ name: 'pizza tower', img: 'assets/btn-pizzatower.png' }, ...MODS, ...FANGAMES];
    for (const g of all) {
        const card = document.createElement('a');
        card.className = 'cr-card cr-game';
        const destination = GAME_CREDIT_LINKS[g.name];
        card.href = destination || 'https://www.google.com/search?q=' + encodeURIComponent('"' + g.name + '" ' + (GAME_CREDITS[g.name] || '') + ' game original page');
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.title = destination ? 'Open game or creator page (new tab)' : 'Find original game page (new tab)';
        card.innerHTML =
            `<img class="cr-ava" src="${g.img}" alt="">` +
            `<span class="cr-info"><span class="cr-name">${g.name}</span><span class="cr-role">${GAME_CREDITS[g.name] || 'unknown'}</span><span class="cr-link-label">${destination ? 'game / creator page' : 'find original page'} ↗</span></span>`;
        games.appendChild(card);
    }
}
renderCredits();
