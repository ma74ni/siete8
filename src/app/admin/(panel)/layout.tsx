import { requireAdmin } from "@/server/auth";
import { signOut } from "@/server/auth-actions";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <>
      <header>
        <form action={signOut}>
          <button type="submit">
            [COPY PENDIENTE: botón para cerrar sesión]
          </button>
        </form>
      </header>
      {children}
    </>
  );
}
