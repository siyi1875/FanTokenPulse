// Fan Token Intel panels — Match Impact Summary + Capital Rotation.
// The per-match rows live in the main Key Events timeline (see script.js);
// here we render the aggregate summary and the cross-token rotation table.
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
        ftiRenderRotation(data.capital_rotation);
    } catch (err) {
        console.warn('FTI panels unavailable — hiding them.', err);
        ['ftiMatchImpact', 'ftiRotation'].forEach((id) => {
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

/* --------------------------- Capital rotation --------------------------- */
function ftiRenderRotation(cr) {
    if (!cr || !Array.isArray(cr.tokens) || cr.tokens.length === 0) {
        const sec = document.getElementById('ftiRotation');
        if (sec) sec.style.display = 'none';
        return;
    }

    const stats = [
        { label: 'Tokens tracked', value: String(cr.token_count ?? '—'), tone: '' },
        { label: 'Inflows', value: String(cr.inflow_tokens ?? '—'), tone: 'up' },
        { label: 'Outflows', value: String(cr.outflow_tokens ?? '—'), tone: 'down' },
        { label: 'Universe median Δ', value: ftiPct(cr.universe_median_change_pct), tone: ftiTone(cr.universe_median_change_pct) },
    ];
    document.getElementById('ftiRotationStats').innerHTML = stats
        .map(
            (t) => `
        <div class="rotation-stat">
            <span class="rotation-stat-value ${t.tone}">${t.value}</span>
            <span class="rotation-stat-label">${t.label}</span>
        </div>`
        )
        .join('');

    document.getElementById('ftiRotationBody').innerHTML = cr.tokens
        .map((t) => {
            const isPsg = t.token === 'PSG';
            return `
            <tr class="${isPsg ? 'row-tracked' : ''}">
                <td><span class="ds-token">$${ftiEsc(t.token)}</span>${isPsg ? '<span class="tracked-tag">Tracked</span>' : ''}</td>
                <td class="num">${ftiPrice(t.price)}</td>
                <td class="num"><span class="ds-delta ${ftiTone(t.volume_change_pct)}">${ftiPct(t.volume_change_pct)}</span></td>
                <td class="num"><span class="ds-delta ${ftiTone(t.relative_change_pct)}">${ftiPct(t.relative_change_pct)}</span></td>
                <td class="num">${ftiFlow(t.flow)}</td>
            </tr>`;
        })
        .join('');
}

/* -------------------------------- helpers ------------------------------- */
function ftiPct(v) {
    if (v == null || isNaN(v)) return '—';
    return `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`;
}
function ftiPrice(v) {
    if (v == null || isNaN(v)) return '—';
    const n = Number(v);
    return n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}
function ftiTone(v) {
    if (v == null || isNaN(v)) return '';
    return v > 0 ? 'up' : v < 0 ? 'down' : '';
}
function ftiFlow(flow) {
    const cls = flow === 'inflow' ? 'flow-in' : flow === 'outflow' ? 'flow-out' : 'flow-neutral';
    return `<span class="flow-tag ${cls}">${ftiEsc(flow || '—')}</span>`;
}
function ftiEsc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
