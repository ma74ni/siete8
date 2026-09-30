import { Button } from "@/components/sitio/button";
import { FormField } from "@/components/sitio/form-field";
import { Logo } from "@/components/sitio/logo";
import { safeAdminPath } from "@/lib/admin-access";
import { signIn } from "@/server/auth-actions";

// Texts from docs/COPY.md §13.

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { next, error, motivo } = await searchParams;
  const expired = motivo === "sesion-caducada";
  const failed = error === "credenciales";

  return (
    <main className="panel flex min-h-dvh items-center justify-center bg-surface px-5 py-12">
      <div className="flex w-full max-w-[26rem] flex-col gap-6 rounded-control border border-border bg-bg p-8">
        <Logo className="h-10 w-auto self-start" />
        <h1 className="text-h3">Ingresar al panel</h1>

        {expired && !failed && (
          <p role="status">Tu sesión caducó. Ingresa de nuevo para seguir.</p>
        )}
        {failed && (
          <p role="alert" className="font-medium text-accent">
            El correo o la contraseña no coinciden. Revísalos e inténtalo de
            nuevo.
          </p>
        )}

        <form action={signIn} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={safeAdminPath(next)} />
          <FormField
            label="Correo"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={failed || undefined}
          />
          <FormField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={failed || undefined}
          />
          <Button type="submit">Ingresar</Button>
        </form>
      </div>
    </main>
  );
}
