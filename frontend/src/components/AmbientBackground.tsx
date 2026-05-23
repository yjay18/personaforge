import { useMemo } from "react";

interface Props {
  intensity: number;
}

/**
 * Decorative floating-particle background. Particle count and opacity scale
 * with the creativity slider so high settings feel a bit more "alive".
 */
export default function AmbientBackground({ intensity }: Props) {
  const particles = useMemo(() => {
    const count = Math.min(intensity * 2, 15);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${10 + Math.random() * 80}%`,
      bottom: `${Math.random() * 30}%`,
      size: 40 + Math.random() * 80,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
      opacity: 0.03 + (intensity / 10) * 0.08,
    }));
  }, [intensity]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="ambient-particle"
          style={
            {
              left: p.left,
              bottom: p.bottom,
              width: p.size,
              height: p.size,
              "--duration": `${p.duration}s`,
              "--delay": `${p.delay}s`,
              opacity: p.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
