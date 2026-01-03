import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setSeo } from "@/lib/seo";

const emailSchema = z.string().trim().email("Ingresa un correo válido");
const passwordSchema = z.string().min(6, "La contraseña debe tener al menos 6 caracteres");

export default function Auth() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [edad, setEdad] = useState("");

  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const returnTo = useMemo(() => {
    const raw = params.get("returnTo") || "/";
    // Seguridad: solo permitimos rutas internas
    return raw.startsWith("/") ? raw : "/";
  }, [params]);

  useEffect(() => {
    setSeo({
      title: "Iniciar sesión - Medussa IA",
      description: "Inicia sesión o crea tu cuenta para usar Medussa IA y guardar tus conversaciones.",
      canonicalPath: "/auth",
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si ya está logueado, fuera de /auth
  useEffect(() => {
    if (!authChecked) return;
    if (!session?.user) return;
    navigate(returnTo, { replace: true });
  }, [authChecked, session?.user, navigate, returnTo]);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${returnTo}`,
      },
    });

    // Nota: si no hay error, el navegador redirige.
    if (error) {
      toast.error("No se pudo iniciar con Google");
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedEmail = emailSchema.parse(email);
      const parsedPassword = passwordSchema.parse(password);

      const { error } = await supabase.auth.signInWithPassword({
        email: parsedEmail,
        password: parsedPassword,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("invalid login")) {
          toast.error("Correo o contraseña incorrectos");
        } else {
          toast.error(error.message || "Error de autenticación");
        }
        return;
      }

      toast.success("¡Bienvenido!");
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Revisa tus datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsedEmail = emailSchema.parse(email);
      const parsedPassword = passwordSchema.parse(password);

      const edadNum = Number(edad);
      if (!Number.isFinite(edadNum) || edadNum < 1 || edadNum > 120) {
        toast.error("Por favor ingresa una edad válida");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: parsedEmail,
        password: parsedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}${returnTo}`,
          data: {
            nombre,
            apellidos,
            edad: edadNum,
          },
        },
      });

      if (error) {
        if (error.message?.toLowerCase().includes("already")) {
          toast.error("Este correo ya está registrado");
        } else {
          toast.error(error.message || "No se pudo crear la cuenta");
        }
        return;
      }

      toast.success("Cuenta creada. Ya puedes iniciar sesión.");
      setTab("login");
    } catch (err: any) {
      toast.error(err?.message || "Revisa tus datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <section className="w-full max-w-md">
        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Accede a Medussa IA</CardTitle>
            <CardDescription>
              Inicia sesión o crea una cuenta para guardar tus conversaciones.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Continuar con Google"
              )}
            </Button>

            <Separator />

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nombre">Nombre</Label>
                    <Input
                      id="signup-nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-apellidos">Apellidos</Label>
                    <Input
                      id="signup-apellidos"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      placeholder="Tus apellidos"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-edad">Edad</Label>
                    <Input
                      id="signup-edad"
                      type="number"
                      value={edad}
                      onChange={(e) => setEdad(e.target.value)}
                      placeholder="Tu edad"
                      required
                      min={1}
                      max={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Correo</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground">
              Al continuar aceptas usar autenticación del sistema integrado. Si Google muestra “Solicitud no válida”, normalmente es un problema de configuración del proveedor.
            </p>

            <div className="text-center">
              <Button asChild variant="link" className="px-0">
                <Link to={returnTo}>Volver</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
