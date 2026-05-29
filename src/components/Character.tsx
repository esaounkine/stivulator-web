import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { SteveState } from '@/hooks/useGameState';

export interface CharacterHandle {
  getMouthRect: () => DOMRect | null;
}

interface CharacterProps {
  bodySrc: string;
  steveState: SteveState;
  mouthOpen: boolean;
  isTickling: boolean;
  onTickleStart: (x: number, y: number) => void;
  onTickleMove: (x: number, y: number) => void;
  onTickleEnd: () => void;
}

const Character = forwardRef<CharacterHandle, CharacterProps>(function Character({
  bodySrc, steveState, mouthOpen, onTickleStart, onTickleMove, onTickleEnd,
}, ref) {
  const mouthRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getMouthRect: () => mouthRef.current?.getBoundingClientRect() ?? null,
  }));

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onTickleStart(e.clientX, e.clientY);
  }, [onTickleStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons > 0) onTickleMove(e.clientX, e.clientY);
  }, [onTickleMove]);

  const handlePointerUp = useCallback(() => {
    onTickleEnd();
  }, [onTickleEnd]);

  const animClass = steveState === 'annoyed' ? 'steve-annoyed'
    : steveState === 'laughing' ? 'steve-laughing'
    : steveState === 'eating' ? 'steve-eating'
    : steveState === 'postEat' ? 'steve-post-eat'
    : 'steve-idle';

  const showAnnoyedFace = steveState === 'annoyed' || steveState === 'postEat';

  return (
    <div
      className={`relative select-none ${animClass}`}
      style={{ width: 'min(42vh, 340px)', height: 'min(58vh, 480px)' }}
    >
      {/* Base body - the character-specific image */}
      <img
        src={bodySrc}
        alt="Character"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Face overlays - same faces, different body = comedy */}
      {showAnnoyedFace && (
        <img src="/assets/face-annoyed.png" alt="" className="face-overlay" draggable={false} />
      )}
      {steveState === 'laughing' && (
        <img src="/assets/face-laughing.png" alt="" className="face-overlay" draggable={false} />
      )}
      {steveState === 'eating' && (
        <img src="/assets/face-eating.png" alt="" className="face-overlay" draggable={false} />
      )}

      {/* Tickle zone (belly) */}
      <div
        className="absolute tickle-zone"
        style={{ left: '18%', top: '42%', width: '64%', height: '35%', borderRadius: '45%' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Mouth target zone */}
      <div
        ref={mouthRef}
        className="absolute"
        style={{ left: '30%', top: '18%', width: '40%', height: '18%', borderRadius: '50%' }}
      >
        {mouthOpen && (
          <div
            className="absolute inset-0 mouth-hint rounded-full border-2 border-dashed"
            style={{ borderColor: '#4ADE80', backgroundColor: 'rgba(74, 222, 128, 0.12)' }}
          />
        )}
      </div>
    </div>
  );
});

export default Character;
