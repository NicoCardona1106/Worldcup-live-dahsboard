import { fetchScoreboard } from "@/lib/espn";

// Server-side proxy to ESPN's public World Cup scoreboard. Proxying (instead of
// calling ESPN directly from the browser) lets us cache via Next's fetch cache,
// reshape the payload to what the UI needs, and swap providers later without
// touching any component.
export async function GET() {
  try {
    const { matches, day } = await fetchScoreboard();
    return Response.json({ matches, day, source: "espn" });
  } catch (err) {
    console.error("scoreboard proxy error:", err);
    return Response.json({ matches: [], day: null, source: "espn", error: "upstream_unavailable" }, { status: 502 });
  }
}
