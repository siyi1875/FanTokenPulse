// Fan Token Intel panels — Match Impact Summary + Match Result Correlation.
// The per-match rows live in the main Key Events timeline (see script.js);
// here we render the aggregate summary and the win/draw/loss correlation table.
// Identifiers are prefixed `fti*` to avoid clashing with script.js globals.

const FTI_PANEL_URL = 'data/fti.json';

document.addEventListener('DOMContentLoaded', ftiInit);

async function ftiInit() {
    try {
        const res = await fetch(FTI_PANEL_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        ftiRenderGeneratedAt(data.generated_at);
        ftiRenderSummary(data.match_impact);
        ftiRenderCorrelation(data.match_impact);
    } catch (err) {
        console.warn('FTI panels unavailable — hiding them.', err);
        ['ftiMatchImpact', 'ftiCorrelation'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
}

function ftiRenderGeneratedAt(iso) {
    const el = document.getElementById('ftiGeneratedAt');
    if (!el) return;
    el.textContent = iso
        ? new Date(iso).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'unavailable';
}

/* ------------------------- Match impact summary ------------------------- */
function ftiRenderSummary(mi) {
    if (!mi || !Array.isArray(mi.matches) || mi.matches.length === 0) {
        const sec = document.getElementById('ftiMatchImpact');
        if (sec) sec.style.display = 'none';
        return;
    }
    const s = mi.summary || {};
    const tiles = [
        { label: 'Matches tracked', value: String(mi.match_count ?? mi.matches.length), tone: '' },
        { label: 'Avg 24h move', value: ftiPct(s.avg_return_total_24h), tone: ftiTone(s.avg_return_total_24h) },
        { label: 'Avg during match', value: ftiPct(s.avg_return_during_match), tone: ftiTone(s.avg_return_during_match) },
        { label: 'Up during match', value: s.positive_during_pct != null ? `${s.positive_during_pct.toFixed(1)}%` : '—', tone: '' },
    ];
    document.getElementById('ftiSummary').innerHTML = tiles
        .map(
            (t) => `
        <div class="tile">
            <span class="tile-value ${t.tone}">${t.value}</span>
            <span class="tile-label">${t.label}</span>
        </div>`
        )
        .join('');
}

/* ------------------------ Match result correlation ---------------------- */
const FTI_RESULT_ROWS = [
    { key: 'win', label: 'Win', tag: 'tag-up' },
    { key: 'draw', label: 'Draw', tag: 'tag-neutral' },
    { key: 'loss', label: 'Loss', tag: 'tag-down' },
];
const FTI_RESULT_SCORE = { win: 1, draw: 0, loss: -1 };

function ftiRenderCorrelation(mi) {
    const sec = document.getElementById('ftiCorrelation');
    const matches = (mi?.matches || []).filter(
        (m) => m.result in FTI_RESULT_SCORE && ftiNum(m.return_total_pct)
    );
    if (matches.length < 3) {
        if (sec) sec.style.display = 'none';
        return;
    }

    // Window label, e.g. "Oct 2025 – Sep 2026"
    const times = matches.map((m) => new Date(m.date).getTime());
    const fmtMonth = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const win = document.getElementById('corrWindow');
    if (win) win.textContent = `${fmtMonth(Math.min(...times))} – ${fmtMonth(Math.max(...times))}`;

    const rows = FTI_RESULT_ROWS.map((r) => ({ ...r, ...ftiGroupStats(matches.filter((m) => m.result === r.key)) }));
    const all = { key: 'all', label: 'All matches', ...ftiGroupStats(matches) };

    // Spearman rank correlation: robust to the occasional outlier move.
    const r = ftiSpearman(
        matches.map((m) => FTI_RESULT_SCORE[m.result]),
        matches.map((m) => Number(m.return_total_pct))
    );
    const winRate = (rows[0].n / matches.length) * 100;

    const stats = [
        { label: 'Matches tracked', value: String(matches.length), tone: '' },
        { label: 'Win rate', value: `${winRate.toFixed(0)}%`, tone: '' },
        { label: 'Correlation (r)', value: r == null ? '—' : `${r >= 0 ? '+' : ''}${r.toFixed(2)}`, tone: '' },
        { label: 'Strength', value: ftiStrength(r), tone: '' },
    ];
    document.getElementById('corrStats').innerHTML = stats
        .map(
            (t) => `
        <div class="corr-stat">
            <span class="corr-stat-value ${t.tone}">${t.value}</span>
            <span class="corr-stat-label">${t.label}</span>
        </div>`
        )
        .join('');

    // Scale the median bars to the largest |median| shown.
    const maxAbs = Math.max(...[...rows, all].map((x) => Math.abs(x.median || 0)), 0.01);

    const rowHtml = (x, isAll) => `
        <tr class="${isAll ? 'corr-all' : ''}">
            <td>${isAll ? x.label : `<span class="tag ${x.tag}">${x.label}</span>`}</td>
            <td class="num">${x.n}</td>
            <td class="num">${ftiDelta(x.during)}</td>
            <td class="num">${ftiDelta(x.postgame)}</td>
            <td class="num">${ftiDelta(x.avg)}</td>
            <td>${ftiMedianBar(x.median, maxAbs)}</td>
            <td class="num">${x.n ? `${x.upPct.toFixed(0)}%` : '—'}</td>
        </tr>`;

    document.getElementById('corrBody').innerHTML =
        rows.map((x) => rowHtml(x, false)).join('') + rowHtml(all, true);
}

function ftiGroupStats(group) {
    const vals = (key) => group.map((m) => Number(m[key])).filter((v) => !isNaN(v));
    const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
    const total = vals('return_total_pct');
    return {
        n: group.length,
        during: mean(vals('return_during_pct')),
        postgame: mean(vals('return_postgame_pct')),
        avg: mean(total),
        median: ftiMedian(total),
        upPct: total.length ? (total.filter((v) => v > 0).length / total.length) * 100 : 0,
    };
}

function ftiMedian(a) {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function ftiRanks(a) {
    const order = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]);
    const ranks = new Array(a.length);
    for (let i = 0; i < order.length; ) {
        let j = i;
        while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
        const avgRank = (i + j) / 2 + 1; // average rank for ties
        for (let k = i; k <= j; k++) ranks[order[k][1]] = avgRank;
        i = j + 1;
    }
    return ranks;
}

function ftiPearson(x, y) {
    const n = x.length;
    const mx = x.reduce((s, v) => s + v, 0) / n;
    const my = y.reduce((s, v) => s + v, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
        sxy += (x[i] - mx) * (y[i] - my);
        sxx += (x[i] - mx) ** 2;
        syy += (y[i] - my) ** 2;
    }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

function ftiSpearman(x, y) {
    return ftiPearson(ftiRanks(x), ftiRanks(y));
}

function ftiStrength(r) {
    if (r == null) return '—';
    const a = Math.abs(r);
    const dir = r > 0 ? 'positive' : 'negative';
    if (a < 0.1) return 'Negligible';
    if (a < 0.3) return `Weak ${dir}`;
    if (a < 0.5) return `Moderate ${dir}`;
    return `Strong ${dir}`;
}

function ftiMedianBar(v, maxAbs) {
    if (v == null || isNaN(v)) return '<span class="ds-delta">—</span>';
    const half = Math.min(Math.abs(v) / maxAbs, 1) * 50; // % of track width
    const tone = v >= 0 ? 'up' : 'down';
    const pos = v >= 0 ? `left:50%;width:${half}%` : `left:${50 - half}%;width:${half}%`;
    return `<div class="corr-bar">
        <span class="corr-bar-track"><span class="corr-bar-fill ${tone}" style="${pos}"></span></span>
        <span class="ds-delta ${tone}">${ftiPct(v)}</span>
    </div>`;
}

function ftiDelta(v) {
    return `<span class="ds-delta ${ftiTone(v)}">${ftiPct(v)}</span>`;
}

function ftiNum(v) {
    return v != null && !isNaN(v);
}

/* -------------------------------- helpers ------------------------------- */
function ftiPct(v) {
    if (v == null || isNaN(v)) return '—';
    return `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`;
}
function ftiTone(v) {
    if (v == null || isNaN(v)) return '';
    return v > 0 ? 'up' : v < 0 ? 'down' : '';
}
function ftiEsc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
