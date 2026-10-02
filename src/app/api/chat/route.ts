import { chatRequest } from "@/lib/assistant";
import { chat } from "@/server/assistant";
import { sameOrigin } from "@/server/same-origin";

// Assistant on the site (E10): answers one message as a stream of JSON
// lines (`ChatEvent`). The Anthropic key never leaves the server (RNF-15).

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const body = chatRequest.safeParse(await request.json().catch(() => null));
  if (!body.success) return new Response(null, { status: 400 });

  const stream = await chat(
    body.data.sessionId,
    body.data.message,
    request.signal,
  );
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
