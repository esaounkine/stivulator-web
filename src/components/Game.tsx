import { useCallback, useEffect, useRef } from 'react';
import { useGameState, type ItemType, type Character as CharType } from '@/hooks/useGameState';
import Character from './Character';
import type { CharacterHandle } from './Character';
import CornerCharacter from './CornerCharacter';
import ItemBar from './ItemBar';
import FloatingText from './FloatingText';
import HappyParticles from './HappyParticles';
import DragOverlay from './DragOverlay';
import Countdown from './Countdown';

const BODY_SRC: Record<CharType, string> = {
  steve: '/assets/steve-idle.png',
  samsung: '/assets/samsung-body.png',
};

const CORNER_CHAR: Record<CharType, CharType> = {
  steve: 'samsung',
  samsung: 'steve',
};

export default function Game() {
  const {
    activeCharacter, isSwapping,
    steveState, mouthOpen, score, highScore, feedStreak,
    floatingTexts, particles, scoreBounce, laughCountdown,
    isTickling, isDragging, draggedItem, dragPos, trajectory, activeThrow,
    tickleStart, tickleMove, tickleEnd,
    dragStart, dragMove, dragEnd,
    swapCharacter,
  } = useGameState();

  const charRef = useRef<CharacterHandle>(null);
  const dragHistory = useRef<{ x: number; y: number; t: number }[]>([]);
  const isDraggingRef = useRef(false);
  const dragItemRef = useRef<ItemType | null>(null);

  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
  useEffect(() => { dragItemRef.current = draggedItem; }, [draggedItem]);

  const getMouthRect = useCallback(() => charRef.current?.getMouthRect() ?? null, []);

  // Global pointer tracking
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (e.buttons === 0) return;
      const now = performance.now();

      if (isTickling) tickleMove(e.clientX, e.clientY);

      if (isDraggingRef.current && dragItemRef.current) {
        dragMove(e.clientX, e.clientY, getMouthRect());
        dragHistory.current.push({ x: e.clientX, y: e.clientY, t: now });
        if (dragHistory.current.length > 8) dragHistory.current.shift();
      }
    };

    const handleUp = () => {
      if (isTickling) tickleEnd();
      if (isDraggingRef.current) {
        dragEnd(getMouthRect(), [...dragHistory.current]);
        dragHistory.current = [];
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isTickling, tickleMove, tickleEnd, dragMove, dragEnd, getMouthRect]);

  const handleItemDragStart = useCallback((item: ItemType, x: number, y: number) => {
    dragHistory.current = [{ x, y, t: performance.now() }];
    dragStart(item, x, y);
  }, [dragStart]);

  const handleSwap = useCallback(() => {
    swapCharacter(CORNER_CHAR[activeCharacter]);
  }, [activeCharacter, swapCharacter]);

  const isFeedWindow = steveState === 'laughing' && mouthOpen;

  return (
    <div
      className="relative w-full h-screen overflow-hidden select-none"
      style={{
        backgroundImage: 'url(/assets/bg-room.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif',
        touchAction: 'none',
      }}
    >
      {/* Vignette */}
      <div className="absolute inset-0 pointer-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.1) 100%)' }} />

      {/* Title */}
      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <h1 className="text-4xl md:text-5xl font-bold" style={{
          color: '#FF6B6B',
          textShadow: '3px 3px 0 #FFE66D, -1px -1px 0 #fff',
        }}>
          {'Stivulator'}
        </h1>
        <p className="text-xs md:text-sm text-gray-400 italic mt-1">
          {'press & wiggle to tickle, drag items to throw'}
        </p>
      </div>

      {/* Active character name tag */}
      <div className="absolute top-20 left-4 z-30 pointer-events-none">
        <div className={`text-xs font-bold px-2 py-1 rounded-full border ${
          activeCharacter === 'steve'
            ? 'bg-black text-white border-gray-600'
            : 'bg-blue-100 text-blue-700 border-blue-300'
        }`}>
          {activeCharacter === 'steve' ? 'Tickling: Steve' : 'Tickling: Samsung CEO'}
        </div>
      </div>

      {/* Score */}
      <div className="absolute top-4 right-4 z-30 pointer-events-none">
        <div className={`bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border-[3px] border-yellow-300 shadow-lg ${scoreBounce ? 'score-bounce' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{'🍽️'}</span>
            <span className="text-2xl font-bold text-red-400">{score}</span>
          </div>
          {feedStreak > 1 && (
            <div className="text-[10px] text-orange-500 text-center font-bold animate-pulse">
              {'STREAK x'}{feedStreak}
            </div>
          )}
          <div className="text-[10px] text-gray-400 text-right">{'Best: '}{highScore}</div>
        </div>
      </div>

      {/* Feed window banner */}
      {isFeedWindow && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-green-500/90 rounded-full px-5 py-1.5 animate-pulse shadow-lg">
            <span className="text-white font-bold text-sm">{'🎯 DRAG ITEM TO MOUTH!'}</span>
          </div>
        </div>
      )}

      {/* Countdown */}
      <Countdown count={laughCountdown} />

      {/* MAIN CHARACTER - center */}
      <div className={`absolute inset-0 flex items-center justify-center z-10 ${isSwapping ? 'swap-out' : ''}`}>
        <Character
          ref={charRef}
          bodySrc={BODY_SRC[activeCharacter]}
          steveState={steveState}
          mouthOpen={mouthOpen}
          isTickling={isTickling}
          onTickleStart={tickleStart}
          onTickleMove={tickleMove}
          onTickleEnd={tickleEnd}
        />
      </div>

      {/* CORNER CHARACTER - the other CEO lurking */}
      <CornerCharacter
        character={CORNER_CHAR[activeCharacter]}
        onClick={handleSwap}
      />

      {/* Item bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl px-4 py-2 border-[3px] border-yellow-300 shadow-lg">
          <p className="text-[10px] text-gray-400 mb-1 text-center">
            {isDragging
              ? trajectory.length > 0 ? 'Release to throw! 🎯' : 'Aim at the open mouth!'
              : isFeedWindow
                ? 'DRAG AN ITEM INTO HIS MOUTH!'
                : 'Drag items to throw  •  Press belly to tickle'
            }
          </p>
          <ItemBar onDragStart={handleItemDragStart} disabled={!!activeThrow} />
        </div>
      </div>

      {/* Tutorial hint */}
      {score === 0 && steveState === 'idle' && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 text-xs text-gray-400 text-center animate-pulse">
            {'👆 Press & wiggle on belly to tickle'}
            <br />
            <span className="text-[10px]">{'Click the corner guy to swap targets!'}</span>
          </div>
        </div>
      )}

      {/* Overlays */}
      <FloatingText texts={floatingTexts} />
      <HappyParticles particles={particles} />
      <DragOverlay
        isDragging={isDragging}
        draggedItem={draggedItem}
        dragPos={dragPos}
        trajectory={trajectory}
        activeThrow={activeThrow}
      />
    </div>
  );
}
