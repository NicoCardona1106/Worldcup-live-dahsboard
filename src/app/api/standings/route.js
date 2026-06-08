import { fetchStandings } from "@/lib/espn";

// Server-side proxy to ESPN's public World Cup standings (see /api/scoreboard
// for why we proxy instead of calling ESPN from the browser).
export async function GET() {
  try {
    const groups = await fetchStandings();
    return Response.json({ groups, source: "espn" });
  } catch (err) {
    console.error("standings proxy error:", err);
    return Response.json({ groups: {}, source: "espn", error: "upstream_unavailable" }, { status: 502 });
  }
}
