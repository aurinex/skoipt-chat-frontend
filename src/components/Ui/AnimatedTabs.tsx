import { useEffect, useRef } from "react";

export type AnimatedTabItem<T> = {
  key: T;
  content: React.ReactNode;
};

export interface AnimatedTabsProps<T> {
  items: AnimatedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;

  step?: number;
  mode?: "static" | "animated";
  renderItem?: (item: AnimatedTabItem<T>, isActive: boolean) => React.ReactNode;
}

export function AnimatedTabs<T extends string>({
  items,
  value,
  onChange,
  step = 56,
  mode = "animated",
  renderItem,
}: AnimatedTabsProps<T>) {
  const STEP = step;
  const STEP_MS = 220;
  const EASE = "cubic-bezier(0.45, 0, 0.22, 1)";
  const N = items.length;
  const PERIOD = N * STEP;

  const beltRef = useRef<HTMLDivElement | null>(null);
  const tyRef = useRef(-PERIOD);
  const sRef = useRef(0);
  const animRef = useRef(false);

  // ─────────────────────────────
  // INIT (только для animated)
  // ─────────────────────────────
  useEffect(() => {
    if (mode !== "animated") return;

    if (beltRef.current) {
      beltRef.current.style.transform = `translateY(${-PERIOD}px)`;
      beltRef.current.style.transition = `transform ${STEP_MS}ms ${EASE}`;
    }
  }, [PERIOD, mode]);

  // ─────────────────────────────
  // CLICK HANDLER (animated)
  // ─────────────────────────────
  const handleClick = async (key: T) => {
    if (mode === "static") {
      onChange(key);
      return;
    }

    if (animRef.current || key === value) return;

    const j = items.findIndex((t) => t.key === key);
    const slot = (j + sRef.current) % N;
    const steps = (N - 1 - slot + N) % N;

    if (!steps) return;

    animRef.current = true;
    onChange(key);

    const belt = beltRef.current!;
    belt.style.transition = `transform ${STEP_MS}ms ${EASE}`;

    for (let i = 0; i < steps; i++) {
      tyRef.current += STEP;
      belt.style.transform = `translateY(${tyRef.current}px)`;
      await new Promise((r) => setTimeout(r, STEP_MS));
    }

    // ── Нормализация ──
    belt.style.transition = "none";

    tyRef.current = (((tyRef.current % PERIOD) + PERIOD) % PERIOD) - PERIOD;
    if (tyRef.current >= 0) tyRef.current -= PERIOD;

    belt.style.transform = `translateY(${tyRef.current}px)`;
    void belt.offsetHeight;

    belt.style.transition = `transform ${STEP_MS}ms ${EASE}`;

    sRef.current = (sRef.current + steps) % N;
    animRef.current = false;
  };

  // ─────────────────────────────
  // STATIC MODE
  // ─────────────────────────────
  if (mode === "static") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: 16,
        }}
      >
        {items.map((item) => {
          const isActive = value === item.key;

          return (
            <div key={item.key} onClick={() => handleClick(item.key)}>
              {renderItem ? renderItem(item, isActive) : item.content}
            </div>
          );
        })}
      </div>
    );
  }

  // ─────────────────────────────
  // ANIMATED MODE
  // ─────────────────────────────
  const BELT = Array.from({ length: 5 * items.length }, (_, i) => ({
    ...items[i % items.length],
    bkey: i,
  }));

  return (
    <div style={{ height: STEP * N, overflow: "hidden", marginTop: 8 }}>
      <div ref={beltRef}>
        {BELT.map((item) => {
          const isActive = value === item.key;

          return (
            <div
              key={item.bkey}
              style={{
                height: STEP,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              onClick={() => handleClick(item.key)}
            >
              {renderItem ? renderItem(item, isActive) : item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
