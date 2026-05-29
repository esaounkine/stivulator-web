import { useState, useCallback, useRef, useEffect } from 'react';
import { sounds } from '@/lib/sounds';

export type SteveState = 'idle' | 'annoyed' | 'laughing' | 'eating' | 'postEat' | 'dodging';
export type ItemType = 'apple' | 'android' | 'windows' | 'banana' | 'burger' | 'pastry';
export type Character = 'steve' | 'samsung';

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export interface HappyParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  tx: number;
  ty: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface ThrowState {
  item: ItemType;
  progress: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const ANNOYED_TEXTS = ['Hey!', 'Stop!', 'Go away!', 'Ugh!', 'Nooo!', 'Quit it!', 'Grrr!'];
const LAUGH_TEXTS = ['Hehe!', 'Haha!', 'Pffft!', 'Ohoho!', 'Teehee!', 'HAHA!'];
const EAT_TEXTS = ['Mmmph!', 'Gulp!', '*crunch*', 'Ack!', 'Ugh!', 'Why?!'];
const POST_EAT_TEXTS = ['Hmph!', 'Rude!', '...', 'Seriously?', 'Ugh.'];
const DODGE_TEXTS = ['Dodged!', 'Miss!', 'Too slow!', 'Nice try!', 'Nope!', 'Ha!'];
const PARTICLE_COLORS = ['#FFD700', '#FF69B4', '#00BFFF', '#FF6B6B', '#7FFF00', '#FF4500', '#FF00FF'];

const HIGH_SCORE_KEY = 'stivulator-high-score';
const LAUGH_CHANCE = 0.12;
const TICKLE_CHECK_MS = 150;
const LAUGH_DURATION = 3000;
const MAX_TRAJECTORY_POINTS = 15;

const ITEM_POINTS: Record<ItemType, number> = {
  apple: 10,
  android: 25,
  windows: 25,
  banana: 5,
  burger: 20,
  pastry: 15,
};

const ITEM_PENALTY: Record<ItemType, number> = {
  apple: 5,
  android: 15,
  windows: 15,
  banana: 5,
  burger: 10,
  pastry: 8,
};

export function useGameState() {
  const [activeCharacter, setActiveCharacter] = useState<Character>('steve');
  const [isSwapping, setIsSwapping] = useState(false);
  const [steveState, setSteveState] = useState<SteveState>('idle');
  const [mouthOpen, setMouthOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10); } catch { return 0; }
  });
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<HappyParticle[]>([]);
  const [scoreBounce, setScoreBounce] = useState(false);
  const [scoreShake, setScoreShake] = useState(false);
  const [feedStreak, setFeedStreak] = useState(0);
  const [laughCountdown, setLaughCountdown] = useState(0);

  // Tickle tracking
  const [isTickling, setIsTickling] = useState(false);

  // Drag/throw tracking
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<ItemType | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [activeThrow, setActiveThrow] = useState<ThrowState | null>(null);

  const nextId = useRef(0);
  const getId = useCallback(() => { nextId.current += 1; return nextId.current; }, []);

  const timers = useRef<{ laughCheck: ReturnType<typeof setInterval> | null; laughEnd: ReturnType<typeof setTimeout> | null; countdown: ReturnType<typeof setInterval> | null; postEat: ReturnType<typeof setTimeout> | null; dodge: ReturnType<typeof setTimeout> | null }>({ laughCheck: null, laughEnd: null, countdown: null, postEat: null, dodge: null });

  const clearAllTimers = useCallback(() => {
    Object.values(timers.current).forEach(t => { if (t) clearInterval(t); });
    timers.current = { laughCheck: null, laughEnd: null, countdown: null, postEat: null, dodge: null };
  }, []);

  const addText = useCallback((text: string, x: number, y: number, color = '#FF6B6B') => {
    const id = getId();
    setFloatingTexts(prev => [...prev, { id, text, x, y, color }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 1200);
  }, [getId]);

  const addParticles = useCallback((x: number, y: number) => {
    const newP: HappyParticle[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.6;
      const d = 30 + Math.random() * 80;
      newP.push({ id: getId(), x, y, color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)], tx: Math.cos(a) * d, ty: Math.sin(a) * d });
    }
    setParticles(prev => [...prev, ...newP]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newP.find(np => np.id === p.id))), 700);
  }, [getId]);

  const startCountdown = useCallback(() => {
    setLaughCountdown(3);
    let remaining = 3;
    timers.current.countdown = setInterval(() => {
      remaining -= 1;
      setLaughCountdown(remaining);
      if (remaining <= 0 && timers.current.countdown) { clearInterval(timers.current.countdown); timers.current.countdown = null; }
    }, 1000);
  }, []);

  // Ref to track current steveState for timer callbacks
  const steveStateRef = useRef(steveState);
  useEffect(() => { steveStateRef.current = steveState; }, [steveState]);

  const startLaughing = useCallback(() => {
    if (steveStateRef.current === 'dodging' || steveStateRef.current === 'eating') return;
    if (timers.current.laughCheck) { clearInterval(timers.current.laughCheck); timers.current.laughCheck = null; }
    setSteveState('laughing');
    setMouthOpen(true);
    startCountdown();
    sounds.laugh();

    timers.current.laughEnd = setTimeout(() => {
      setLaughCountdown(0);
      setMouthOpen(false);
      setSteveState(prev => {
        if (prev === 'laughing') {
          if (isTickling) { startLaughCheck(); return 'annoyed'; }
          setFeedStreak(0);
          return 'idle';
        }
        return prev;
      });
    }, LAUGH_DURATION);
  }, [isTickling, startCountdown]);

  const startLaughCheck = useCallback(() => {
    if (timers.current.laughCheck) clearInterval(timers.current.laughCheck);
    timers.current.laughCheck = setInterval(() => {
      if (Math.random() < LAUGH_CHANCE) startLaughing();
    }, TICKLE_CHECK_MS);
  }, [startLaughing]);

  // TICKLE: pointerdown on belly
  const tickleStart = useCallback((x: number, y: number) => {
    if (steveStateRef.current === 'dodging' || steveStateRef.current === 'eating') return;
    clearAllTimers();
    setIsTickling(true);
    setSteveState('annoyed');
    setMouthOpen(false);
    addText(ANNOYED_TEXTS[Math.floor(Math.random() * ANNOYED_TEXTS.length)], x, y - 60);
    startLaughCheck();
    sounds.tickle();
  }, [clearAllTimers, addText, startLaughCheck]);

  // TICKLE: pointermove while tickling
  const tickleMove = useCallback((_x: number, _y: number) => {
    // Movement while tickling keeps him annoyed and checking for laughter
    // We could add movement-based text here
  }, []);

  // TICKLE: pointerup
  const tickleEnd = useCallback(() => {
    setIsTickling(false);
    if (timers.current.laughCheck) { clearInterval(timers.current.laughCheck); timers.current.laughCheck = null; }
    if (steveState === 'annoyed') {
      setSteveState('idle');
      setFeedStreak(0);
    }
  }, [steveState]);

  // DRAG: pointerdown on item
  const dragStart = useCallback((item: ItemType, x: number, y: number) => {
    setIsDragging(true);
    setDraggedItem(item);
    setDragPos({ x, y });
    setTrajectory([]);
  }, []);

  // DRAG: pointermove
  const dragMove = useCallback((x: number, y: number, mouthRect: DOMRect | null) => {
    if (!isDragging || !draggedItem) return;
    setDragPos({ x, y });

    if (mouthOpen && mouthRect) {
      const mx = mouthRect.left + mouthRect.width / 2;
      const my = mouthRect.top + mouthRect.height / 2;
      // Build trajectory arc
      const pts: TrajectoryPoint[] = [];
      const dx = mx - x;
      const dy = my - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const arcH = Math.min(180, dist * 0.4 + 40);
      for (let i = 0; i <= MAX_TRAJECTORY_POINTS; i++) {
        const t = i / MAX_TRAJECTORY_POINTS;
        pts.push({ x: x + dx * t, y: y + dy * t - arcH * Math.sin(t * Math.PI) });
      }
      setTrajectory(pts);
    } else {
      setTrajectory([]);
    }
  }, [isDragging, draggedItem, mouthOpen]);

  // Calculate physics-based throw and launch it
  const launchThrow = useCallback((item: ItemType, sx: number, sy: number, ex: number, ey: number, velocity: number, onLand: () => void) => {
    const dist = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);
    // Duration: 0.3s (fast/flick) to 0.9s (slow/lob), based on velocity
    const duration = Math.max(0.25, Math.min(0.85, dist / Math.max(velocity * 3, 200)));
    const arcHeight = Math.min(200, dist * 0.35 + Math.random() * 60);

    const startTime = performance.now();
    sounds.throw();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / (duration * 1000), 1);
      const easeT = t * (2 - t); // ease-out

      const x = sx + (ex - sx) * easeT;
      const baseY = sy + (ey - sy) * easeT;
      const y = baseY - arcHeight * Math.sin(t * Math.PI);
      const scale = Math.max(0.2, 1 - t * 0.6);
      const rotation = t * 1080 * (velocity > 5 ? 1 : 0.5);

      setActiveThrow({ item, progress: t, x, y, rotation, scale });

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setActiveThrow(null);
          onLand();
        }, 30);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  // DRAG: pointerup
  const dragEnd = useCallback((mouthRect: DOMRect | null, dragHistory: { x: number; y: number; t: number }[]) => {
    if (!isDragging || !draggedItem) {
      setIsDragging(false); setDraggedItem(null); setTrajectory([]); return;
    }

    // Calculate velocity from last 3-5 drag points
    let velocity = 2;
    if (dragHistory.length >= 2) {
      const recent = dragHistory.slice(-4);
      let totalDist = 0;
      for (let i = 1; i < recent.length; i++) {
        const dt = recent[i].t - recent[i - 1].t;
        if (dt > 0) {
          const d = Math.sqrt((recent[i].x - recent[i - 1].x) ** 2 + (recent[i].y - recent[i - 1].y) ** 2);
          totalDist += d / dt * 16; // normalize to px/frame
        }
      }
      velocity = Math.max(1, totalDist / (recent.length - 1));
    }

    // Check if near mouth and laughing
    if (mouthOpen && mouthRect && steveState === 'laughing') {
      const mx = mouthRect.left + mouthRect.width / 2;
      const my = mouthRect.top + mouthRect.height / 2;
      const dist = Math.sqrt((dragPos.x - mx) ** 2 + (dragPos.y - my) ** 2);

      if (dist < 250) {
        // Successful throw!
        setIsDragging(false);
        setDraggedItem(null);
        setTrajectory([]);
        const item = draggedItem;
        launchThrow(item, dragPos.x, dragPos.y, mx, my, velocity, () => {
          // Eating sequence
          clearAllTimers();
          setLaughCountdown(0);
          setSteveState('eating');
          setMouthOpen(false);
          setIsTickling(false);

          sounds.eat();

          setFeedStreak(prev => {
            const ns = prev + 1;
            const pts = ITEM_POINTS[item] + ns * 5;
            setScore(cs => {
              const n = cs + pts;
              setHighScore(ch => { const h = Math.max(ch, n); try { localStorage.setItem(HIGH_SCORE_KEY, String(h)); } catch {} return h; });
              return n;
            });
            return ns;
          });

          addText(EAT_TEXTS[Math.floor(Math.random() * EAT_TEXTS.length)], mx, my - 30, '#3B82F6');
          addParticles(mx, my);
          setScoreBounce(true);
          setTimeout(() => setScoreBounce(false), 300);
          sounds.score();

          timers.current.postEat = setTimeout(() => {
            setSteveState('postEat');
            addText(POST_EAT_TEXTS[Math.floor(Math.random() * POST_EAT_TEXTS.length)], mx + (Math.random() - 0.5) * 40, my - 50, '#888');

            timers.current.postEat = setTimeout(() => {
              setSteveState('idle');
            }, 1200);
          }, 700);
        });
        return;
      }
    }

    // Miss — the item still flies, then Steve dodges (if it's Steve)
    const missEx = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
    const missEy = window.innerHeight / 2 + (Math.random() - 0.5) * 150;
    const item = draggedItem;

    setIsDragging(false);
    setDraggedItem(null);
    setTrajectory([]);

    launchThrow(item, dragPos.x, dragPos.y, missEx, missEy, velocity, () => {
      if (activeCharacter === 'steve') {
        // Steve dodges the missed throw!
        clearAllTimers();
        setSteveState('dodging');
        setMouthOpen(false);
        setLaughCountdown(0);
        setIsTickling(false);

        const penalty = ITEM_PENALTY[item];
        setScore(cs => Math.max(0, cs - penalty));
        addText(`-${penalty}`, window.innerWidth / 2, window.innerHeight / 2 - 80, '#EF4444');
        addText(DODGE_TEXTS[Math.floor(Math.random() * DODGE_TEXTS.length)], window.innerWidth / 2 + (Math.random() - 0.5) * 60, window.innerHeight / 2 - 120, '#F59E0B');
        setScoreShake(true);
        setTimeout(() => setScoreShake(false), 400);
        sounds.dodge();

        timers.current.dodge = setTimeout(() => {
          setSteveState(prev => prev === 'dodging' ? 'idle' : prev);
        }, 800);
      } else {
        // Non-Steve miss — item just drops
        sounds.drop();
      }
    });
  }, [isDragging, draggedItem, dragPos, mouthOpen, steveState, launchThrow, activeCharacter, clearAllTimers, addText, addParticles]);

  // Laugh text periodically
  useEffect(() => {
    if (steveState !== 'laughing') return;
    const iv = setInterval(() => {
      addText(LAUGH_TEXTS[Math.floor(Math.random() * LAUGH_TEXTS.length)], window.innerWidth / 2 + (Math.random() - 0.5) * 120, window.innerHeight / 2 - 70, '#22C55E');
    }, 700);
    return () => clearInterval(iv);
  }, [steveState, addText]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const swapCharacter = useCallback((to: Character) => {
    if (isSwapping) return;
    setIsSwapping(true);
    clearAllTimers();
    setSteveState('idle');
    setMouthOpen(false);
    setLaughCountdown(0);
    sounds.swap();

    setTimeout(() => {
      setActiveCharacter(to);
      setTimeout(() => setIsSwapping(false), 600);
    }, 300);
  }, [isSwapping, clearAllTimers]);

  return {
    activeCharacter, isSwapping,
    steveState, mouthOpen, score, highScore, feedStreak,
    floatingTexts, particles, scoreBounce, scoreShake, laughCountdown,
    isTickling, isDragging, draggedItem, dragPos, trajectory, activeThrow,
    tickleStart, tickleMove, tickleEnd,
    dragStart, dragMove, dragEnd,
    swapCharacter,
  };
}
