import type { FloatingText as FTType } from '@/hooks/useGameState';

interface Props {
  texts: FTType[];
}

export default function FloatingText({ texts }: Props) {
  return (
    <>
      {texts.map((t) => (
        <div
          key={t.id}
          className="floating-text"
          style={{
            left: t.x,
            top: t.y,
            color: t.color,
            fontSize: '1.3rem',
            zIndex: 60,
          }}
        >
          {t.text}
        </div>
      ))}
    </>
  );
}
