import type { ItemType, TrajectoryPoint, ThrowState } from '@/hooks/useGameState';

const ITEM_SRC: Record<ItemType, string> = {
  apple: '/assets/item-apple.png',
  android: '/assets/item-android.png',
  windows: '/assets/item-windows.png',
  banana: '/assets/item-banana.png',
  burger: '/assets/item-burger.png',
  pastry: '/assets/item-pastry.png',
};

interface DragOverlayProps {
  isDragging: boolean;
  draggedItem: ItemType | null;
  dragPos: { x: number; y: number };
  trajectory: TrajectoryPoint[];
  activeThrow: ThrowState | null;
}

export default function DragOverlay({
  isDragging, draggedItem, dragPos, trajectory, activeThrow,
}: DragOverlayProps) {
  // Active throw animation
  if (activeThrow) {
    return (
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: activeThrow.x - 20,
          top: activeThrow.y - 20,
          width: 40,
          height: 40,
          transform: `scale(${activeThrow.scale}) rotate(${activeThrow.rotation}deg)`,
          transition: 'none',
          opacity: activeThrow.progress > 0.8 ? 1 - (activeThrow.progress - 0.8) * 5 : 1,
        }}
      >
        <img
          src={ITEM_SRC[activeThrow.item]}
          alt={activeThrow.item}
          className="w-full h-full object-contain"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
          draggable={false}
        />
      </div>
    );
  }

  if (!isDragging || !draggedItem) return null;

  return (
    <>
      {/* Trajectory arc preview */}
      {trajectory.length > 0 && (
        <svg className="fixed inset-0 z-40 pointer-events-none" style={{ width: '100vw', height: '100vh' }}>
          <path
            d={`M ${trajectory[0].x} ${trajectory[0].y} ${trajectory.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
            className="trajectory-line"
            stroke="rgba(255, 200, 0, 0.7)"
            strokeWidth="3"
          />
          {trajectory.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={2 + (i / trajectory.length) * 4}
              fill={i > trajectory.length * 0.7 ? '#4ADE80' : '#FFD700'}
              opacity={0.3 + (i / trajectory.length) * 0.5}
              className="trajectory-dot"
            />
          ))}
        </svg>
      )}

      {/* Dragged item */}
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: dragPos.x - 24,
          top: dragPos.y - 24,
          width: 48,
          height: 48,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))',
        }}
      >
        <img
          src={ITEM_SRC[draggedItem]}
          alt={draggedItem}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    </>
  );
}
