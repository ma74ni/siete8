import { formatDateTime } from "@/lib/blog";
import { cx } from "@/lib/cx";

/** Messages of a conversation with the assistant, as the visitor saw them. */
export function Conversation({
  messages,
}: {
  messages: { role: string; content: string; created_at: string }[];
}) {
  if (messages.length === 0) return <p>Sin mensajes.</p>;
  return (
    <ol className="flex flex-col gap-3">
      {messages.map((message) => (
        <li
          key={`${message.role}-${message.created_at}`}
          className={cx(
            "flex max-w-[85%] flex-col gap-1 rounded-control px-4 py-3",
            message.role === "user"
              ? "self-end border border-border"
              : "self-start bg-surface",
          )}
        >
          <span className="text-small">
            {message.role === "user" ? "Visitante" : "Asistente"},{" "}
            {formatDateTime(message.created_at)}
          </span>
          <span className="whitespace-pre-wrap">{message.content}</span>
        </li>
      ))}
    </ol>
  );
}
