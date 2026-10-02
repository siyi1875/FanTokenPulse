// $PSG Pulse — dashboard logic (FanTokens design system)
// Data: Binance (primary) -> Fan Token Intel fallback; CoinGecko for market cap.

const BINANCE_API = 'https://api.binance.com/api/v3';
const PSG_PAIR = 'PSGUSDT';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const PSG_TOKEN_ID = 'paris-saint-germain-fan-token';
const FTI_DATA_URL = 'data/fti.json';

// Optional CORS proxies (last resort for CoinGecko market cap only).
const CORS_PROXIES = ['https://corsproxy.io/?', 'https://api.allorigins.win/raw?url='];

const LAUNCH_DATE = new Date('2020-11-01').getTime();

// ------------------------------------------------------------------ Design maps
const GROUPS = {
    token:   { tag: 'tag-token',   dot: '#D1EC00', ring: '#75820C' },
    up:      { tag: 'tag-up',      dot: '#008A00', ring: '#008A00' },
    down:    { tag: 'tag-down',    dot: '#E70314', ring: '#E70314' },
    blue:    { tag: 'tag-blue',    dot: '#0076F4', ring: '#0076F4' },
    warn:    { tag: 'tag-warn',    dot: '#FF8A00', ring: '#FF8A00' },
    neutral: { tag: 'tag-neutral', dot: '#8B8B8B', ring: '#8B8B8B' },
};

const TYPE_META = {
    'exchange':     { kind: 'Exchange',   group: 'token' },
    'milestone':    { kind: 'Milestone',  group: 'token' },
    'match-win':    { kind: 'Win',        group: 'up' },
    'trophy':       { kind: 'Trophy',     group: 'up' },
    'match-loss':   { kind: 'Loss',       group: 'down' },
    'trophy-loss':  { kind: 'Title lost', group: 'down' },
    'departure':    { kind: 'Departure',  group: 'down' },
    'signing':      { kind: 'Signing',    group: 'blue' },
    'rumor':        { kind: 'Rumor',      group: 'warn' },
    'match-draw':   { kind: 'Draw',       group: 'neutral' },
    'burn':         { kind: 'Burn',       group: 'token' },
};

const CATEGORY_LABEL = { crypto: 'Crypto', games: 'Match', transfers: 'Transfer' };

// ------------------------------------------------------------------ Token burns
// Burns are read live from Chiliz Chain (transfers of $PSG to the zero address),
// so a new burn appears on the chart without a code change.
const CHILIZ_EXPLORER = 'https://explorer.chiliz.com';
const PSG_CONTRACT = '0x6fc212cdE3b420733A88496CbdbB15d85beAb1Ca';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Match context for the verified Socios performance burns
// (10,000 $PSG per goal + 20,000 per win). `event` is the short name shown in
// the Token Burns card; `match` reads naturally inside the timeline sentence.
const BURN_EVENTS = {
    '2021-01-13': { event: 'Trophée des Champions · PSG 2-1 Marseille', match: 'Trophée des Champions win over Marseille (2-1)' },
    '2021-01-16': { event: 'Ligue 1 · PSG 1-0 Angers', match: '1-0 Ligue 1 win over Angers' },
    '2021-02-07': { event: 'Ligue 1 · Marseille 0-2 PSG', match: '2-0 Le Classique win at Marseille' },
};
const BURNS_ALL_URL = `${CHILIZ_EXPLORER}/address/${ZERO_ADDRESS}/tokens/${PSG_CONTRACT}/token-transfers`;

// Verified on-chain (Oct 2026). Used only if the explorer can't be reached.
const BURN_FALLBACK = {
    minted: 20000000,
    burns: [
        { date: '2021-01-13', amount: 40000, txs: ['0x7e66e9ff3f6eab81b2807179abf3c4915b39bdb07a0de2c5a021958844bbb9e4', '0xd313321fa226814c63b8283743f8cb0bd761d33d870c5197c1e4d8fa6fe41349', '0xe9edf884440894b3f3ce32135b28c7df7209da5e8ac38601f580923f444285d3'] },
        { date: '2021-01-16', amount: 30000, txs: ['0x0ff3ad28224751f98562210a1d384d16d41a7d10edfe460e8bc80662fd3c5c0a'] },
        { date: '2021-02-07', amount: 40000, txs: ['0xec6d00adda76ac077c54e7a3d64502f86048ac31685401fbcd9c3c97abb194d8', '0xd8c612194198cf01eb4f3f4645c4911b0a21305fc54eccc76cae8120d7ea75c3'] },
    ],
};

// ------------------------------------------------------------------ Curated events
// Token launched Nov 2020. Labels are emoji-free; recent matches are auto-merged
// from Fan Token Intel at runtime (mergeFtiMatchEvents).
const keyEvents = [
    { date: '2020-12-21', label: 'Triple Exchange Listing', description: 'Binance, Paribu and Upbit list $PSG', type: 'exchange', filterCategory: 'crypto', priceChange: '+198%' },
    { date: '2021-04-13', label: 'UCL Semi-Final 1st Leg', description: 'Lost 1-2 to Manchester City', type: 'match-loss', filterCategory: 'games' },
    { date: '2021-04-15', label: 'All-Time High', description: 'Token reached $58.79', type: 'milestone', filterCategory: 'crypto' },
    { date: '2021-05-04', label: 'UCL Semi-Final 2nd Leg', description: 'Lost 0-2 to Manchester City, eliminated', type: 'match-loss', filterCategory: 'games' },
    { date: '2021-05-23', label: 'Ligue 1 2020/21', description: 'Lille win the title, PSG finish 2nd', type: 'trophy-loss', filterCategory: 'games' },
    { date: '2021-08-05', label: 'Messi Transfer Rumors Heat Up', description: 'Reports emerge Messi is leaving Barcelona, PSG the frontrunner', type: 'rumor', filterCategory: 'transfers' },
    { date: '2021-08-10', label: 'Messi Signs for PSG', description: 'Historic signing from Barcelona, plus Ramos, Hakimi and Donnarumma', type: 'signing', filterCategory: 'transfers' },
    { date: '2022-03-09', label: 'UCL R16 Elimination', description: 'Lost to Real Madrid on aggregate', type: 'match-loss', filterCategory: 'games' },
    { date: '2022-04-23', label: 'Ligue 1 Champions 2021/22', description: '10th Ligue 1 title', type: 'trophy', filterCategory: 'games' },
    { date: '2023-03-08', label: 'UCL R16 Elimination', description: 'Lost 0-2 to Bayern Munich on aggregate', type: 'match-loss', filterCategory: 'games' },
    { date: '2023-05-27', label: 'Ligue 1 Champions 2022/23', description: '11th title, unbeaten from the start', type: 'trophy', filterCategory: 'games' },
    { date: '2023-06-07', label: 'Messi Departs', description: 'Leaves for Inter Miami in MLS', type: 'departure', filterCategory: 'transfers' },
    { date: '2023-08-15', label: 'Neymar to Al Hilal', description: 'Transfer to the Saudi Pro League', type: 'departure', filterCategory: 'transfers' },
    { date: '2024-04-16', label: 'UCL QF Victory', description: 'Beat Barcelona 6-4 on aggregate', type: 'match-win', filterCategory: 'games' },
    { date: '2024-05-07', label: 'UCL SF Elimination', description: 'Lost 0-2 to Dortmund on aggregate', type: 'match-loss', filterCategory: 'games' },
    { date: '2024-05-10', label: 'Mbappé Announces Exit', description: 'Confirms his Real Madrid move', type: 'departure', filterCategory: 'transfers' },
    { date: '2024-05-12', label: 'Ligue 1 Champions 2023/24', description: '12th title, unbeaten away', type: 'trophy', filterCategory: 'games' },
    { date: '2024-06-03', label: 'Mbappé to Real Madrid', description: 'Signs a 5-year contract', type: 'departure', filterCategory: 'transfers' },
    { date: '2024-08-15', label: 'Major Signings', description: 'Neves €70M, Doué €50M, Pacho €40M', type: 'signing', filterCategory: 'transfers' },
    { date: '2025-02-27', label: 'UCL R16 Win vs Brest', description: 'Won 10-0 on aggregate (7-0 2nd leg)', type: 'match-win', filterCategory: 'games' },
    { date: '2025-03-19', label: 'UCL R16 Win vs Liverpool', description: 'Won on penalties (1-1 aggregate)', type: 'match-win', filterCategory: 'games' },
    { date: '2025-04-09', label: 'UCL QF Win vs Aston Villa', description: 'Advanced to the semi-finals', type: 'match-win', filterCategory: 'games' },
    { date: '2025-04-20', label: 'Ligue 1 Champions 2024/25', description: '13th title, 28-game unbeaten run', type: 'trophy', filterCategory: 'games' },
    { date: '2025-04-29', label: 'UCL SF Win vs Arsenal', description: 'Won both legs (1-0, 2-1)', type: 'match-win', filterCategory: 'games' },
    { date: '2025-05-31', label: 'UCL Champions', description: 'Won 5-0 vs Inter Milan - First European Cup', type: 'trophy', filterCategory: 'games' },
];

// ------------------------------------------------------------------ State
let priceChart = null;
let allPriceData = [];
let ftiData = null;
let activeFilters = ['crypto', 'games', 'transfers'];
let currentDays = '30'; // default range: 1M
const PAGE_SIZE = 12;
let visibleCount = PAGE_SIZE;

// ------------------------------------------------------------------ Init
document.addEventListener('DOMContentLoaded', async () => {
    const [, burnData] = await Promise.all([
        loadFtiData(),          // snapshot for event merge + fallbacks
        loadBurnData(),         // on-chain $PSG burns (fallback: verified list)
    ]);
    mergeFtiMatchEvents();      // merge recent matches into the timeline
    const burnRows = buildBurnRows(burnData);
    mergeBurnEvents(burnRows);  // add token burns as events
    renderBurnsCard(burnData, burnRows);
    renderTimeline(true);       // show events immediately
    setupEventListeners();

    await loadCurrentStats();
    await loadHistoricalData(); // computes event price changes, builds chart
    updateLastUpdatedTime();
});

async function loadFtiData() {
    try {
        const res = await fetch(FTI_DATA_URL, { cache: 'no-cache' });
        if (res.ok) ftiData = await res.json();
    } catch (err) {
        console.warn('FTI snapshot unavailable.', err);
    }
}

// ------------------------------------------------------------------ Event merge
function mergeFtiMatchEvents() {
    const matches = ftiData?.match_impact?.matches;
    if (!Array.isArray(matches) || matches.length === 0) return;

    // Only curated *matches* take precedence; a transfer or burn on the same day
    // shouldn't hide that day's FTI match.
    const existingDates = new Set(keyEvents.filter((e) => e.filterCategory === 'games').map((e) => e.date));
    matches.forEach((m) => {
        const date = (m.date || '').slice(0, 10);
        if (!date || existingDates.has(date)) return; // curated match wins

        const opponent = m.is_home ? m.away : m.home;
        const prefix = m.is_home ? 'vs' : 'at';
        const resultWord = m.result === 'win' ? 'Win' : m.result === 'loss' ? 'Loss' : 'Draw';

        let priceChange;
        if (m.return_total_pct != null && !isNaN(m.return_total_pct)) {
            const v = Number(m.return_total_pct);
            priceChange = `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
        }

        keyEvents.push({
            date,
            label: `${prefix} ${opponent}${m.score ? ' · ' + m.score : ''}`,
            description: `${m.competition || 'Match'} · ${resultWord}${m.is_derby ? ' · Derby' : ''}`,
            type: m.result === 'win' ? 'match-win' : m.result === 'loss' ? 'match-loss' : 'match-draw',
            filterCategory: 'games',
            priceChange,
            fti: true,
        });
        existingDates.add(date);
    });
}

// Read every $PSG transfer to/from the zero address: mints set the starting
// supply, transfers *to* zero are burns. Grouped by UTC day.
async function loadBurnData() {
    const url =
        `${CHILIZ_EXPLORER}/api?module=account&action=tokentx` +
        `&contractaddress=${PSG_CONTRACT}&address=${ZERO_ADDRESS}&sort=asc&offset=1000&page=1`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`Explorer ${res.status}`);
        const body = await res.json();
        if (!Array.isArray(body.result)) throw new Error(body.message || 'Unexpected explorer response');

        let minted = 0;
        const byDay = new Map();
        body.result.forEach((tx) => {
            const amount = Number(tx.value) / 10 ** Number(tx.tokenDecimal || 0);
            if (tx.from.toLowerCase() === ZERO_ADDRESS) {
                minted += amount;
            } else if (tx.to.toLowerCase() === ZERO_ADDRESS) {
                const date = new Date(Number(tx.timeStamp) * 1000).toISOString().slice(0, 10);
                const day = byDay.get(date) || { date, amount: 0, txs: [] };
                day.amount += amount;
                day.txs.push(tx.hash);
                byDay.set(date, day);
            }
        });
        if (!minted) throw new Error('No mint found');
        return { minted, burns: [...byDay.values()], live: true };
    } catch (err) {
        console.warn('Chiliz explorer unavailable — using verified burn list.', err);
        return { ...BURN_FALLBACK, live: false };
    } finally {
        clearTimeout(timer);
    }
}

// Oldest-first rows with the supply left after each burn. Shared by the chart,
// the timeline and the Token Burns card so all three show the same numbers.
function buildBurnRows(data) {
    if (!data || !Array.isArray(data.burns)) return [];
    let supply = data.minted;
    return [...data.burns]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((b) => {
            supply -= b.amount;
            const known = BURN_EVENTS[b.date];
            return {
                date: b.date,
                amount: b.amount,
                supplyAfter: supply,
                event: known ? known.event : 'On-chain burn',
                match: known ? known.match : null,
                txs: b.txs.filter((h) => /^0x[0-9a-f]{64}$/i.test(h)), // only well-formed hashes become links
            };
        });
}

function mergeBurnEvents(rows) {
    rows.forEach((r) => {
        const fmt = (n) => n.toLocaleString('en-US');
        const context = r.match
            ? `Performance burn for the ${r.match}: 10,000 per goal + 20,000 for the win.`
            : `${fmt(r.amount)} $PSG sent to the zero address on Chiliz Chain.`;
        keyEvents.push({
            date: r.date,
            label: `Token Burn · ${fmt(r.amount)} $PSG`,
            description: `${context} Supply now ${fmt(r.supplyAfter)}.`,
            type: 'burn',
            filterCategory: 'crypto',
            txs: r.txs,
        });
    });
}

// Sidebar "Token Burns" card: totals + one row per burn (newest first).
function renderBurnsCard(data, rows) {
    const card = document.getElementById('burnsCard');
    if (!card) return;
    if (!rows.length) {
        card.hidden = true;
        return;
    }
    const fmt = (n) => n.toLocaleString('en-US');
    const burned = rows.reduce((s, r) => s + r.amount, 0);
    const supply = data.minted - burned;
    const tiles = [
        { label: 'Total burned', value: fmt(burned) },
        { label: 'Total supply', value: fmt(supply) },
        { label: 'Burn events', value: String(rows.length) },
        { label: 'Share of supply burned', value: `${((burned / data.minted) * 100).toFixed(2)}%` },
    ];
    document.getElementById('burnStats').innerHTML = tiles
        .map((t) => `
        <div class="tile">
            <span class="tile-value">${t.value}</span>
            <span class="tile-label">${t.label}</span>
        </div>`)
        .join('');

    document.getElementById('burnList').innerHTML = [...rows]
        .reverse()
        .map((r) => {
            const date = new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
            return `
            <li class="burn-row">
                <div class="burn-row-top">
                    <span class="burn-amount">${fmt(r.amount)} $PSG</span>
                    <span class="burn-date">${date}</span>
                </div>
                <div class="burn-event">${escapeHtml(r.event)}</div>
                <div class="burn-meta">Supply after: ${fmt(r.supplyAfter)}</div>
                ${txLinksHtml(r.txs, 'Chiliz Chain')}
            </li>`;
        })
        .join('');

    document.getElementById('burnsAllLink').href = BURNS_ALL_URL;
    document.getElementById('burnsSource').textContent = data.live
        ? 'Live from the Chiliz Chain explorer.'
        : 'Explorer unreachable — showing the verified list (Oct 2026).';
    card.hidden = false;
}

// ------------------------------------------------------------------ Current stats
async function loadCurrentStats() {
    let loaded = false;
    try {
        const res = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${PSG_PAIR}`);
        if (!res.ok) throw new Error(`Binance ${res.status}`);
        const d = await res.json();
        setPrice(parseFloat(d.lastPrice), parseFloat(d.priceChangePercent), 'Binance');
        document.getElementById('volume24h').textContent = `$${formatLargeNumber(parseFloat(d.quoteVolume))}`;
        loaded = true;
    } catch (err) {
        console.warn('Binance ticker failed, trying FTI candles.', err);
        loaded = applyFtiPriceFallback();
    }

    // Market cap: CoinGecko direct, then optional proxy; leave "—" on failure.
    loadMarketCap();
    if (!loaded) applyFtiPriceFallback();
}

function setPrice(price, change24h, source) {
    if (price != null && !isNaN(price)) {
        document.getElementById('currentPrice').textContent = `$${price.toFixed(4)}`;
    }
    const badge = document.getElementById('priceChange');
    if (change24h != null && !isNaN(change24h)) {
        badge.textContent = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
        badge.className = `badge ${change24h >= 0 ? 'badge-up' : 'badge-down'}`;
    }
    const src = document.getElementById('priceSource');
    if (src && source) src.textContent = source;
}

function applyFtiPriceFallback() {
    const candles = ftiData?.candles_180d?.candles;
    if (!Array.isArray(candles) || candles.length === 0) return false;
    const last = candles[candles.length - 1];
    const prev = candles.length > 1 ? candles[candles.length - 2] : null;
    const change = prev && prev.close ? ((last.close - prev.close) / prev.close) * 100 : null;
    setPrice(last.close, change, 'Fan Token Intel');
    const vol = document.getElementById('volume24h');
    if (vol && last.volume != null) vol.textContent = `$${formatLargeNumber(last.volume)}`;
    return true;
}

async function loadMarketCap() {
    const url = `${COINGECKO_API}/coins/${PSG_TOKEN_ID}?localization=false&tickers=false&community_data=false&developer_data=false`;
    try {
        let data;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
            data = await res.json();
        } catch {
            data = await fetchWithProxy(url); // optional fallback
        }
        const mc = data?.market_data?.market_cap?.usd;
        if (mc != null) document.getElementById('marketCap').textContent = `$${formatLargeNumber(mc)}`;
    } catch (err) {
        console.warn('Market cap unavailable.', err);
    }
}

// ------------------------------------------------------------------ History
async function loadHistoricalData() {
    try {
        const now = Date.now();
        const daysDiff = Math.floor((now - LAUNCH_DATE) / 86400000);
        const limit = 1000;
        const requests = Math.ceil(daysDiff / limit);
        const byTime = new Map();

        for (let i = 0; i < requests; i++) {
            const endTime = now - i * limit * 86400000;
            const res = await fetch(`${BINANCE_API}/klines?symbol=${PSG_PAIR}&interval=1d&limit=${limit}&endTime=${endTime}`);
            if (!res.ok) throw new Error(`Binance klines ${res.status}`);
            const chunk = await res.json();
            chunk.forEach((c) => byTime.set(c[0], parseFloat(c[4]))); // dedupe by open time
        }

        allPriceData = [...byTime.entries()]
            .filter(([t]) => t >= LAUNCH_DATE)
            .sort((a, b) => a[0] - b[0])
            .map(([t, close]) => ({ x: new Date(t), y: close }));

        if (allPriceData.length === 0) throw new Error('No Binance candles');
        setChartSource('Binance daily close');
        finishChart();
    } catch (err) {
        console.warn('Binance history failed, trying FTI candles.', err);
        const candles = ftiData?.candles_180d?.candles;
        if (Array.isArray(candles) && candles.length) {
            allPriceData = candles
                .map((c) => ({ x: new Date(c.time), y: c.close }))
                .filter((p) => !isNaN(p.y));
            setChartSource('Fan Token Intel (last 180 days)');
            finishChart();
        } else {
            showChartError();
        }
    }
}

function finishChart() {
    calculateEventPriceChanges();
    createPriceChart();
    applyRange(currentDays);
    renderTimeline();
    document.getElementById('chartLoading').hidden = true;
    document.getElementById('chartError').hidden = true;
}

function showChartError() {
    document.getElementById('chartLoading').hidden = true;
    document.getElementById('chartError').hidden = false;
}

function setChartSource(text) {
    const el = document.getElementById('chartSource');
    if (el) el.textContent = text;
}

// ------------------------------------------------------------------ Event price changes
function calculateEventPriceChanges() {
    keyEvents.forEach((event) => {
        if (event.priceChange) return;
        const ts = new Date(event.date).getTime();
        const onDay = allPriceData.find((p) => Math.abs(p.x.getTime() - ts) < 86400000);
        if (!onDay) return;
        const dayBefore = allPriceData.find((p) => Math.abs(p.x.getTime() - (ts - 86400000)) < 86400000);
        if (dayBefore && dayBefore.y) {
            const pct = ((onDay.y - dayBefore.y) / dayBefore.y) * 100;
            event.priceChange = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
            event.eventPrice = onDay.y;
        }
    });
}

// ------------------------------------------------------------------ Chart
function getFilteredEvents() {
    return keyEvents.filter((e) => activeFilters.includes(e.filterCategory));
}

function meta(event) {
    return TYPE_META[event.type] || { kind: 'Event', group: 'neutral' };
}

function createPriceChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');

    const markers = [];
    getFilteredEvents().forEach((event) => {
        const ts = new Date(event.date).getTime();
        const point = allPriceData.find((p) => Math.abs(p.x.getTime() - ts) < 86400000);
        if (point) {
            const g = GROUPS[meta(event).group];
            markers.push({ x: new Date(event.date), y: point.y, event, _dot: g.dot, _ring: g.ring });
        }
    });

    const config = {
        type: 'line',
        data: {
            datasets: [
                {
                    label: '$PSG',
                    data: allPriceData,
                    borderColor: '#0076F4',
                    backgroundColor: 'rgba(0,118,244,0.06)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHitRadius: 10,
                    order: 2,
                },
                {
                    label: 'Events',
                    data: markers,
                    type: 'scatter',
                    backgroundColor: markers.map((m) => m._dot),
                    borderColor: markers.map((m) => m._ring),
                    borderWidth: 1.5,
                    // Burns: downward triangle (supply going down); everything else: dot.
                    pointStyle: markers.map((m) => (m.event.type === 'burn' ? 'triangle' : 'circle')),
                    rotation: markers.map((m) => (m.event.type === 'burn' ? 180 : 0)),
                    pointRadius: markers.map((m) => (m.event.type === 'burn' ? 8 : 6)),
                    pointHoverRadius: markers.map((m) => (m.event.type === 'burn' ? 11 : 9)),
                    pointHitRadius: 20,
                    order: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 200 },
            interaction: { intersect: false, mode: 'nearest', axis: 'xy' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E8E8E8',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: false,
                    titleColor: '#0C0C0C',
                    titleFont: { family: 'Poppins', size: 13, weight: '600' },
                    bodyColor: '#181818',
                    bodyFont: { family: 'Poppins', size: 12, weight: '500' },
                    callbacks: {
                        title: (items) =>
                            new Date(items[0].parsed.x).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            }),
                        label: (ctx2) => {
                            if (ctx2.datasetIndex === 1 && ctx2.raw?.event) {
                                const e = ctx2.raw.event;
                                return [
                                    e.label,
                                    e.description,
                                    `Price $${ctx2.parsed.y.toFixed(4)}`,
                                    e.priceChange ? `Change ${e.priceChange}` : '',
                                ].filter(Boolean);
                            }
                            return `Price $${ctx2.parsed.y.toFixed(4)}`;
                        },
                    },
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: true, speed: 0.1 },
                        pinch: { enabled: true },
                        mode: 'x',
                    },
                    pan: { enabled: true, mode: 'x', modifierKey: null },
                    limits: { x: { min: 'original', max: 'original' } },
                },
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: { month: 'MMM yyyy', day: 'MMM d', week: 'MMM d' },
                    },
                    grid: { display: false, drawBorder: true, color: '#E8E8E8', borderColor: '#E8E8E8' },
                    ticks: {
                        color: '#696969',
                        font: { family: 'Poppins', size: 12, weight: '500' },
                        maxRotation: 0,
                        autoSkipPadding: 24,
                    },
                },
                y: {
                    beginAtZero: false,
                    grid: { color: '#E8E8E8', drawBorder: false },
                    ticks: {
                        color: '#696969',
                        font: { family: 'Poppins', size: 12, weight: '500' },
                        callback: (v) => '$' + v.toFixed(2),
                    },
                },
            },
        },
    };

    if (priceChart) priceChart.destroy();
    priceChart = new Chart(ctx, config);
}

// Zoom the chart to the selected range without touching the timeline.
function applyRange(days) {
    currentDays = days;
    if (!priceChart) return;
    if (days === 'max') {
        priceChart.resetZoom();
    } else {
        priceChart.resetZoom('none');
        const now = Date.now();
        const min = now - parseInt(days, 10) * 86400000;
        priceChart.zoomScale('x', { min, max: now }, 'default');
    }
}

// ------------------------------------------------------------------ Listeners
function setupEventListeners() {
    document.querySelectorAll('.range-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.range-tab').forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            applyRange(tab.getAttribute('data-days'));
        });
    });

    const reset = document.getElementById('resetZoomBtn');
    if (reset) reset.addEventListener('click', () => applyRange(currentDays));

    document.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            const f = chip.getAttribute('data-filter');
            if (activeFilters.includes(f)) {
                activeFilters = activeFilters.filter((x) => x !== f);
                chip.classList.remove('active');
            } else {
                activeFilters.push(f);
                chip.classList.add('active');
            }
            if (priceChart) createPriceChart(), applyRange(currentDays);
            renderTimeline(true); // reset pagination on filter change
        });
    });

    const showMore = document.getElementById('showMoreBtn');
    if (showMore)
        showMore.addEventListener('click', () => {
            visibleCount += PAGE_SIZE;
            renderTimeline();
        });

    setInterval(() => {
        loadCurrentStats();
        updateLastUpdatedTime();
    }, 5 * 60 * 1000);
}

// ------------------------------------------------------------------ Timeline
function badgeHtml(priceChange) {
    if (!priceChange) return '<span class="badge badge-neutral">N/A</span>';
    const up = !priceChange.startsWith('-');
    return `<span class="badge ${up ? 'badge-up' : 'badge-down'}">${escapeHtml(priceChange)}</span>`;
}

// On-chain proof links for burn events (hashes are validated in buildBurnRows).
function txLinksHtml(txs, prefix = 'On-chain') {
    if (!Array.isArray(txs) || txs.length === 0) return '';
    const links = txs
        .map((h, i) => {
            const text = txs.length === 1 ? 'View transaction' : `Tx ${i + 1}`;
            return `<a href="${CHILIZ_EXPLORER}/tx/${h}" target="_blank" rel="noopener">${text}</a>`;
        })
        .join('<span class="event-links-sep">·</span>');
    return `<div class="event-links">${prefix}: ${links}</div>`;
}

function renderTimeline(reset) {
    if (reset) visibleCount = PAGE_SIZE;

    const container = document.getElementById('timelineContainer');
    const all = getFilteredEvents().sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = all.length;
    const visible = all.slice(0, visibleCount);

    const countEl = document.getElementById('eventsCount');
    if (countEl) countEl.textContent = total ? `Showing ${visible.length} of ${total}` : '';

    if (total === 0) {
        container.innerHTML = '<p class="events-empty">No events match the selected filters.</p>';
    } else {
        container.innerHTML = visible
            .map((event) => {
                const m = meta(event);
                const g = GROUPS[m.group];
                const dateStr = new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
                const cat = CATEGORY_LABEL[event.filterCategory] || '';
                const ftiChip = event.fti ? '<span class="fti-chip">FTI</span>' : '';
                return `
                <div class="event-row">
                    <div class="event-date tabular">${dateStr}</div>
                    <div class="event-main">
                        <div class="event-tags">
                            <span class="tag ${g.tag}">${escapeHtml(cat)} · ${escapeHtml(m.kind)}</span>
                            ${ftiChip}
                        </div>
                        <div class="event-title">${escapeHtml(event.label)}</div>
                        <div class="event-desc">${escapeHtml(event.description)}</div>
                        ${txLinksHtml(event.txs)}
                    </div>
                    <div class="event-change">${badgeHtml(event.priceChange)}</div>
                </div>`;
            })
            .join('');
    }

    const foot = document.getElementById('eventsFoot');
    const btn = document.getElementById('showMoreBtn');
    if (foot && btn) {
        const remaining = total - visible.length;
        if (remaining > 0) {
            foot.hidden = false;
            btn.textContent = `Show ${Math.min(PAGE_SIZE, remaining)} more`;
        } else {
            foot.hidden = true;
        }
    }
}

// ------------------------------------------------------------------ Helpers
async function fetchWithProxy(url) {
    for (const proxy of CORS_PROXIES) {
        try {
            const res = await fetch(`${proxy}${encodeURIComponent(url)}`);
            if (res.ok) return await res.json();
        } catch { /* try next */ }
    }
    throw new Error('All proxies failed');
}

function formatLargeNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Number(num).toFixed(2);
}

function updateLastUpdatedTime() {
    const el = document.getElementById('lastUpdated');
    if (el)
        el.textContent = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
