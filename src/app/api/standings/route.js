import { fetchStandings, hasLiveMatches } from "@/lib/espn";

// Server-side proxy to ESPN's public World Cup standings (see /api/scoreboard
// for why we proxy instead of calling ESPN from the browser). `hasLive` rides
// along (from the already-cached scoreboard) so the client can poll the table
// faster while matches are in play and ease off between matchdays.
export async function GET() {
  try {
    const [groups, hasLive] = await Promise.all([fetchStandings(), hasLiveMatches()]);
    return Response.json({ groups, hasLive, source: "espn" });
  } catch (err) {
    console.error("standings proxy error:", err);
    return Response.json({ groups: {}, hasLive: false, source: "espn", error: "upstream_unavailable" }, { status: 502 });
  }
}
