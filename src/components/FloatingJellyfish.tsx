import { useEffect, useState } from "react";

interface JellyfishProps {
  initialX: number;
  initialY: number;
  size: number;
  delay: number;
}

const Jellyfish = ({ initialX, initialY, size, delay }: JellyfishProps) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [direction, setDirection] = useState({ dx: 1, dy: 1 });

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        let newX = prev.x + direction.dx * 0.3;
        let newY = prev.y + direction.dy * 0.2;
        let newDx = direction.dx;
        let newDy = direction.dy;

        // Bounce off edges
        if (newX <= 0 || newX >= 90) {
          newDx = -direction.dx;
          newX = Math.max(0, Math.min(90, newX));
        }
        if (newY <= 0 || newY >= 85) {
          newDy = -direction.dy;
          newY = Math.max(0, Math.min(85, newY));
        }

        if (newDx !== direction.dx || newDy !== direction.dy) {
          setDirection({ dx: newDx, dy: newDy });
        }

        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [direction]);

  return (
    <div
      className="absolute pointer-events-none transition-transform duration-1000 ease-in-out"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: size,
        height: size * 1.3,
        animationDelay: `${delay}ms`,
      }}
    >
      <svg
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-pulse"
        style={{ animationDuration: "3s" }}
      >
        {/* Jellyfish bell/head */}
        <ellipse
          cx="50"
          cy="35"
          rx="40"
          ry="30"
          className="fill-primary/20 stroke-primary/40"
          strokeWidth="2"
        />
        <ellipse
          cx="50"
          cy="35"
          rx="30"
          ry="22"
          className="fill-primary/30"
        />
        <ellipse
          cx="50"
          cy="30"
          rx="15"
          ry="10"
          className="fill-primary/40"
        />
        
        {/* Tentacles with wave animation */}
        <path
          d="M20 55 Q25 75 20 95 Q15 115 20 130"
          className="stroke-accent/40"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            values="M20 55 Q25 75 20 95 Q15 115 20 130;M20 55 Q15 75 20 95 Q25 115 20 130;M20 55 Q25 75 20 95 Q15 115 20 130"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M35 60 Q40 80 35 100 Q30 120 35 130"
          className="stroke-primary/50"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            values="M35 60 Q40 80 35 100 Q30 120 35 130;M35 60 Q30 80 35 100 Q40 120 35 130;M35 60 Q40 80 35 100 Q30 120 35 130"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M50 62 Q55 82 50 102 Q45 122 50 130"
          className="stroke-accent/50"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            values="M50 62 Q55 82 50 102 Q45 122 50 130;M50 62 Q45 82 50 102 Q55 122 50 130;M50 62 Q55 82 50 102 Q45 122 50 130"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M65 60 Q70 80 65 100 Q60 120 65 130"
          className="stroke-primary/50"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            values="M65 60 Q70 80 65 100 Q60 120 65 130;M65 60 Q60 80 65 100 Q70 120 65 130;M65 60 Q70 80 65 100 Q60 120 65 130"
            dur="2.3s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M80 55 Q85 75 80 95 Q75 115 80 130"
          className="stroke-accent/40"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            values="M80 55 Q85 75 80 95 Q75 115 80 130;M80 55 Q75 75 80 95 Q85 115 80 130;M80 55 Q85 75 80 95 Q75 115 80 130"
            dur="2.1s"
            repeatCount="indefinite"
          />
        </path>
        
        {/* Glow effect */}
        <ellipse
          cx="50"
          cy="35"
          rx="42"
          ry="32"
          className="fill-primary/10"
          filter="blur(8px)"
        />
      </svg>
    </div>
  );
};

export function FloatingJellyfish() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-5">
      <Jellyfish initialX={10} initialY={20} size={80} delay={0} />
      <Jellyfish initialX={70} initialY={60} size={60} delay={500} />
    </div>
  );
}
