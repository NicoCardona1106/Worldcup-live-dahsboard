import { fetchTournamentOverview, fetchTopScorers } from "@/lib/espn";

// Server-side proxy that turns ESPN's raw fixture list into the headline
// numbers and top-scorers table shown under the standings (see /api/scoreboard
// for why we proxy instead of calling ESPN from the browser). Both pieces stay
// empty until real matches have actually been played, so the UI can fall back
// to clearly-labelled sample data until then.
export async function GET() {
  try {
    const overview = await fetchTournamentOverview();
    const topScorers = overview.hasPlayedMatches ? await fetchTopScorers(overview.playedOrLiveIds) : [];
    return Response.json({ stats: overview.stats, topScorers, source: "espn" });
  } catch (err) {
    console.error("stats proxy error:", err);
    return Response.json({ stats: [], topScorers: [], source: "espn", error: "upstream_unavailable" }, { status: 502 });
  }
}
