/**
 * Pure helpers of the blog (E3-06, E4-05). Dates are shown and typed in
 * Quito time, which has no daylight saving (UTC-05:00 all year).
 */

const QUITO_OFFSET = "-05:00";
const TIME_ZONE = "America/Guayaquil";

/** "29 de septiembre de 2026", in Quito time. */
export function formatPostDate(iso: string): string {
  return new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/** "30 de septiembre de 2026, 17:15", in Quito time (panel). */
export function formatDateTime(iso: string): string {
  const time = new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
  return `${formatPostDate(iso)}, ${time}`;
}

/** ISO date → value of a `datetime-local` input, in Quito time. */
export function toQuitoInput(iso: string): string {
  const quito = new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000);
  return quito.toISOString().slice(0, 16);
}

/** Value of a `datetime-local` input, typed in Quito time → ISO date. */
export function fromQuitoInput(value: string): string {
  return new Date(`${value}:00${QUITO_OFFSET}`).toISOString();
}

/** Minutes to read a Markdown body at 200 words a minute, at least 1. */
export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/[#*_>`[\]()-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const POSTS_PER_PAGE = 9;

/** Number of pages for `total` posts; an empty blog still has page 1. */
export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

/** Where a post stands; the database decides the same way (RLS on `post`). */
export type PostState = "draft" | "scheduled" | "published";

type PostDates = {
  status: "draft" | "published";
  published_at: string | null;
};

/**
 * A published post is on the site from its date on, inclusive; with a later
 * date it is scheduled.
 */
export function postState(post: PostDates, now: Date = new Date()): PostState {
  if (post.status === "draft") return "draft";
  if (post.published_at && new Date(post.published_at) > now) {
    return "scheduled";
  }
  return "published";
}

/** "Borrador", "Programado para el …" or "Publicado el …" (COPY §13). */
export function postStateLabel(
  post: PostDates,
  now: Date = new Date(),
): string {
  const state = postState(post, now);
  if (state === "draft") return "Borrador";
  if (!post.published_at) return "Publicado";
  const day = formatPostDate(post.published_at);
  return state === "scheduled"
    ? `Programado para el ${day}`
    : `Publicado el ${day}`;
}
