import { cn } from "@/lib/utils";
import medussaLogo from "@/assets/medussa-logo.png";
interface MedussaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}
export function MedussaLogo({
  className,
  size = "md"
}: MedussaLogoProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-24 h-24"
  };
  return <div className={cn("relative", sizeClasses[size], className)}>
      <img alt="Medussa IA Logo" className="w-full h-full object-contain border-8 border-transparent" src="/lovable-uploads/49d0df78-3508-4818-bcfd-16f27dec2968.png" />
      {/* Animated glow effect */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse -z-10" />
    </div>;
}