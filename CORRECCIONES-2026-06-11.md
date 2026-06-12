# Correcciones — 11/12 de junio de 2026

Auditoría y corrección de 4 problemas reportados, validados con datos reales del
torneo: **México 2-0 Sudáfrica (finalizado)** y **Corea del Sur vs Chequia (en vivo)**.

---

## 1. Chatbot y menú ilegibles en móvil

### Causa raíz
Ambos overlays usaban únicamente `.liquid-glass`, un fondo translúcido
(`rgba(239,244,255,0.08)`) que depende de `backdrop-filter: blur()`. Varios
navegadores móviles no aplican `backdrop-filter` (o lo rompen sobre capas con
video + `mix-blend-mode` del grain overlay), dejando el panel prácticamente
transparente: el texto del chat y del menú se mezclaba con el contenido de la
página. Además el panel del chat tenía altura sin tope dinámico (`max-h-[50vh]`
con `vh` estático, que en móvil no descuenta la barra de URL/teclado).

### Solución
- **`globals.css`**: nueva clase `.glass-solid` (gradiente azul marino ~97–98%
  opaco) declarada después de `.liquid-glass` para ganar la cascada. Los
  overlays flotantes ya no dependen de `backdrop-filter`.
- **`AIAssistant.js`**:
  - Panel y botón flotante a `z-[80]` (por encima del grain overlay `z-40`,
    navbar `z-50` y ticker).
  - Fondo sólido (`glass-solid`).
  - En móvil el panel es una hoja a lo ancho (`inset-x-3`) anclada sobre el
    launcher; en `sm+` vuelve a ser tarjeta flotante de `24rem`.
  - Altura limitada con viewport dinámico: `max-h-[min(34rem,calc(100dvh-7rem))]`
    y mensajes con `max-h-[50dvh]` — el teclado/barra de URL ya no lo empuja
    fuera de pantalla.
  - Header/sugerencias/formulario con `shrink-0` para que solo la lista de
    mensajes haga scroll.
  - Launcher más compacto en móvil (`w-14 h-14`) y `aria-label` que refleja
    abrir/cerrar.
- **`Navbar.js`**:
  - Dropdown móvil con `glass-solid` + sombra fuerte → texto legible.
  - Backdrop a pantalla completa (`bg-bgnavy/60`) que atenúa la página detrás y
    **cierra el menú al tocar fuera**.
  - `<nav>` con `relative z-50` para que el botón ✕ quede clicable por encima
    del backdrop.
  - Ítems con `py-2.5` (área táctil mayor).

---

## 2. Cronología incompleta o vacía

### Causa raíz
La cronología era **un dato de muestra estático** (`matchEvents` de
`lib/data.js`, eventos inventados de "Argentina vs Francia") que solo se
mostraba si el partido tenía `stats` — y como `transformMatch` devolvía
`stats: null` siempre, en partidos reales solo se veía el `statusDetail`
("FT"), nada más. Nunca hubo integración con eventos reales.

### Solución
- **`lib/espn.js`**: nueva función `fetchMatchEvents(eventId, { live })` que
  consulta el endpoint `summary?event={id}` de ESPN y transforma `keyEvents`
  (goles — incl. cabeza/penal/en contra —, amarillas, rojas y cambios) a
  español con minuto, equipo y jugador(es): p. ej.
  `9' ⚽ ¡Gol de Mexico! Julián Quiñones — asiste Érik Lira`,
  `49' 🟥 Roja para Sphephelo Sithole (South Africa)`.
  Ruido (kickoff, descansos, pausas de hidratación, VAR) se filtra.
  Revalidación: 30 s en vivo (los goles aparecen solos), 600 s finalizados.
- **`fetchScoreboard()`** adjunta `events[]` a cada partido en vivo o
  finalizado (acotado a 8 partidos por costo). Cualquier fallo degrada a
  cronología vacía, nunca a error.
- **`MatchesSection.js`**: la tarjeta expandida renderiza los eventos reales;
  los de muestra solo aparecen junto a los fixtures de muestra; si un partido
  real aún no tiene incidencias (p. ej. Corea 0-0 sin tarjetas) se indica
  "Aún no hay incidencias registradas". En vivo se refresca solo con el
  polling de 45 s.

---

## 3. El contador de "Próximo Partido" no avanzaba

### Causa raíz (doble)
1. **Cliente** (`Hero.js`): `featured = matches.find(LIVE) || matches[0]` — al
   terminar México, `matches[0]` era ese mismo partido FINAL, así que el hero
   quedaba clavado mostrando "PRÓXIMO PARTIDO" sobre un partido ya terminado y
   sin countdown.
2. **Servidor** (`lib/espn.js`): se pedía el scoreboard del día de ESPN, que
   tras el último partido de la jornada no contiene ningún fixture futuro hasta
   que ESPN rota su día — sin recarga ni datos del día siguiente, no había a
   qué avanzar.

### Solución
- **`lib/espn.js`**: `fetchScoreboard()` ahora pide una **ventana de fechas**
  (`?dates=ayer–+7días&limit=100`) y devuelve: partidos en vivo + finalizados
  de las últimas 24 h + los fixtures de la **próxima jornada** (mismo día
  Bogotá, máx. 6), ordenados por kickoff. El próximo partido siempre está en la
  respuesta.
- **`Hero.js`**: prioridad del destacado: **EN VIVO > próximo SCHEDULED por
  kickoff > último FINAL**. Con el polling de 45 s, al terminar un partido el
  hero rota solo (equipos, hora, fecha, estado y countdown) sin recargar.
  Si el destacado es un final sin nada por delante, la etiqueta dice
  "FINALIZADO" (antes decía "PRÓXIMO PARTIDO" sobre un partido terminado).
- **`Countdown.js`**: al llegar a cero muestra "¡POR COMENZAR!" con pulso en
  vez de desaparecer (cubre el lapso hasta que el proveedor marca el partido
  como en vivo).

### Validación
- Con Corea en vivo, el hero la muestra como EN VIVO (correcto por prioridad).
- Simulación end-to-end en el navegador (interceptando el fetch del polling y
  marcando Corea como FINAL): en el siguiente ciclo de 45 s el hero saltó solo
  a **Canadá vs Bosnia (VIE 12 JUN, 14:00 COL)** con countdown activo, sin
  recargar la página.

---

## 4. Estadísticas en vivo incorrectas

### Causa raíz
El Hero mostraba **estadísticas inventadas** durante partidos en vivo: un
arreglo hardcodeado `FALLBACK_STATS` (posesión 58%, 14 remates, 7 córners,
xG 2.31) que se renderizaba siempre que el partido destacado estaba en vivo,
porque `transformMatch` devolvía `stats: null` (el comentario del código
asumía — incorrectamente — que el scoreboard de ESPN no trae estadísticas).
Las tarjetas de partido, por su parte, solo mostraban stats con los datos de
muestra.

### Solución (auditoría de la fuente)
- El scoreboard de ESPN **sí** trae `competitors[].statistics` por equipo:
  `possessionPct`, `totalShots`, `shotsOnTarget`, `wonCorners`.
- **`lib/espn.js`**: `extractStats(home, away)` mapea esos campos a
  `{ possession, shots, shotsOnTarget, corners }` como pares `[local, visitante]`.
  Validaciones implementadas:
  - **Sin intercambio de equipos**: cada lado se resuelve por el flag
    `homeAway` del competidor, nunca por posición en el arreglo.
  - **Sin nulos**: un par solo existe si *ambos* equipos reportan un número
    (`parseFloat` + `Number.isFinite`); si falta, esa fila no se renderiza.
  - **Sin datos pre-partido engañosos**: `stats` solo se adjunta a partidos
    LIVE/FINAL (antes del pitazo ESPN manda filas en cero que se verían como
    "0–0 reales").
  - **Sin caché obsoleta**: la ruta revalida cada 30 s y el hook cliente
    hace `fetch` con `cache: "no-store"` cada 45 s.
- **`Hero.js`**: `FALLBACK_STATS` eliminado; las barras se construyen solo con
  pares presentes y se agregó **AL ARCO** (tiros al arco). Se eliminó el xG
  inventado. Posesión ahora muestra ambos lados ("55% - 45%").
- **`MatchesSection.js`**: fila **TIROS AL ARCO** agregada; cada fila es
  condicional a que el proveedor haya enviado ese par.

### Validación con Corea del Sur (en vivo, 45'+3')
| Métrica | Dashboard | ESPN (fuente) |
|---|---|---|
| Posesión | 55% - 45% | 53.1→55 (redondeo live) - 45 ✔ |
| Remates | 8 - 2 | totalShots 8 - 2 ✔ |
| Tiros al arco | 1 - 0 | shotsOnTarget 1 - 0 ✔ |
| Córners | 3 - 3 | wonCorners 3 - 3 ✔ |

México (final): posesión 61%-40%, remates 16-3, al arco 4-2 — consistente con
la fuente.

---

## Extras encontrados en la auditoría

- **Minuto con apóstrofes dobles**: `displayClock` tipo `45'+3'` se saneaba con
  `replace("'", "")` (solo la primera) → la UI mostraba `45+3''`. Ahora
  `replace(/'/g, "")` → `45+3'`.
- **Hydration mismatch en cada tarjeta**: `icsDataUri()` (`lib/calendar.js`)
  generaba `DTSTAMP` con `new Date()` durante el render → el HTML del servidor
  y del cliente diferían y React reportaba un error de hidratación en cada
  `MatchActions`. Ahora el stamp es determinístico (el kickoff del partido).
- **Lint**: `Date.now()` dentro del `useMemo` del Hero violaba
  `react-hooks/purity` → se eliminó (el servidor ya garantiza que los
  SCHEDULED son futuros). Falso positivo preexistente en el handler de click
  del Navbar suprimido con comentario. `npm run lint` queda en verde.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/espn.js` | Stats reales por equipo, cronología desde `summary/keyEvents`, ventana de fechas + próxima jornada, saneo del minuto |
| `src/components/Hero.js` | Sin stats falsas, barra AL ARCO, prioridad live>próximo>final, etiqueta FINALIZADO |
| `src/components/MatchesSection.js` | Cronología real con íconos (⚽🟨🟥🔁), TIROS AL ARCO, filas condicionales |
| `src/components/Countdown.js` | Estado "¡POR COMENZAR!" al expirar |
| `src/components/AIAssistant.js` | z-index, fondo sólido, hoja móvil con `dvh`, áreas `shrink-0` |
| `src/components/Navbar.js` | Menú móvil sólido + backdrop con cierre al tocar fuera |
| `src/app/globals.css` | Clase `.glass-solid` |
| `src/lib/calendar.js` | `DTSTAMP` determinístico (fix de hidratación) |

## Evidencias

Capturas en `docs/evidencias/` (viewport 375×812 salvo indicado):

- `01-hero-mobile.png` — Hero con Corea EN VIVO y stats reales.
- `02-menu-mobile.png` — menú móvil sólido y legible con backdrop.
- `03-chatbot-mobile.png` — chatbot legible, hoja a lo ancho.
- `04-cronologia-mexico.png` — cronología real de México 2-0 Sudáfrica.
- `05-hero-desktop.png` — desktop intacto (1440×900).
- `06-contador-siguiente.png` — hero rotado al próximo partido tras simular el
  final de Corea (sin recarga).
