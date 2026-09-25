import { signOut } from "@/server/auth-actions";

/**
 * Shown by the proxy, with a 403 status, to signed-in users without the admin
 * role. They can sign out to use another account.
 */
export default function ForbiddenPage() {
  return (
    <main>
      <h1>[COPY PENDIENTE: título de acceso denegado al panel]</h1>
      <p>[COPY PENDIENTE: mensaje para usuarios sin rol de administrador]</p>
      <form action={signOut}>
        <button type="submit">
          [COPY PENDIENTE: botón para cerrar sesión]
        </button>
      </form>
    </main>
  );
}
