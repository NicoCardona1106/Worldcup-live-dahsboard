"use client";

// Pure-CSS confetti burst for goal celebrations — no dependencies. The pieces
// are deterministic (index math, no Math.random) so renders stay pure and
// server/client output match. Mount it inside a `relative overflow-hidden`
// container while celebrating; every piece falls once and fades out.
const COLORS = ["#6FFF00", "#FFD700", "#3BA4FF", "#FF4D4D", "#EFF4FF"];

const PIECES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: (i % 7) * 0.18,
  duration: 2.2 + ((i * 13) % 10) / 10,
  color: COLORS[i % COLORS.length],
  size: 6 + ((i * 7) % 6),
  rotate: (i * 47) % 360,
}));

export default function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: Math.max(3, Math.round(p.size * 0.45)),
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
