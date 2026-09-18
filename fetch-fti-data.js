#!/usr/bin/env node
/**
 * fetch-fti-data.js
 * ------------------
 * Pulls PSG intelligence from the Fan Token Intel (FTI) MCP server and bakes it
 * into ./data/fti.json, which the static dashboard loads at runtime.
 *
 * Why bake instead of calling the MCP from the browser?
 *   The MCP endpoint speaks JSON-RPC (not a browser-friendly REST/CORS API), so
 *   we resolve it at build time. Re-run this script (locally or from CI) whenever
 *   you want fresher numbers. Only anonymous FTI tools are used -- no API key.
 *
 * Usage:  node fetch-fti-data.js
 * Requires Node 18+ (global fetch).
 */

const MCP_URL =
  process.env.FTI_MCP_URL || 'https://mcp-production-f681.up.railway.app/mcp';
const TOKEN = process.env.FTI_TOKEN || 'PSG';

const fs = require('fs');
const path = require('path');

let rpcId = 0;

/** Call an MCP tool over JSON-RPC and return the parsed tool payload. */
async function callTool(name, args = {}) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The server may answer as JSON or as an SSE stream; accept both.
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: ++rpcId,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });

  if (!res.ok) {
    throw new Error(`${name}: HTTP ${res.status} ${res.statusText}`);
  }

  const raw = await res.text();
  const envelope = parseRpc(raw);

  if (envelope.error) {
    throw new Error(`${name}: ${JSON.stringify(envelope.error)}`);
  }

  const block = envelope.result?.content?.find((c) => c.type === 'text');
  if (!block) return envelope.result ?? null;

  // Tool payloads are JSON encoded inside a text block.
  try {
    return JSON.parse(block.text);
  } catch {
    return block.text;
  }
}

/** Accept either a plain JSON body or an SSE "data:" framed body. */
function parseRpc(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);

  const dataLine = trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .filter(Boolean)
    .pop();

  if (!dataLine) throw new Error(`Unrecognized MCP response: ${trimmed.slice(0, 120)}`);
  return JSON.parse(dataLine);
}

async function main() {
  console.log(`Fetching Fan Token Intel data for ${TOKEN} from ${MCP_URL} ...`);

  const [matchImpact, capitalRotation, candles] = await Promise.all([
    callTool('tokenintel_match_impact_history', {
      token: TOKEN,
      days: 365,
      limit: 200,
    }),
    callTool('tokenintel_capital_rotation', { hours: 24, limit: 20 }),
    callTool('tokenintel_price_candles', {
      token: TOKEN,
      interval: '1d',
      days: 180,
    }),
  ]);

  const out = {
    generated_at: new Date().toISOString(),
    source: 'Fan Token Intel MCP (fantokenintel.com)',
    token: TOKEN,
    note:
      'Descriptive market data from FTI anonymous endpoints. Not financial advice.',
    match_impact: matchImpact,
    capital_rotation: capitalRotation,
    candles_180d: candles,
  };

  const dir = path.join(__dirname, 'data');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'fti.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2));

  const matchCount = matchImpact?.match_count ?? matchImpact?.matches?.length ?? 0;
  const rotCount = capitalRotation?.tokens?.length ?? 0;
  console.log(`✅ Wrote ${path.relative(process.cwd(), file)}`);
  console.log(`   • ${matchCount} PSG matches with measured price impact`);
  console.log(`   • ${rotCount} fan tokens in capital-rotation snapshot`);
}

main().catch((err) => {
  console.error('❌ Failed to build fti.json:', err.message);
  process.exit(1);
});
