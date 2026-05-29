import { useCallback } from 'react';
import type { ItemType } from '@/hooks/useGameState';

interface ItemBarProps {
  onDragStart: (item: ItemType, x: number, y: number) => void;
  disabled?: boolean;
}

const ITEMS: { type: ItemType; src: string; label: string; color: string }[] = [
  { type: 'apple', src: '/assets/item-apple.png', label: 'Apple', color: '#EF4444' },
  { type: 'android', src: '/assets/item-android.png', label: 'Android', color: '#22C55E' },
  { type: 'windows', src: '/assets/item-windows.png', label: 'Windows', color: '#3B82F6' },
  { type: 'banana', src: '/assets/item-banana.png', label: 'Banana', color: '#EAB308' },
  { type: 'burger', src: '/assets/item-burger.png', label: 'Burger', color: '#F97316' },
  { type: 'pastry', src: '/assets/item-pastry.png', label: 'Pastry', color: '#D97706' },
];

export default function ItemBar({ onDragStart, disabled }: ItemBarProps) {
  const handlePointerDown = useCallback((e: React.PointerEvent, item: ItemType) => {
    if (disabled) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    onDragStart(item, e.clientX, e.clientY);
  }, [onDragStart, disabled]);

  return (
    <div className="flex items-center gap-2 p-2 flex-wrap justify-center select-none">
      {ITEMS.map((item) => (
        <div
          key={item.type}
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] bg-white shadow-md select-none touch-none ${
            disabled ? 'opacity-40 grayscale' : 'active:scale-90 hover:scale-110'
          }`}
          style={{ borderColor: item.color, transition: 'transform 0.1s, opacity 0.2s' }}
          onPointerDown={(e) => handlePointerDown(e, item.type)}
        >
          <img
            src={item.src}
            alt={item.label}
            className="w-full h-full object-contain p-1 pointer-events-none"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
