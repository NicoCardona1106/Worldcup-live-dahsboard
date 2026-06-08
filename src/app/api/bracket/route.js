import { fetchBracket } from "@/lib/espn";

// Server-side proxy to ESPN's public World Cup scoreboard, filtered down to
// the knockout-stage fixtures and grouped by round. Returns `rounds: []` until
// ESPN actually publishes the bracket (i.e. once the group stage finishes).
export async function GET() {
  try {
    const rounds = await fetchBracket();
    return Response.json({ rounds, source: "espn" });
  } catch (err) {
    console.error("bracket proxy error:", err);
    return Response.json({ rounds: [], source: "espn", error: "upstream_unavailable" }, { status: 502 });
  }
}
