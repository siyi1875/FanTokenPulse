// Fan Token Intel (FTI) integration
// --------------------------------------------------
// Renders the two FTI-powered panels — measured match impact and cross-token
// capital rotation — from the baked ./data/fti.json snapshot.
//
// The snapshot is produced by fetch-fti-data.js, which calls the Fan Token Intel
// MCP server. Re-run that script to refresh the numbers. This module degrades
// gracefully: if the file is missing (e.g. script not yet run), the panels hide
// themselves instead of showing broken UI.

// Note: the measured matches themselves are merged into the main Key Events
// timeline + chart by script.js (mergeFtiMatchEvents). This file renders the
// aggregate summary, the capital-rotation panel, and the price-card fallback.
const FTI_PANEL_DATA_URL = 'data/fti.json';

document.addEventListener('DOMContentLoaded', () => {
    loadFtiData();
});

async function loadFtiData() {
    try {
        const res = await fetch(FTI_PANEL_DATA_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        renderFtiGeneratedAt(data.generated_at);
        renderMatchSummary(data.match_impact);
        renderCapitalRotation(data.capital_rotation);

        // The live price cards use CoinGecko/Binance directly, which are prone to
        // CORS / rate-limit failures. Use FTI's baked candles as a last-resort
        // fallback so the header never gets stuck on "Loading…" / "API Unavailable".
        schedulePriceFallback(data.candles_180d);
    } catch (err) {
        console.warn('FTI data unavailable — hiding FTI panels.', err);
        hideFtiPanels();
    }
}

function hideFtiPanels() {
    ['ftiMatchImpact', 'ftiRotation'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function renderFtiGeneratedAt(iso) {
    const el = document.getElementById('ftiGeneratedAt');
    if (!el) return;
    if (!iso) {
        el.textContent = 'unknown';
        return;
    }
    el.textContent = new Date(iso).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/* --------------------------- Price fallback ----------------------------- */

// If the live APIs haven't populated the header a few seconds after load,
// backfill Current Price / 24h Volume from the latest FTI daily candle.
function schedulePriceFallback(candles) {
    const list = candles && Array.isArray(candles.candles) ? candles.candles : null;
    if (!list || list.length === 0) return;

    setTimeout(() => {
        const last = list[list.length - 1];
        const prev = list.length > 1 ? list[list.length - 2] : null;

        const priceEl = document.getElementById('currentPrice');
        if (priceEl && isPlaceholder(priceEl.textContent) && last.close != null) {
            priceEl.textContent = `$${Number(last.close).toFixed(4)}`;

            const changeEl = document.getElementById('priceChange');
            if (changeEl && prev && prev.close) {
                const pct = ((last.close - prev.close) / prev.close) * 100;
                changeEl.textContent = `${fmtPct(pct)} (FTI)`;
                changeEl.className = `stat-change ${pct >= 0 ? 'positive' : 'negative'}`;
            }
        }

        const volEl = document.getElementById('volume24h');
        if (volEl && isPlaceholder(volEl.textContent) && last.volume != null) {
            volEl.textContent = `$${formatLargeNumberSafe(last.volume)}`;
        }
    }, 3500);
}

function isPlaceholder(text) {
    if (!text) return true;
    const t = text.trim().toLowerCase();
    return t === '' || t === 'loading...' || t === 'n/a' || t === 'api unavailable';
}

// Reuse the app's formatter if present; otherwise a small local fallback.
function formatLargeNumberSafe(num) {
    if (typeof formatLargeNumber === 'function') return formatLargeNumber(num);
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Number(num).toFixed(2);
}

/* -------------------------- Match impact summary ------------------------ */

// The per-match detail now lives in the main Key Events timeline; here we show
// the aggregate stats that the timeline can't convey at a glance.
function renderMatchSummary(mi) {
    if (!mi || !Array.isArray(mi.matches) || mi.matches.length === 0) {
        const section = document.getElementById('ftiMatchImpact');
        if (section) section.style.display = 'none';
        return;
    }

    const s = mi.summary || {};
    const tiles = [
        { label: 'Matches tracked', value: String(mi.match_count ?? mi.matches.length), tone: 'neutral' },
        { label: 'Avg 24h move', value: fmtPct(s.avg_return_total_24h), tone: toneOf(s.avg_return_total_24h) },
        { label: 'Avg during match', value: fmtPct(s.avg_return_during_match), tone: toneOf(s.avg_return_during_match) },
        { label: 'Up during match', value: s.positive_during_pct != null ? `${s.positive_during_pct.toFixed(1)}%` : '—', tone: 'neutral' },
    ];

    document.getElementById('ftiSummary').innerHTML = tiles
        .map(
            (t) => `
        <div class="fti-tile ${t.tone}">
            <span class="fti-tile-value">${t.value}</span>
            <span class="fti-tile-label">${t.label}</span>
        </div>`
        )
        .join('');
}

/* --------------------------- Capital rotation --------------------------- */

function renderCapitalRotation(cr) {
    if (!cr || !Array.isArray(cr.tokens) || cr.tokens.length === 0) {
        document.getElementById('ftiRotation').style.display = 'none';
        return;
    }

    const stats = [
        { label: 'Tokens tracked', value: String(cr.token_count ?? '—'), tone: 'neutral' },
        { label: 'Inflows', value: String(cr.inflow_tokens ?? '—'), tone: 'pos' },
        { label: 'Outflows', value: String(cr.outflow_tokens ?? '—'), tone: 'neg' },
        { label: 'Universe median Δ', value: fmtPct(cr.universe_median_change_pct), tone: toneOf(cr.universe_median_change_pct) },
    ];
    document.getElementById('ftiRotationStats').innerHTML = stats
        .map(
            (t) => `
        <div class="fti-tile ${t.tone}">
            <span class="fti-tile-value">${t.value}</span>
            <span class="fti-tile-label">${t.label}</span>
        </div>`
        )
        .join('');

    const body = document.getElementById('ftiRotationBody');
    body.innerHTML = cr.tokens
        .map((t) => {
            const isPsg = t.token === 'PSG';
            return `
            <tr class="${isPsg ? 'fti-psg-row' : ''}">
                <td class="fti-token">${escapeHtml(t.token)}${isPsg ? ' <span class="fti-tag">you</span>' : ''}</td>
                <td class="num">${fmtPrice(t.price)}</td>
                <td class="num hide-sm">${pctBadge(t.volume_change_pct)}</td>
                <td class="num">${pctBadge(t.relative_change_pct)}</td>
                <td>${flowBadge(t.flow)}</td>
            </tr>`;
        })
        .join('');
}

/* -------------------------------- helpers ------------------------------- */

function fmtPct(v) {
    if (v == null || isNaN(v)) return '—';
    return `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`;
}

function fmtPrice(v) {
    if (v == null || isNaN(v)) return '—';
    const n = Number(v);
    return n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function toneOf(v) {
    if (v == null || isNaN(v)) return 'neutral';
    if (v > 0) return 'pos';
    if (v < 0) return 'neg';
    return 'neutral';
}

function pctBadge(v) {
    if (v == null || isNaN(v)) return '<span class="fti-pct neutral">—</span>';
    return `<span class="fti-pct ${toneOf(v)}">${fmtPct(v)}</span>`;
}

function resultBadge(result) {
    const map = { win: 'W', loss: 'L', draw: 'D' };
    const cls = { win: 'win', loss: 'loss', draw: 'draw' };
    const label = map[result] || '?';
    return `<span class="fti-result ${cls[result] || 'draw'}">${label}</span>`;
}

function flowBadge(flow) {
    const cls = flow === 'inflow' ? 'pos' : flow === 'outflow' ? 'neg' : 'neutral';
    const arrow = flow === 'inflow' ? '▲' : flow === 'outflow' ? '▼' : '•';
    return `<span class="fti-flow ${cls}">${arrow} ${escapeHtml(flow || '—')}</span>`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
