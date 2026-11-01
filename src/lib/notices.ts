// The message shown on the page a panel form returns to (E14-02, DESIGN
// §12.2): "Servicio agregado." on the client's record after adding one. Texts
// from docs/COPY.md §13: the same messages the actions return today.

export const NOTICES = {
  "articulo-guardado": "Artículo guardado.",
  "cliente-guardado": "Cliente guardado.",
  "compra-guardada": "Compra guardada.",
  "lead-guardado": "Lead guardado.",
  "pago-borrado": "Pago borrado.",
  "pago-registrado": "Pago registrado.",
  "periodo-guardado": "Período guardado.",
  "plan-agregado": "Plan agregado.",
  "plan-borrado": "Plan borrado.",
  "plan-guardado": "Plan guardado.",
  "proforma-registrada": "Proforma registrada.",
  "proyecto-guardado": "Proyecto guardado.",
  "servicio-agregado": "Servicio agregado.",
  "servicio-guardado": "Servicio guardado.",
} as const;

export type NoticeKey = keyof typeof NOTICES;

/** The parameter that carries the notice in the address. */
export const NOTICE_PARAM = "aviso";

/** Whether a value is one of the notices (own keys only, not "toString"). */
export function isNoticeKey(value: unknown): value is NoticeKey {
  return typeof value === "string" && Object.hasOwn(NOTICES, value);
}

/**
 * The text of the notice in the address, or null. Only known keys show: a
 * made-up `?aviso=` never puts its own words on the page.
 */
export function noticeText(value: unknown): string | null {
  const key = Array.isArray(value) ? value[0] : value;
  return isNoticeKey(key) ? NOTICES[key] : null;
}

/** `path` with the notice added, keeping its query and its `#` part. */
export function withNotice(path: string, key: NoticeKey): string {
  const [beforeHash = "", hash] = path.split("#");
  const [base, query = ""] = beforeHash.split("?");
  const params = new URLSearchParams(query);
  params.set(NOTICE_PARAM, key);
  return `${base}?${params.toString()}${hash === undefined ? "" : `#${hash}`}`;
}
