import { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface JoystickHandle {
  reset: () => void;
}

interface Props {
  onInput: (x: number, y: number) => void;
}

export const Joystick = forwardRef<JoystickHandle, Props>(({ onInput }, ref) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    reset: () => {
      setKnobPos({ x: 0, y: 0 });
      setActive(false);
      onInput(0, 0);
      touchIdRef.current = null;
    },
  }));

  const maxRadius = 45;

  const handleStart = useCallback((clientX: number, clientY: number, touchId?: number) => {
    if (touchId !== undefined) touchIdRef.current = touchId;
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setActive(true);
    handleMove(clientX, clientY);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * clampedDist;
    const y = Math.sin(angle) * clampedDist;
    setKnobPos({ x, y });
    onInput(x / maxRadius, y / maxRadius);
  }, [onInput]);

  const handleEnd = useCallback(() => {
    setKnobPos({ x: 0, y: 0 });
    setActive(false);
    onInput(0, 0);
    touchIdRef.current = null;
  }, [onInput]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (touchIdRef.current === null || !active) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === touchIdRef.current) {
          handleMove(touch.clientX, touch.clientY);
          break;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      const stillActive = Array.from(e.touches).some(t => t.identifier === touchIdRef.current);
      if (!stillActive) handleEnd();
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [active, handleMove, handleEnd]);

  return (
    <div
      ref={baseRef}
      className="relative w-28 h-28 rounded-full bg-white/10 border-2 border-white/20 touch-none select-none"
      onTouchStart={(e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        handleStart(touch.clientX, touch.clientY, touch.identifier);
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
    >
      {/* Direction indicators */}
      <div className="absolute inset-2 rounded-full border border-white/5" />
      <div
        className="absolute top-1/2 left-1/2 w-12 h-12 -mt-6 -ml-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white/40 shadow-lg transition-transform"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px) scale(${active ? 1.1 : 1})`,
        }}
      />
    </div>
  );
});

Joystick.displayName = 'Joystick';
