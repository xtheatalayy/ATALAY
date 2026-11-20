'use client';

import { useEffect, useRef, useState } from 'react';

/** Counts up to `value` on mount and on change. SSR renders the final value, so hydration stays stable. */
export function AnimatedNumber({
  value,
  format,
  className,
  duration = 700,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const [display, setDisplay] = useState(safeValue);
  const previous = useRef(safeValue);

  useEffect(() => {
    const from = previous.current;
    const to = safeValue;
    previous.current = to;
    if (from === to) {
      setDisplay(to);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [safeValue, duration]);

  const text = format ? format(display) : String(Math.round(display));
  return <span className={className}>{text}</span>;
}
