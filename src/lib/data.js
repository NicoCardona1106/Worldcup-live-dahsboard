// Placeholder data — shaped to match what a live-scores API (e.g. API-FOOTBALL,
// football-data.org) typically returns, so swapping in real fetches is a drop-in.

export const matches = [
  {
    id: 1,
    homeTeam: "Brasil",
    homeFlag: "🇧🇷",
    awayTeam: "Alemania",
    awayFlag: "🇩🇪",
    homeScore: null,
    awayScore: null,
    minute: null,
    status: "SCHEDULED",
    time: "14:00",
    group: "GRUPO B",
    stats: { possession: [50, 50], shots: [0, 0], corners: [0, 0] },
  },
  {
    id: 2,
    homeTeam: "España",
    homeFlag: "🇪🇸",
    awayTeam: "Inglaterra",
    awayFlag: "🏴",
    homeScore: null,
    awayScore: null,
    minute: null,
    status: "SCHEDULED",
    time: "17:00",
    group: "GRUPO D",
    stats: { possession: [50, 50], shots: [0, 0], corners: [0, 0] },
  },
  {
    id: 3,
    homeTeam: "Colombia",
    homeFlag: "🇨🇴",
    awayTeam: "Países Bajos",
    awayFlag: "🇳🇱",
    homeScore: null,
    awayScore: null,
    minute: null,
    status: "SCHEDULED",
    time: "20:00",
    group: "GRUPO C",
    stats: { possession: [50, 50], shots: [0, 0], corners: [0, 0] },
  },
  {
    id: 4,
    homeTeam: "Argentina",
    homeFlag: "🇦🇷",
    awayTeam: "Francia",
    awayFlag: "🇫🇷",
    homeScore: 2,
    awayScore: 1,
    minute: 78,
    status: "LIVE",
    time: "LIVE",
    group: "GRUPO A",
    stats: { possession: [58, 42], shots: [14, 9], corners: [7, 4] },
  },
];

export const groups = {
  "GRUPO A": [
    { team: "Argentina", flag: "🇦🇷", pj: 3, g: 2, e: 1, p: 0, pts: 7, top: true },
    { team: "Francia", flag: "🇫🇷", pj: 3, g: 2, e: 0, p: 1, pts: 6, top: true },
    { team: "Países Bajos", flag: "🇳🇱", pj: 3, g: 1, e: 1, p: 1, pts: 4, top: false },
    { team: "México", flag: "🇲🇽", pj: 3, g: 0, e: 0, p: 3, pts: 0, top: false },
  ],
  "GRUPO B": [
    { team: "Brasil", flag: "🇧🇷", pj: 3, g: 3, e: 0, p: 0, pts: 9, top: true },
    { team: "Alemania", flag: "🇩🇪", pj: 3, g: 2, e: 0, p: 1, pts: 6, top: true },
    { team: "Japón", flag: "🇯🇵", pj: 3, g: 1, e: 0, p: 2, pts: 3, top: false },
    { team: "Ghana", flag: "🇬🇭", pj: 3, g: 0, e: 0, p: 3, pts: 0, top: false },
  ],
  "GRUPO C": [
    { team: "Colombia", flag: "🇨🇴", pj: 3, g: 2, e: 1, p: 0, pts: 7, top: true },
    { team: "Portugal", flag: "🇵🇹", pj: 3, g: 2, e: 0, p: 1, pts: 6, top: true },
    { team: "Marruecos", flag: "🇲🇦", pj: 3, g: 1, e: 1, p: 1, pts: 4, top: false },
    { team: "Corea del Sur", flag: "🇰🇷", pj: 3, g: 0, e: 0, p: 3, pts: 0, top: false },
  ],
  "GRUPO D": [
    { team: "España", flag: "🇪🇸", pj: 3, g: 3, e: 0, p: 0, pts: 9, top: true },
    { team: "Inglaterra", flag: "🏴", pj: 3, g: 1, e: 1, p: 1, pts: 4, top: true },
    { team: "Croacia", flag: "🇭🇷", pj: 3, g: 1, e: 1, p: 1, pts: 4, top: false },
    { team: "Senegal", flag: "🇸🇳", pj: 3, g: 0, e: 1, p: 2, pts: 1, top: false },
  ],
};

export const tournamentStats = [
  { value: "64", label: "PARTIDOS", color: "text-neon" },
  { value: "172", label: "GOLES", color: "text-gold" },
  { value: "5.3", label: "PROMEDIO POR PARTIDO", color: "text-blue" },
  { value: "89%", label: "ESTADIOS LLENOS", color: "text-red" },
];

export const topScorers = [
  { name: "K. Mbappé", flag: "🇫🇷", goals: 7 },
  { name: "L. Messi", flag: "🇦🇷", goals: 6 },
  { name: "E. Haaland", flag: "🇳🇴", goals: 6 },
  { name: "Vinícius Jr.", flag: "🇧🇷", goals: 5 },
  { name: "J. Bellingham", flag: "🏴", goals: 4 },
];

export const matchEvents = [
  { minute: 12, type: "goal", team: "ARG", text: "¡GOOOL! L. Messi anota de penal" },
  { minute: 34, type: "yellow", team: "FRA", text: "Tarjeta amarilla para T. Hernández" },
  { minute: 51, type: "goal", team: "FRA", text: "¡Empate! K. Mbappé define al primer palo" },
  { minute: 69, type: "sub", team: "ARG", text: "Cambio: entra J. Álvarez por L. Martínez" },
  { minute: 76, type: "goal", team: "ARG", text: "¡GOOOL! Á. Di María pone el 2-1" },
];
