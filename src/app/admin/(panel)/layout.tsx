import Link from "next/link";

import { Logo } from "@/components/sitio/logo";
import { requireAdmin } from "@/server/auth";
import { signOut } from "@/server/auth-actions";

// Texts from docs/COPY.md §13.

const navItem =
  "flex min-h-11 items-center rounded-control px-3 font-medium text-fg no-underline hover:bg-surface";

/** Panel frame (E4-01): side bar on desktop, top bar on phones. */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();

  return (
    <div className="panel min-h-dvh bg-bg lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-border bg-bg lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-4 p-4 lg:sticky lg:top-0 lg:p-6">
          <Link href="/admin" className="flex min-h-11 items-center text-fg">
            <Logo className="h-9 w-auto" />
          </Link>
          <nav aria-label="Panel">
            <ul className="flex flex-wrap gap-1 lg:flex-col">
              <li>
                <Link href="/admin" className={navItem}>
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="/admin/proyectos" className={navItem}>
                  Proyectos
                </Link>
              </li>
              <li>
                <Link href="/" className={navItem}>
                  Ver el sitio
                </Link>
              </li>
            </ul>
          </nav>
          <div className="flex flex-col gap-1 border-t border-border pt-4">
            {admin.email && <p className="text-small">{admin.email}</p>}
            <form action={signOut}>
              <button type="submit" className={`${navItem} cursor-pointer`}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main id="contenido" className="px-5 py-8 lg:px-12 lg:py-12">
        {children}
      </main>
    </div>
  );
}
