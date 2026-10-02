import "server-only";

import { serverEnv } from "@/env/server";

/**
 * Emails a new lead to the admin with Resend. The lead is already saved, so
 * a missing configuration or a failed email only goes to the logs.
 */
export async function notify(
  subject: string,
  text: string,
  replyTo: string | null,
) {
  const { RESEND_API_KEY, ADMIN_NOTIFICATION_EMAIL } = serverEnv;
  if (!RESEND_API_KEY || !ADMIN_NOTIFICATION_EMAIL) {
    console.warn(
      "Lead saved, but RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL is not set.",
    );
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Siete8 <avisos@siete8.com>",
      to: [ADMIN_NOTIFICATION_EMAIL],
      subject,
      text,
      ...(replyTo && { reply_to: replyTo }),
    }),
  }).catch(() => null);
  if (!response?.ok) {
    console.error(
      `Lead saved, but the email failed: HTTP ${response?.status ?? "network"}`,
    );
  }
}
