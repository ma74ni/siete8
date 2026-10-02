import { startRequest } from "@/lib/assistant";
import { startSession } from "@/server/assistant";
import { sameOrigin } from "@/server/same-origin";

// Starts a conversation with the assistant (E10): privacy notice accepted
// and Turnstile passed.

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const body = startRequest.safeParse(await request.json().catch(() => null));
  if (!body.success) return new Response(null, { status: 400 });

  const result = await startSession(body.data);
  return Response.json(result, {
    status: result.status === "ok" ? 200 : 429,
    headers: { "Cache-Control": "no-store" },
  });
}
