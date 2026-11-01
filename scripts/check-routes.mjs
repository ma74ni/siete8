// Checks the HTTP status of the public site's routes against what they should
// answer, so a change that turns a 404 into a 200 (or a page into a 500) is
// caught on the deploy preview before it reaches production.
//
//   pnpm check:routes https://deploy-preview-123--siete8.netlify.app
//   pnpm check:routes https://siete8.com
//   pnpm check:routes https://siete8.netlify.app --production
//
// Every URL of the sitemap must answer 200 without `noindex`. The dev pages
// answer 404 only on the production site: siete8.com, www.siete8.com, or any
// URL passed with --production.

const args = process.argv.slice(2);
const base = (args.find((arg) => !arg.startsWith("--")) ?? "").replace(
  /\/$/,
  "",
);
if (!/^https?:\/\//.test(base)) {
  console.error("Usage: pnpm check:routes <base URL> [--production]");
  process.exit(2);
}
const production =
  args.includes("--production") ||
  ["siete8.com", "www.siete8.com"].includes(new URL(base).hostname);

/** A cold server function can take seconds; a hung route still ends. */
const TIMEOUT_MS = 15_000;

/** [path, expected status, redirect target for 3xx] */
const ROUTES = [
  ["/no-existe", 404],
  ["/servicios/no-existe", 404],
  // Hidden in the catalog, so its page must not exist for visitors. If it is
  // ever published, put another hidden service here.
  ["/servicios/facturacion-electronica", 404],
  ["/blog/no-existe", 404],
  ["/blog/pagina/1", 404],
  ["/blog/pagina/abc", 404],
  ["/blog/pagina/999", 404],
  ["/proyectos", 200],
  ["/proyectos/no-existe", 404],
  ["/enlaces", 200],
  ["/dev/ui", production ? 404 : 200],
  ["/dev/sentry", production ? 404 : 200],
  ["/admin", 307, "/admin/login"],
  ["/admin/login", 200],
  ["/blog/rss.xml", 200],
  ["/robots.txt", 200],
  ["/sitemap.xml", 200],
  ["/servicios/", 308, "/servicios"],
  ["/api/chat", 405],
];

/** The route's status, redirect and noindex; `error` when it did not answer. */
async function check(path) {
  try {
    const response = await fetch(base + path, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = response.status === 200 ? await response.text() : "";
    return {
      code: response.status,
      location: response.headers.get("location") ?? "",
      noindex:
        /name="robots" content="[^"]*noindex/.test(body) ||
        /noindex/.test(response.headers.get("x-robots-tag") ?? ""),
    };
  } catch (error) {
    return { code: 0, location: "", noindex: false, error: error.message };
  }
}

const failures = [];
const report = (ok, line, failure) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${line}`);
  if (!ok) failures.push(failure);
};

for (const [path, expected, target] of ROUTES) {
  const { code, location, error } = await check(path);
  const redirectOk = !target || new URL(location, base).pathname === target;
  const ok = code === expected && redirectOk;
  report(
    ok,
    `${code || "---"} ${path}`,
    `${path}: ${error ?? `${code} ${location}`.trim()}, expected ${expected} ${target ?? ""}`.trim(),
  );
}

const sitemapResponse = await fetch(`${base}/sitemap.xml`, {
  signal: AbortSignal.timeout(TIMEOUT_MS),
});
const sitemap = sitemapResponse.ok ? await sitemapResponse.text() : "";
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, url]) => new URL(url).pathname,
);
if (pages.length === 0) {
  failures.push(`sitemap.xml: ${sitemapResponse.status}, with no URLs`);
}
for (const path of pages) {
  const { code, noindex, error } = await check(path);
  const ok = code === 200 && !noindex;
  report(
    ok,
    `${code || "---"} ${path} (sitemap)`,
    `${path} (sitemap): ${error ?? code}${noindex ? ", noindex" : ""}`,
  );
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length} route(s) answer something else:\n${failures.join("\n")}`,
  );
  process.exit(1);
}
console.log(`\nAll ${ROUTES.length + pages.length} routes answer as expected.`);
