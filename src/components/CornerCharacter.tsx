import { useState, useEffect, useCallback } from 'react';
import type { Character } from '@/hooks/useGameState';

interface CornerCharacterProps {
  character: Character;
  onClick: () => void;
}

const BODY_SRC: Record<Character, string> = {
  steve: '/assets/steve-idle.png',
  samsung: '/assets/samsung-body.png',
};

const LABELS: Record<Character, string> = {
  steve: 'Steve',
  samsung: 'Samsung CEO',
};

export default function CornerCharacter({ character, onClick }: CornerCharacterProps) {
  const [showBubble, setShowBubble] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Show speech bubble periodically
  useEffect(() => {
    const showTimer = setTimeout(() => setShowBubble(true), 2000);
    const hideTimer = setTimeout(() => setShowBubble(false), 7000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
    setShowBubble(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    setShowBubble(false);
  }, []);

  return (
    <div
      className={`fixed z-40 cursor-pointer transition-all duration-300 ${hovered ? 'scale-110' : 'scale-100'}`}
      style={{
        left: 12,
        bottom: 140,
        width: 'min(16vh, 130px)',
        height: 'min(22vh, 180px)',
        transform: `rotate(-8deg) ${hovered ? 'scale(1.1)' : 'scale(1)'}`,
        transformOrigin: 'bottom center',
        filter: hovered ? 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
      }}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Character image */}
      <img
        src={BODY_SRC[character]}
        alt={LABELS[character]}
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Click hint */}
      {hovered && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-500 whitespace-nowrap animate-pulse">
          {'Click to swap!'}
        </div>
      )}

      {/* Speech bubble */}
      {showBubble && (
        <div
          className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white rounded-xl px-3 py-1.5 border-2 border-gray-300 shadow-lg whitespace-nowrap animate-bounce"
          style={{
            animation: 'bubble-pop 0.4s ease-out, bubble-float 2s ease-in-out infinite 0.4s',
          }}
        >
          <span className="text-xs font-bold text-gray-700" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
            {character === 'samsung' ? "oooooh, i want some too" : "my turn! come back!"}
          </span>
          {/* Bubble tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-gray-300 rotate-45" />
        </div>
      )}
    </div>
  );
}
