// prebuild: the API (Render free) sleeps when idle and takes ~1 min to wake. Pages are prerendered from it during
// `next build`, so wait until GET /api/v1/health answers before building. No API URL set (CI) → nothing to wait for.
const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
if (!base) {
  console.log("wake-api: no API_URL / NEXT_PUBLIC_API_URL, skipping (API-backed pages render on request)");
  process.exit(0);
}

const deadline = Date.now() + 90_000;
for (let attempt = 1; Date.now() < deadline; attempt++) {
  try {
    const res = await fetch(`${base}/api/v1/health`, { signal: AbortSignal.timeout(15_000) });
    if (res.ok) {
      console.log(`wake-api: ${base} is up (attempt ${attempt})`);
      process.exit(0);
    }
    console.log(`wake-api: ${base} answered ${res.status}, retrying`);
  } catch (e) {
    console.log(`wake-api: ${base} not reachable yet (${e instanceof Error ? e.message : e}), retrying`);
  }
  await new Promise((r) => setTimeout(r, 3000));
}
console.error(`wake-api: ${base}/api/v1/health did not answer within 90 s. Is the API deployed and API_URL right?`);
process.exit(1);
