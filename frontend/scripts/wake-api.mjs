// prebuild: pages are prerendered from the API during `next build`, so wait until it can serve them.
// 1. The API (Render free) sleeps when idle and takes ~1 min to wake: wait for GET /api/v1/health.
// 2. A push that changes both parts builds here at once, while Render deploys the API only after the backend
//    checks pass (several minutes): wait until the live API lists every path of this build's contract
//    (lib/api/schema.d.ts), so a page never prerenders against the previous API version.
// No API URL set (CI) → nothing to wait for.
import { readFileSync } from "node:fs";

const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
if (!base) {
  console.log("wake-api: no API_URL / NEXT_PUBLIC_API_URL, skipping (API-backed pages render on request)");
  process.exit(0);
}

const WAKE_MS = 90_000;
const DEPLOY_MS = 15 * 60_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path) {
  return fetch(`${base}${path}`, { signal: AbortSignal.timeout(15_000) });
}

async function waitForHealth() {
  const deadline = Date.now() + WAKE_MS;
  for (let attempt = 1; Date.now() < deadline; attempt++) {
    try {
      const res = await get("/api/v1/health");
      if (res.ok) return console.log(`wake-api: ${base} is up (attempt ${attempt})`);
      console.log(`wake-api: ${base} answered ${res.status}, retrying`);
    } catch (e) {
      console.log(`wake-api: ${base} not reachable yet (${e instanceof Error ? e.message : e}), retrying`);
    }
    await sleep(3000);
  }
  console.error(`wake-api: ${base}/api/v1/health did not answer within 90 s. Is the API deployed and API_URL right?`);
  process.exit(1);
}

async function missingPaths(expected) {
  const res = await get("/openapi.json");
  if (!res.ok) throw new Error(`/openapi.json answered ${res.status}`);
  const live = new Set(Object.keys((await res.json()).paths ?? {}));
  return expected.filter((p) => !live.has(p));
}

async function waitForContract() {
  const schema = readFileSync(new URL("../lib/api/schema.d.ts", import.meta.url), "utf8");
  const expected = [...schema.matchAll(/^ {4}"(\/api\/[^"]+)": \{/gm)].map((m) => m[1]);
  const deadline = Date.now() + DEPLOY_MS;
  for (;;) {
    let missing;
    try {
      missing = await missingPaths(expected);
    } catch (e) {
      missing = null;
      console.log(`wake-api: couldn't read the API contract (${e instanceof Error ? e.message : e}), retrying`);
    }
    if (missing?.length === 0) return console.log(`wake-api: the API serves all ${expected.length} paths of this build`);
    if (Date.now() > deadline) {
      console.error(`wake-api: after 15 min the API still lacks ${missing?.join(", ") ?? "a readable /openapi.json"}. Did the backend deploy fail on Render?`);
      process.exit(1);
    }
    if (missing) console.log(`wake-api: waiting for the API deploy, missing ${missing.join(", ")}`);
    await sleep(20_000);
  }
}

await waitForHealth();
await waitForContract();
