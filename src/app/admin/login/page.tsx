import { signIn } from "@/server/auth-actions";
import { safeAdminPath } from "@/lib/admin-access";

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { next, error, motivo } = await searchParams;
  const expired = motivo === "sesion-caducada";
  const failed = error === "credenciales";

  return (
    <main>
      <h1>[COPY PENDIENTE: título del inicio de sesión del panel]</h1>

      {expired && !failed && (
        <p role="status">[COPY PENDIENTE: aviso de sesión caducada]</p>
      )}
      {failed && (
        <p role="alert" id="login-error">
          [COPY PENDIENTE: error de correo o contraseña incorrectos]
        </p>
      )}

      <form action={signIn}>
        <input type="hidden" name="next" value={safeAdminPath(next)} />
        <p>
          <label htmlFor="email">[COPY PENDIENTE: etiqueta de correo]</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={failed ? "login-error" : undefined}
          />
        </p>
        <p>
          <label htmlFor="password">
            [COPY PENDIENTE: etiqueta de contraseña]
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={failed ? "login-error" : undefined}
          />
        </p>
        <button type="submit">[COPY PENDIENTE: botón para ingresar]</button>
      </form>
    </main>
  );
}
