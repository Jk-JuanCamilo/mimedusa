import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  pulsePhase: number;
}

interface CircuitBackgroundProps {
  className?: string;
}

export function CircuitBackground({ className }: CircuitBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const timeRef = useRef(0);
  const { resolvedTheme } = useTheme();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Defer animation start to improve LCP
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShouldAnimate(true);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!shouldAnimate) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isDark = resolvedTheme === "dark";
    
    // Theme colors
    const bgColor = isDark ? "rgb(10, 5, 20)" : "rgb(255, 255, 255)";
    const bgFade = isDark ? "rgba(10, 5, 20, 0.1)" : "rgba(255, 255, 255, 0.1)";
    const nodeHue = isDark ? 280 : 260;
    const pulseHue = isDark ? 300 : 280;
    const nodeLightness = isDark ? 65 : 45;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      const nodes: Node[] = [];
      // Reduced node count for better performance
      const nodeCount = Math.floor((canvas.width * canvas.height) / 35000);
      
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          connections: [],
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Create connections
      nodes.forEach((node, i) => {
        const connectionCount = 2 + Math.floor(Math.random() * 2);
        const distances: { index: number; dist: number }[] = [];
        
        nodes.forEach((other, j) => {
          if (i !== j) {
            const dist = Math.hypot(node.x - other.x, node.y - other.y);
            distances.push({ index: j, dist });
          }
        });
        
        distances.sort((a, b) => a.dist - b.dist);
        node.connections = distances.slice(0, connectionCount).map(d => d.index);
      });

      nodesRef.current = nodes;
    };

    let lastFrameTime = 0;
    const targetFPS = 30; // Reduce to 30fps for better performance
    const frameInterval = 1000 / targetFPS;

    const drawCircuit = (currentTime: number) => {
      const elapsed = currentTime - lastFrameTime;
      
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(drawCircuit);
        return;
      }
      
      lastFrameTime = currentTime - (elapsed % frameInterval);
      
      ctx.fillStyle = bgFade;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const time = timeRef.current;

      // Draw connections
      nodes.forEach((node) => {
        node.connections.forEach(j => {
          const other = nodes[j];
          if (!other) return;

          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist > 200) return;

          const opacity = (1 - dist / 200) * (isDark ? 0.5 : 0.7);
          
          // Simplified line without gradient for better performance
          ctx.beginPath();
          ctx.strokeStyle = `hsla(${nodeHue}, 100%, ${nodeLightness}%, ${opacity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        });
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 0.003 + node.pulsePhase) * 0.5 + 0.5;
        const size = 2 + pulse * 2;
        
        // Simplified glow effect
        ctx.beginPath();
        ctx.fillStyle = `hsla(${nodeHue}, 100%, ${nodeLightness}%, ${0.6 + pulse * 0.4})`;
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      });

      timeRef.current += 32;
      animationRef.current = requestAnimationFrame(drawCircuit);
    };

    resize();
    window.addEventListener("resize", resize);
    
    // Initial fill
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    animationRef.current = requestAnimationFrame(drawCircuit);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [resolvedTheme, shouldAnimate]);

  const bgStyle = resolvedTheme === "dark" ? "rgb(10, 5, 20)" : "rgb(255, 255, 255)";

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className || ""}`}
      style={{ background: bgStyle }}
    />
  );
}