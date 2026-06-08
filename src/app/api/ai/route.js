import { matches as placeholderMatches, groups as placeholderGroups, tournamentStats, topScorers, matchEvents } from "@/lib/data";
import { fetchScoreboard, fetchStandings } from "@/lib/espn";

// Serverless proxy to the Anthropic Claude API. Runs on the server (Vercel
// function) so the API key never reaches the browser. Configure it by setting
// ANTHROPIC_API_KEY in your environment (see README for how to get one).

async function buildContext() {
  // Try ESPN's live World Cup data first; fall back to the bundled sample
  // data (and tell the model it's a sample) if the upstream API has nothing
  // yet — e.g. before the tournament kicks off.
  const [scoreboard, standings] = await Promise.allSettled([fetchScoreboard(), fetchStandings()]);

  const liveMatches = scoreboard.status === "fulfilled" ? scoreboard.value.matches : [];
  const liveGroups = standings.status === "fulfilled" ? standings.value : {};

  const hasLiveMatches = liveMatches.length > 0;
  const hasLiveGroups = Object.keys(liveGroups).length > 0;

  return {
    isLive: hasLiveMatches || hasLiveGroups,
    matches: hasLiveMatches ? liveMatches : placeholderMatches,
    groups: hasLiveGroups ? liveGroups : placeholderGroups,
    matchesAreLive: hasLiveMatches,
    groupsAreLive: hasLiveGroups,
  };
}

function buildSystemPrompt({ matches, groups, matchesAreLive, groupsAreLive }) {
  const today = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const dataNote =
    matchesAreLive || groupsAreLive
      ? `Los datos marcados como "EN VIVO (ESPN)" abajo vienen de la API pública de ESPN en tiempo real — tratalos como información real y actual.
Los datos marcados como "DE MUESTRA" son de ejemplo (todavía no hay datos reales de la API para esa sección, por ejemplo porque el torneo no arrancó); si te preguntan por ellos, aclará amablemente que son de demostración.`
      : `Por ahora la API en vivo de ESPN no devolvió partidos ni posiciones (probablemente porque el torneo todavía no arrancó), así que TODOS los datos a continuación son de ejemplo (placeholder). Si te preguntan, aclará amablemente que son datos de demostración y que se actualizarán solos en cuanto la API tenga información real.`;

  return `Te llamás Lucho, sos el asistente virtual de "WORLD CUP LIVE", un dashboard del Mundial 2026.
Si te preguntan tu nombre o te saludan por primera vez, presentate como Lucho.
Respondé siempre en español, de forma breve, entusiasta y precisa, con tono natural y conversacional
de relator deportivo — como si estuvieras hablando, no escribiendo un post.
Usá los datos a continuación para responder sobre partidos, resultados, posiciones y estadísticas.

IMPORTANTE — formato de las respuestas: escribí en texto plano, sin markdown. No uses asteriscos
(**negrita**, *cursiva*), guiones de lista, encabezados ni emojis. Tus respuestas se muestran en un
chat y además se leen en voz alta con síntesis de voz, así que cualquier símbolo se escucharía
literal o sonaría raro — mantené todo en oraciones naturales y fluidas.

${dataNote}

HOY ES: ${today}.

IMPORTANTE — fechas de los partidos:
${
  matchesAreLive
    ? `La lista de PARTIDOS de abajo viene de la API real y puede incluir encuentros de distintos días
(de hoy, de mañana, o de más adelante en el calendario del torneo) — NO son todos "de hoy". Cada
partido trae su fecha real en el campo "date" (también "kickoffISO" en formato ISO) además de la
hora en "time". Antes de decir cuándo se juega un partido, fijate siempre en su campo "date" y
comparalo con la fecha de hoy de arriba: si coincide con hoy decí "hoy", si es la fecha de mañana
decí "mañana", y si no, mencioná el día de la semana y la fecha concretos. Nunca asumas "hoy" sin
revisar ese campo — sería un error decirle a alguien que un partido es hoy cuando en realidad es
en otra fecha.`
    : `Los PARTIDOS de muestra de abajo NO tienen un campo de fecha real — son datos de demostración
pensados como ejemplo de "los partidos de hoy" en la maqueta. Si te preguntan cuándo se juegan,
aclará que es un dato de ejemplo y que todavía no hay calendario real cargado desde la API para
esa fecha (el torneo arranca recién el 11 de junio de 2026). No inventes una fecha concreta.`
}

PARTIDOS (${matchesAreLive ? "EN VIVO — ESPN" : "DE MUESTRA"}):
${JSON.stringify(matches, null, 2)}

EVENTOS DE PARTIDO DE EJEMPLO (Argentina vs Francia, ilustrativo):
${JSON.stringify(matchEvents, null, 2)}

TABLA DE GRUPOS (${groupsAreLive ? "EN VIVO — ESPN" : "DE MUESTRA"}):
${JSON.stringify(groups, null, 2)}

GOLEADORES (DE MUESTRA):
${JSON.stringify(topScorers, null, 2)}

ESTADÍSTICAS DEL TORNEO (DE MUESTRA):
${JSON.stringify(tournamentStats, null, 2)}

Si te preguntan algo fuera de estos datos (otros deportes, temas generales, etc.) podés responder
con tu conocimiento general, pero siempre mantené el tono de un relator/analista de fútbol.
Mantené las respuestas cortas (2-4 frases) porque se muestran en un widget de chat y se leen en voz alta.`;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "El asistente todavía no está configurado: falta la variable de entorno ANTHROPIC_API_KEY en el servidor. Mirá el README para saber cómo conseguir y configurar tu clave.",
      },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  const messages = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0) {
    return Response.json({ error: "No se recibió ningún mensaje." }, { status: 400 });
  }

  try {
    const context = await buildContext();
    const systemPrompt = buildSystemPrompt(context);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Anthropic API error:", res.status, errBody);
      return Response.json(
        { error: "El asistente de IA no pudo responder en este momento. Probá de nuevo en unos segundos." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply = data?.content?.find((block) => block.type === "text")?.text?.trim() || "No tengo una respuesta para eso ahora mismo.";

    return Response.json({ reply });
  } catch (err) {
    console.error("AI proxy error:", err);
    return Response.json({ error: "Error de conexión con el servicio de IA." }, { status: 502 });
  }
}
