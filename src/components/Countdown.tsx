interface CountdownProps {
  count: number;
}

const COLORS: Record<number, string> = {
  3: '#EF4444',
  2: '#F97316',
  1: '#22C55E',
};

export default function Countdown({ count }: CountdownProps) {
  if (count <= 0 || count > 3) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-start justify-center pt-[12vh]">
      <div
        className="countdown-number text-[8rem] md:text-[10rem]"
        style={{
          color: COLORS[count] || '#FFD700',
          textShadow: `4px 4px 0 rgba(0,0,0,0.3), 0 0 40px ${COLORS[count]}80`,
        }}
      >
        {count}
      </div>
    </div>
  );
}
