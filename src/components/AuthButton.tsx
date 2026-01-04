import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [edad, setEdad] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const userEmail = session?.user?.email;
        
        // Validate Gmail accounts only
        if (session?.user && userEmail && !userEmail.endsWith("@gmail.com")) {
          toast.error("Solo se permiten cuentas Google (@gmail.com)");
          supabase.auth.signOut();
          return;
        }
        
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const userEmail = session?.user?.email;
      
      // Validate Gmail accounts only
      if (session?.user && userEmail && !userEmail.endsWith("@gmail.com")) {
        toast.error("Solo se permiten cuentas Google (@gmail.com)");
        supabase.auth.signOut();
        return;
      }
      
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error("Error al iniciar con Google");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("¡Bienvenido de vuelta!");
        setIsOpen(false);
      } else {
        // Validar edad
        const edadNum = parseInt(edad);
        if (isNaN(edadNum) || edadNum < 1 || edadNum > 120) {
          toast.error("Por favor ingresa una edad válida");
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              nombre: nombre,
              apellidos: apellidos,
              edad: edadNum,
            }
          },
        });
        if (error) throw error;
        setShowSuccess(true);
      }
      setEmail("");
      setPassword("");
      setNombre("");
      setApellidos("");
      setEdad("");
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast.error("Este correo ya está registrado");
      } else if (error.message.includes("Invalid login")) {
        toast.error("Correo o contraseña incorrectos");
      } else {
        toast.error(error.message || "Error de autenticación");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {user.email?.split("@")[0]}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-card/50 border-border/50 hover:bg-primary/20 hover:border-primary/50"
        >
          <LogIn className="w-4 h-4" />
          <span className="text-xs">Iniciar Sesión</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-xl font-bold text-foreground text-center">
              ¡Estamos felices!
            </h2>
            <p className="text-muted-foreground text-center text-lg">
              Gracias por elegirnos como tu IA Favorita
            </p>
            <Button 
              onClick={() => {
                setShowSuccess(false);
                setIsOpen(false);
              }}
              className="mt-4"
            >
              ¡Comenzar a usar Medussa IA!
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground text-center">
                Iniciar Sesión
              </DialogTitle>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Solo se permiten cuentas de Google
              </p>
            </DialogHeader>
            
            {/* Google Login Button - Only option */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-background/50 border-border hover:bg-primary/10 py-6 text-base"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Acceder con Google
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
