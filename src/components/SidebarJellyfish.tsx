import { useEffect, useRef, useState } from "react";

interface Jellyfish {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  pulsePhase: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

export function SidebarJellyfish() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [jellyfish, setJellyfish] = useState<Jellyfish[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const animationRef = useRef<number>();
  const sparkleIdRef = useRef(0);

  useEffect(() => {
    // Initialize 3 jellyfish
    const initialJellyfish: Jellyfish[] = [
      { id: 1, x: 50, y: 100, vx: 0.3, vy: 0.2, size: 30, rotation: 0, pulsePhase: 0 },
      { id: 2, x: 150, y: 200, vx: -0.25, vy: 0.15, size: 25, rotation: 0, pulsePhase: Math.PI / 2 },
      { id: 3, x: 100, y: 300, vx: 0.2, vy: -0.18, size: 28, rotation: 0, pulsePhase: Math.PI },
    ];
    setJellyfish(initialJellyfish);
  }, []);

  useEffect(() => {
    const animate = () => {
      const container = containerRef.current;
      if (!container) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const width = container.clientWidth;
      const height = container.clientHeight;

      setJellyfish(prev => prev.map(jf => {
        let { x, y, vx, vy, pulsePhase } = jf;
        
        x += vx;
        y += vy;
        pulsePhase += 0.03;

        let hitEdge = false;
        let sparkleX = x;
        let sparkleY = y;

        // Bounce off edges and create sparkles
        if (x <= jf.size / 2) {
          x = jf.size / 2;
          vx = Math.abs(vx);
          hitEdge = true;
          sparkleX = 0;
          sparkleY = y;
        }
        if (x >= width - jf.size / 2) {
          x = width - jf.size / 2;
          vx = -Math.abs(vx);
          hitEdge = true;
          sparkleX = width;
          sparkleY = y;
        }
        if (y <= jf.size / 2) {
          y = jf.size / 2;
          vy = Math.abs(vy);
          hitEdge = true;
          sparkleX = x;
          sparkleY = 0;
        }
        if (y >= height - jf.size / 2) {
          y = height - jf.size / 2;
          vy = -Math.abs(vy);
          hitEdge = true;
          sparkleX = x;
          sparkleY = height;
        }

        if (hitEdge) {
          // Add sparkles
          const newSparkles: Sparkle[] = Array.from({ length: 5 }, (_, i) => ({
            id: sparkleIdRef.current++,
            x: sparkleX + (Math.random() - 0.5) * 20,
            y: sparkleY + (Math.random() - 0.5) * 20,
            opacity: 1,
            scale: 0.5 + Math.random() * 0.5,
          }));
          setSparkles(prev => [...prev, ...newSparkles]);
        }

        return { ...jf, x, y, vx, vy, pulsePhase };
      }));

      // Fade out sparkles
      setSparkles(prev => 
        prev
          .map(s => ({ ...s, opacity: s.opacity - 0.02, scale: s.scale * 1.02 }))
          .filter(s => s.opacity > 0)
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Jellyfish */}
      {jellyfish.map(jf => (
        <div
          key={jf.id}
          className="absolute transition-none"
          style={{
            left: jf.x - jf.size / 2,
            top: jf.y - jf.size / 2,
            width: jf.size,
            height: jf.size * 1.2,
          }}
        >
          {/* Jellyfish body */}
          <svg
            viewBox="0 0 50 60"
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
              transform: `scale(${1 + Math.sin(jf.pulsePhase) * 0.1})`,
            }}
          >
            {/* Main body dome */}
            <ellipse
              cx="25"
              cy="18"
              rx={18 + Math.sin(jf.pulsePhase) * 2}
              ry={15 + Math.sin(jf.pulsePhase) * 1}
              fill="url(#jellyfishGradient)"
              opacity="0.7"
            />
            {/* Inner glow */}
            <ellipse
              cx="25"
              cy="16"
              rx="10"
              ry="8"
              fill="hsl(var(--primary))"
              opacity="0.4"
            />
            {/* Tentacles */}
            {[0, 1, 2, 3, 4].map(i => (
              <path
                key={i}
                d={`M${15 + i * 5},30 Q${13 + i * 5 + Math.sin(jf.pulsePhase + i) * 3},${40 + Math.sin(jf.pulsePhase + i * 0.5) * 5} ${15 + i * 5},${50 + Math.sin(jf.pulsePhase + i) * 5}`}
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                fill="none"
                opacity="0.5"
              />
            ))}
            <defs>
              <radialGradient id="jellyfishGradient" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      ))}

      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            opacity: sparkle.opacity,
            transform: `translate(-50%, -50%) scale(${sparkle.scale})`,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M6 0L7 4.5L12 6L7 7.5L6 12L5 7.5L0 6L5 4.5Z"
              fill="hsl(var(--primary))"
              style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' }}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}