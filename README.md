# WORLD CUP LIVE — Dashboard del Mundial 2026

Dashboard inmersivo construido con **Next.js (App Router)**, **Tailwind CSS v4** y un
diseño "liquid glass" inspirado en transmisiones deportivas premium (DAZN, ESPN,
Champions League). Incluye un **asistente de IA con voz** (chat de texto + reconocimiento
y síntesis de voz del navegador) conectado a la API de **Claude (Anthropic)** mediante
una ruta serverless que mantiene tu clave secreta.

---

## 1. Correr el proyecto en local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

---

## 2. Variables de entorno

Copiá `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Y completá:

```
ANTHROPIC_API_KEY=tu_clave_aquí
```

> El asistente de IA funciona igual sin la clave (muestra un mensaje explicando que
> falta configurarla), así que podés desarrollar el resto del sitio sin ella.

---

## 3. Cómo conseguir la clave de la API de IA (Claude / Anthropic)

El botón de IA llama a `/api/ai`, una función serverless que reenvía la conversación
a Claude usando tu clave **del lado del servidor** (nunca se expone en el navegador).

1. Entrá a **[console.anthropic.com](https://console.anthropic.com)** y creá una cuenta
   (o iniciá sesión con la misma cuenta que usás en Claude / Claude Code).
2. En el panel, andá a **API Keys** → **Create Key**.
3. Copiá la clave (empieza con `sk-ant-...`) — solo se muestra una vez.
4. Pegala en `.env.local` como `ANTHROPIC_API_KEY=sk-ant-...`.
5. Anthropic cobra por uso (tokens de entrada/salida); las nuevas cuentas suelen
   recibir crédito gratuito para probar. Podés fijar límites de gasto desde el
   panel de **Billing**.

**Alternativas** si preferís otro proveedor (tendrías que adaptar `src/app/api/ai/route.js`):
- **OpenAI** — [platform.openai.com](https://platform.openai.com) → API Keys. También
  ofrece Whisper (voz→texto) y TTS (texto→voz) si más adelante querés reemplazar la
  Web Speech API del navegador por algo más controlable.
- **Google Gemini** — [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey),
  con un nivel gratuito generoso, buena opción si querés arrancar sin costo.

---

## 4. Datos de partidos en vivo — integración con la API pública de ESPN

El proyecto ya viene conectado a la API pública (no oficial, sin autenticación)
de ESPN para el Mundial. **No hace falta crear ninguna cuenta ni configurar
ninguna API key** para esta parte:

- `src/lib/espn.js` — llama a los endpoints de ESPN exclusivos del Mundial
  (`soccer/fifa.world`) y transforma la respuesta a la forma que usan los
  componentes (equipos, escudos, marcador, minuto, estado, grupo, etc.):
  - Calendario / resultados: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`
  - Tabla de posiciones: `https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings`
- `src/app/api/scoreboard/route.js` y `src/app/api/standings/route.js` — rutas
  serverless propias que proxean esos endpoints (con `revalidate` para cachear
  en el servidor: 30s para partidos, 5min para posiciones).
- `src/hooks/useLiveData.js` — hook (`useLiveMatches`, `useLiveStandings`) que
  hace polling a esas rutas desde el cliente y devuelve `{ data, live }`:
  mientras la API de ESPN no tenga datos reales todavía (por ejemplo, antes de
  que arranque el torneo) sigue mostrando los datos de muestra de
  `src/lib/data.js` y lo indica con un badge ("○ DATOS DE MUESTRA" /
  "● EN VIVO — ESPN") en Hero, Partidos del Día y Clasificación.
- `src/components/TeamBadge.js` — renderiza tanto los emojis de bandera de los
  datos de muestra como los escudos (URLs de imagen) que devuelve ESPN, sin
  que los componentes necesiten saber cuál están usando.
- `src/app/api/ai/route.js` — el asistente de IA arma su contexto con estos
  mismos datos en vivo (con el mismo *fallback* a datos de muestra), así que
  puede responder sobre los próximos partidos y posiciones reales en cuanto
  ESPN los publique.

**Limitación conocida**: el endpoint de calendario (`scoreboard`) no incluye
estadísticas en vivo (posesión, remates, córners) ni la cronología minuto a
minuto — esos datos requieren los endpoints por partido `situation` /
`play-by-play` de la v2/v3 de ESPN (`sports.core.api.espn.com/v3/sports/soccer/.../events/{id}/competitions/{id}/situation`),
que no están integrados todavía. Si querés agregarlos, podés extender
`fetchScoreboard()` en `src/lib/espn.js` para pedir esos datos por partido en
vivo y completar el campo `stats`/`statusDetail` que ya consumen
`Hero` y `MatchesSection`.

Si en algún momento preferís una API con plan pago/soporte oficial (por
ejemplo para otros torneos, datos históricos más profundos o mayor SLA), estas
son alternativas con autenticación:

- **[API-FOOTBALL](https://www.api-football.com/)** (vía RapidAPI o directo) — la más
  completa para resultados en vivo, alineaciones, eventos minuto a minuto y
  estadísticas. Tiene plan gratuito limitado y planes pagos para mayor volumen/latencia.
- **[football-data.org](https://www.football-data.org/)** — gratis para uso personal/bajo
  volumen, ideal para tablas de posiciones, calendarios y resultados (eventos en vivo
  más limitados que API-FOOTBALL).
- **[SportMonks](https://www.sportmonks.com/)** — alternativa robusta, con foco en
  datos históricos y en vivo, planes pagos.

Para usar cualquiera de estas, generá tu key, guardala como variable de entorno
(ver `FOOTBALL_DATA_API_KEY` en `.env.example`) y creá una ruta serverless propia
que haga el `fetch` desde el servidor — igual que ya hacen `/api/scoreboard` y
`/api/standings` con ESPN.

---

## 5. El asistente de IA por voz — cómo funciona

- **Texto → IA**: el widget (`src/components/AIAssistant.js`) manda el historial de
  mensajes a `POST /api/ai`, que arma un *system prompt* con los datos del torneo
  (para que el asistente pueda responder sobre los partidos mostrados) y llama a
  la API de Claude (`src/app/api/ai/route.js`).
- **Voz → texto (entrada)**: usa la **Web Speech API** nativa del navegador
  (`SpeechRecognition` / `webkitSpeechRecognition`, en español `es-ES`). Soportada en
  Chrome, Edge y Safari recientes; el botón de micrófono se oculta automáticamente
  si el navegador no la soporta.
- **Texto → voz (salida)**: usa `speechSynthesis` / `SpeechSynthesisUtterance` del
  navegador para leer en voz alta las respuestas del asistente (se puede silenciar
  con el botón "🔊 VOZ" del panel).

Si más adelante querés voces más naturales o control total (por ejemplo, mismo
acento/voz en todos los navegadores), se puede reemplazar la Web Speech API por
**Whisper + TTS de OpenAI** o **ElevenLabs**, llamándolas también desde rutas
serverless para no exponer claves.

---

## 6. Deploy en Vercel

1. Subí el proyecto a un repo de GitHub/GitLab/Bitbucket.
2. Entrá a **[vercel.com/new](https://vercel.com/new)** e importá el repo
   (Vercel detecta Next.js automáticamente, no hace falta configurar nada del build).
3. En **Environment Variables**, agregá `ANTHROPIC_API_KEY` (y `FOOTBALL_DATA_API_KEY`
   si ya conectaste una API de partidos) con los mismos valores que tenés en
   `.env.local`.
4. Hacé clic en **Deploy**. Cada push a la rama principal vuelve a desplegar
   automáticamente.

O desde la terminal, con la [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel
vercel        # deploy de prueba
vercel --prod # deploy a producción
```

(`vercel` te va a pedir vincular el proyecto y podés cargar las variables de entorno
con `vercel env add ANTHROPIC_API_KEY`).

---

## Estructura del proyecto

```
src/
  app/
    page.js          → composición de todas las secciones
    layout.js        → fuentes (Anton, Condiment, JetBrains Mono) y metadata
    globals.css      → tema de Tailwind v4, liquid glass, animaciones
    api/ai/route.js  → proxy serverless a Claude (oculta la API key)
  components/        → Navbar, Hero, MatchesSection, StandingsSection,
                       BracketSection, CTASection, Footer, AIAssistant, etc.
  lib/data.js        → datos de muestra (misma forma que una API real)
```
