import { useEffect, useRef } from "react";

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      const nodes: Node[] = [];
      const nodeCount = Math.floor((canvas.width * canvas.height) / 25000);
      
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
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

    const drawCircuit = () => {
      ctx.fillStyle = "rgba(10, 5, 20, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const time = timeRef.current;

      // Draw connections
      nodes.forEach((node, i) => {
        node.connections.forEach(j => {
          const other = nodes[j];
          if (!other) return;

          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist > 200) return;

          const opacity = (1 - dist / 200) * 0.5;
          
          // Pulsing gradient along the line
          const gradient = ctx.createLinearGradient(node.x, node.y, other.x, other.y);
          const pulsePos = (Math.sin(time * 0.002 + node.pulsePhase) + 1) / 2;
          
          gradient.addColorStop(0, `hsla(280, 100%, 65%, ${opacity * 0.3})`);
          gradient.addColorStop(pulsePos, `hsla(300, 80%, 60%, ${opacity})`);
          gradient.addColorStop(1, `hsla(280, 100%, 65%, ${opacity * 0.3})`);

          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.moveTo(node.x, node.y);
          
          // Create circuit-like path (right angles)
          const midX = (node.x + other.x) / 2;
          const midY = (node.y + other.y) / 2;
          
          if (Math.random() > 0.5) {
            ctx.lineTo(midX, node.y);
            ctx.lineTo(midX, other.y);
          } else {
            ctx.lineTo(node.x, midY);
            ctx.lineTo(other.x, midY);
          }
          
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        });
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 0.003 + node.pulsePhase) * 0.5 + 0.5;
        const size = 2 + pulse * 2;
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, size * 4
        );
        glowGradient.addColorStop(0, `hsla(280, 100%, 65%, ${0.8 * pulse})`);
        glowGradient.addColorStop(0.5, `hsla(300, 80%, 60%, ${0.3 * pulse})`);
        glowGradient.addColorStop(1, "transparent");
        
        ctx.beginPath();
        ctx.fillStyle = glowGradient;
        ctx.arc(node.x, node.y, size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.fillStyle = `hsla(280, 100%, 70%, ${0.6 + pulse * 0.4})`;
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

      // Draw data pulses traveling along connections
      nodes.forEach((node) => {
        node.connections.forEach(j => {
          const other = nodes[j];
          if (!other) return;
          
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          if (dist > 200) return;

          const pulseT = ((time * 0.001 + node.pulsePhase) % 1);
          const px = node.x + (other.x - node.x) * pulseT;
          const py = node.y + (other.y - node.y) * pulseT;

          ctx.beginPath();
          ctx.fillStyle = `hsla(300, 100%, 70%, 0.8)`;
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      timeRef.current += 16;
      animationRef.current = requestAnimationFrame(drawCircuit);
    };

    resize();
    window.addEventListener("resize", resize);
    
    // Initial fill
    ctx.fillStyle = "rgb(10, 5, 20)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawCircuit();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className || ""}`}
      style={{ background: "rgb(10, 5, 20)" }}
    />
  );
}
