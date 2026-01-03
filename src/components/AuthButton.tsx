import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "react-router-dom";

export function AuthButton() {
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("No se pudo cerrar sesión");
      return;
    }
    toast.success("Sesión cerrada");
  };

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {session.user.email?.split("@")[0]}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const returnTo = encodeURIComponent(location.pathname + location.search);

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="flex items-center gap-2 bg-card/50 border-border/50 hover:bg-primary/20 hover:border-primary/50"
    >
      <Link to={`/auth?returnTo=${returnTo}`} aria-label="Ir a iniciar sesión">
        <LogIn className="w-4 h-4" />
        <span className="text-xs">Iniciar Sesión</span>
      </Link>
    </Button>
  );
}
