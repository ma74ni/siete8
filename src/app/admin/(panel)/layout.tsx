import Link from "next/link";

import { navItem } from "@/components/admin/nav-item";
import { PanelNav } from "@/components/admin/panel-nav";
import { Logo } from "@/components/sitio/logo";
import { adminPaths } from "@/lib/admin-paths";
import { requireAdmin } from "@/server/auth";
import { signOut } from "@/server/auth-actions";

// Texts from docs/COPY.md §13.

/** Panel frame (E4-01, E14-03): grouped side bar on desktop, Menú on phones. */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();

  return (
    <div className="panel min-h-dvh bg-bg lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-border bg-bg lg:border-r lg:border-b-0">
        <div
          // Taller than a laptop screen, the side bar scrolls on its own, so
          // its last entries can be reached and seen with the keyboard.
          className="flex flex-col gap-4 p-4 lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto lg:p-6"
        >
          <Link
            href={adminPaths.home}
            className="flex min-h-11 items-center text-fg"
          >
            <Logo className="h-9 w-auto" />
          </Link>
          <PanelNav
            account={
              <div className="flex flex-col gap-1 border-t border-border pt-4">
                <Link href="/" className={navItem}>
                  Ver el sitio
                </Link>
                {admin.email && (
                  <p className="px-3 text-small">{admin.email}</p>
                )}
                <form action={signOut}>
                  <button type="submit" className={`${navItem} cursor-pointer`}>
                    Cerrar sesión
                  </button>
                </form>
              </div>
            }
          />
        </div>
      </aside>
      <main id="contenido" className="px-5 py-8 lg:px-12 lg:py-12">
        {children}
      </main>
    </div>
  );
}
