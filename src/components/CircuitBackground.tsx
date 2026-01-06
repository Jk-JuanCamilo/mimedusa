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
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const { resolvedTheme } = useTheme();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices to disable animation for performance
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  // Defer animation start to improve LCP
  useEffect(() => {
    if (isMobile) return; // Skip animation on mobile
    
    const timeoutId = setTimeout(() => {
      setShouldAnimate(true);
    }, 500); // Increased delay
    
    return () => clearTimeout(timeoutId);
  }, [isMobile]);

  useEffect(() => {
    if (!shouldAnimate || isMobile) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isDark = resolvedTheme === "dark";
    
    // Theme colors
    const bgColor = isDark ? "rgb(10, 5, 20)" : "rgb(255, 255, 255)";
    const bgFade = isDark ? "rgba(10, 5, 20, 0.15)" : "rgba(255, 255, 255, 0.15)";
    const nodeHue = isDark ? 280 : 260;
    const nodeLightness = isDark ? 65 : 45;

    const initNodes = (width: number, height: number) => {
      const nodes: Node[] = [];
      // Further reduced node count
      const nodeCount = Math.floor((width * height) / 50000);
      
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          connections: [],
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Create connections - reduced
      nodes.forEach((node, i) => {
        const connectionCount = 1 + Math.floor(Math.random() * 2);
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

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          dimensionsRef.current = { width, height };
          canvas.width = width;
          canvas.height = height;
          initNodes(width, height);
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, width, height);
        }
      }
    });

    resizeObserver.observe(document.documentElement);

    let lastFrameTime = 0;
    const targetFPS = 20; // Reduced to 20fps
    const frameInterval = 1000 / targetFPS;

    const drawCircuit = (currentTime: number) => {
      const elapsed = currentTime - lastFrameTime;
      
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(drawCircuit);
        return;
      }
      
      lastFrameTime = currentTime - (elapsed % frameInterval);
      
      const { width, height } = dimensionsRef.current;
      if (width === 0 || height === 0) {
        animationRef.current = requestAnimationFrame(drawCircuit);
        return;
      }

      ctx.fillStyle = bgFade;
      ctx.fillRect(0, 0, width, height);

      const nodes = nodesRef.current;

      // Draw connections - simplified
      ctx.strokeStyle = `hsla(${nodeHue}, 100%, ${nodeLightness}%, 0.3)`;
      ctx.lineWidth = 1;
      nodes.forEach((node) => {
        node.connections.forEach(j => {
          const other = nodes[j];
          if (!other) return;
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist > 150) return;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        });
      });

      // Draw nodes - simplified
      ctx.fillStyle = `hsla(${nodeHue}, 100%, ${nodeLightness}%, 0.7)`;
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fill();

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));
      });

      timeRef.current += 50;
      animationRef.current = requestAnimationFrame(drawCircuit);
    };

    animationRef.current = requestAnimationFrame(drawCircuit);

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [resolvedTheme, shouldAnimate, isMobile]);

  const bgStyle = resolvedTheme === "dark" ? "rgb(10, 5, 20)" : "rgb(255, 255, 255)";

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className || ""}`}
      style={{ background: bgStyle }}
    />
  );
}