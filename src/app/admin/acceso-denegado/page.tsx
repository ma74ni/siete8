import { Button } from "@/components/sitio/button";
import { signOut } from "@/server/auth-actions";

// Texts from docs/COPY.md §13.

/**
 * Shown by the proxy, with a 403 status, to signed-in users without the admin
 * role. They can sign out to use another account.
 */
export default function ForbiddenPage() {
  return (
    <main className="panel flex min-h-dvh items-center justify-center bg-surface px-5 py-12">
      <div className="flex w-full max-w-[26rem] flex-col gap-6 rounded-control border border-border bg-bg p-8">
        <h1 className="text-h3">No tienes acceso al panel</h1>
        <p>
          Tu cuenta no tiene permiso de administrador. Cierra sesión e ingresa
          con otra cuenta.
        </p>
        <form action={signOut}>
          <Button type="submit">Cerrar sesión</Button>
        </form>
      </div>
    </main>
  );
}
