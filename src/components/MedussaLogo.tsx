import { cn } from "@/lib/utils";

interface MedussaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MedussaLogo({ className, size = "md" }: MedussaLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer glow circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          className="fill-primary/10 stroke-primary/30"
          strokeWidth="1"
        />
        
        {/* Inner circle */}
        <circle
          cx="50"
          cy="50"
          r="35"
          className="fill-card stroke-primary"
          strokeWidth="2"
        />
        
        {/* Medusa eye */}
        <ellipse
          cx="50"
          cy="50"
          rx="15"
          ry="20"
          className="fill-primary/20 stroke-accent"
          strokeWidth="2"
        />
        
        {/* Pupil */}
        <ellipse
          cx="50"
          cy="50"
          rx="6"
          ry="12"
          className="fill-accent"
        />
        
        {/* Inner pupil highlight */}
        <circle
          cx="50"
          cy="44"
          r="3"
          className="fill-primary-foreground/80"
        />
        
        {/* Snake tendrils */}
        <path
          d="M30 25 Q25 35 28 45"
          className="stroke-primary/60"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M70 25 Q75 35 72 45"
          className="stroke-primary/60"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M20 40 Q15 50 22 58"
          className="stroke-accent/50"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M80 40 Q85 50 78 58"
          className="stroke-accent/50"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M40 15 Q38 25 42 32"
          className="stroke-primary/40"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M60 15 Q62 25 58 32"
          className="stroke-primary/40"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      
      {/* Animated glow effect */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
    </div>
  );
}
