import type { HappyParticle as HPType } from '@/hooks/useGameState';

interface Props {
  particles: HPType[];
}

export default function HappyParticles({ particles }: Props) {
  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="happy-particle"
          style={{
            left: p.x,
            top: p.y,
            width: 8 + Math.random() * 6,
            height: 8 + Math.random() * 6,
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
