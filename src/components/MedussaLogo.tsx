import { cn } from "@/lib/utils";
import medussaLogo from "@/assets/medussa-logo.png";

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
      <img
        src={medussaLogo}
        alt="Medussa IA Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
