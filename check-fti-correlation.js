#!/usr/bin/env node
/**
 * check-fti-correlation.js
 * ------------------------
 * Cross-checks the dashboard's own win/draw/loss correlation (computed from
 * data/fti.json) against Fan Token Intel's key-gated tokenintel_match_correlation.
 *
 * 1) One-time: get a free FTI API key (you accept FTI's terms by passing the flag;
 *    read https://fantokenintel.com/legal first). The key is saved to
 *    ~/.config/fantokenintel/key (mode 600) and never printed.
 *
 *      node check-fti-correlation.js register --name "PSG Pulse" --email you@example.com --accept-terms
 *
 *    FTI may email a verification link — click it before step 2.
 *
 * 2) Cross-check (reads FTI_API_KEY env var, else the saved key file):
 *
 *      node check-fti-correlation.js
 *
 *    Raw FTI responses are written to .fti-check/ (git-ignored) for review.
 *
 * Requires Node 18+.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const MCP_URL = process.env.FTI_MCP_URL || 'https://mcp-production-f681.up.railway.app/mcp';
const TOKEN = process.env.FTI_TOKEN || 'PSG';
const KEY_FILE = path.join(os.homedir(), '.config', 'fantokenintel', 'key');
const OUT_DIR = path.join(__dirname, '.fti-check');

let rpcId = 0;

async function callTool(name, args, apiKey) {
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
    };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(MCP_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: ++rpcId,
            method: 'tools/call',
            params: { name, arguments: args },
        }),
    });
    const raw = await res.text();
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${raw.slice(0, 200)}`);

    const envelope = parseRpc(raw);
    if (envelope.error) throw new Error(`${name}: ${JSON.stringify(envelope.error)}`);

    const result = envelope.result || {};
    const block = (result.content || []).find((c) => c.type === 'text');
    let payload = block ? block.text : result;
    try {
        payload = JSON.parse(payload);
    } catch { /* plain text */ }
    return { isError: !!result.isError, payload };
}

function parseRpc(raw) {
    const t = raw.trim();
    if (t.startsWith('{')) return JSON.parse(t);
    const line = t
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .filter(Boolean)
        .pop();
    if (!line) throw new Error(`Unrecognized MCP response: ${t.slice(0, 120)}`);
    return JSON.parse(line);
}

function arg(flag) {
    const i = process.argv.indexOf(flag);
    return i > -1 ? process.argv[i + 1] : undefined;
}

// Replace anything that looks like an FTI key so it never reaches the terminal.
function redact(obj) {
    return JSON.parse(JSON.stringify(obj).replace(/ti_(live|test)_[A-Za-z0-9_-]+/g, 'ti_$1_••••••'));
}

function findKey(obj) {
    const m = JSON.stringify(obj).match(/ti_(live|test)_[A-Za-z0-9_-]+/);
    return m ? m[0] : null;
}

/* ------------------------------- register ------------------------------- */
async function register() {
    const name = arg('--name');
    const email = arg('--email');
    if (!name || !email || !process.argv.includes('--accept-terms')) {
        console.error('Usage: node check-fti-correlation.js register --name "PSG Pulse" --email you@example.com --accept-terms');
        console.error('Passing --accept-terms accepts FTI\'s Terms of Use and Privacy Policy: https://fantokenintel.com/legal');
        process.exit(1);
    }

    const { isError, payload } = await callTool('tokenintel_register', {
        name,
        email,
        terms_accepted: true,
    });
    const key = findKey(payload);

    if (isError || !key) {
        console.error('❌ Registration did not return a key:');
        console.error(JSON.stringify(redact(payload), null, 2));
        process.exit(1);
    }

    fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true, mode: 0o700 });
    fs.writeFileSync(KEY_FILE, key + '\n', { mode: 0o600 });

    console.log('✅ Registered. Key saved to', KEY_FILE, '(not printed).');
    console.log(JSON.stringify(redact(payload), null, 2));
    console.log('\nIf FTI emailed you a verification link, click it, then run:  node check-fti-correlation.js');
}

/* ------------------------------- compare -------------------------------- */
function loadKey() {
    if (process.env.FTI_API_KEY) return process.env.FTI_API_KEY.trim();
    if (fs.existsSync(KEY_FILE)) return fs.readFileSync(KEY_FILE, 'utf8').trim();
    return null;
}

// Same math as fti.js so the comparison is apples to apples.
function ourStats() {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'fti.json'), 'utf8'));
    const ms = (data.match_impact?.matches || []).filter(
        (m) => ['win', 'draw', 'loss'].includes(m.result) && m.return_total_pct != null
    );
    const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
    const median = (a) => {
        if (!a.length) return null;
        const s = [...a].sort((x, y) => x - y);
        const k = Math.floor(s.length / 2);
        return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2;
    };
    const group = (g) => {
        const t = g.map((m) => Number(m.return_total_pct));
        return {
            n: g.length,
            avg_during: mean(g.map((m) => Number(m.return_during_pct)).filter((v) => !isNaN(v))),
            avg_postgame: mean(g.map((m) => Number(m.return_postgame_pct)).filter((v) => !isNaN(v))),
            avg_24h: mean(t),
            median_24h: median(t),
            up_pct: t.length ? (100 * t.filter((v) => v > 0).length) / t.length : null,
        };
    };
    const out = { window: [ms.at(-1)?.date?.slice(0, 10), ms[0]?.date?.slice(0, 10)], all: group(ms) };
    for (const r of ['win', 'draw', 'loss']) out[r] = group(ms.filter((m) => m.result === r));
    return out;
}

async function compare() {
    const apiKey = loadKey();
    if (!apiKey) {
        console.error('No API key found. Run the register step first (see the header of this file),');
        console.error('or export FTI_API_KEY in this shell.');
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const theirs = {};
    for (const result_filter of ['all', 'win', 'draw', 'loss']) {
        const { isError, payload } = await callTool(
            'tokenintel_match_correlation',
            { token: TOKEN, result_filter, limit: 100 },
            apiKey
        );
        const clean = redact(payload);
        fs.writeFileSync(path.join(OUT_DIR, `match_correlation_${result_filter}.json`), JSON.stringify(clean, null, 2));
        theirs[result_filter] = clean;
        if (isError) {
            console.error(`❌ FTI returned an error for result_filter=${result_filter}:`);
            console.error(typeof clean === 'string' ? clean : JSON.stringify(clean, null, 2));
            console.error('\nIf this says the key is unverified, click the link FTI emailed you and retry.');
            process.exit(1);
        }
    }

    const ours = ourStats();
    fs.writeFileSync(path.join(OUT_DIR, 'ours.json'), JSON.stringify(ours, null, 2));

    const pct = (v) => (v == null || isNaN(v) ? '—' : `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`);
    console.log(`\nOURS (from data/fti.json, ${ours.window[0]} → ${ours.window[1]})`);
    console.table(
        ['win', 'draw', 'loss', 'all'].map((r) => ({
            result: r,
            n: ours[r].n,
            during: pct(ours[r].avg_during),
            postgame: pct(ours[r].avg_postgame),
            avg_24h: pct(ours[r].avg_24h),
            median_24h: pct(ours[r].median_24h),
            up: ours[r].up_pct == null ? '—' : `${ours[r].up_pct.toFixed(0)}%`,
        }))
    );

    console.log('\nTHEIRS (tokenintel_match_correlation) — top-level fields per filter:');
    for (const [filter, p] of Object.entries(theirs)) {
        if (typeof p !== 'object' || p === null) {
            console.log(`  ${filter}:`, String(p).slice(0, 300));
            continue;
        }
        const scalars = Object.fromEntries(
            Object.entries(p).filter(([, v]) => v === null || typeof v !== 'object')
        );
        const nested = Object.entries(p)
            .filter(([, v]) => v && typeof v === 'object')
            .map(([k, v]) => `${k}${Array.isArray(v) ? `[${v.length}]` : '{…}'}`);
        console.log(`  ${filter}:`, JSON.stringify(scalars), nested.length ? `+ ${nested.join(', ')}` : '');
    }
    console.log(`\nFull responses saved in ${path.relative(process.cwd(), OUT_DIR)}/ (keys redacted).`);
}

(process.argv[2] === 'register' ? register() : compare()).catch((err) => {
    console.error('❌', err.message.replace(/ti_(live|test)_[A-Za-z0-9_-]+/g, 'ti_$1_••••••'));
    process.exit(1);
});
