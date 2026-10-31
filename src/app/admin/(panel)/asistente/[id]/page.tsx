import Link from "next/link";
import { notFound } from "next/navigation";

import { Conversation } from "@/components/admin/conversation";
import { PageHeader } from "@/components/admin/page-header";
import { isUuid } from "@/lib/admin-forms";
import { formatDateTime } from "@/lib/blog";
import { getConversationForAdmin } from "@/server/admin-assistant";

// Texts from docs/COPY.md §13.

/** One conversation with the assistant (RF-ADM-07). */
export default async function ConversationPage({
  params,
}: PageProps<"/admin/asistente/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const conversation = await getConversationForAdmin(id);
  if (!conversation) notFound();

  return (
    <div className="flex max-w-[64rem] flex-col gap-8">
      <PageHeader
        title={`Conversación del ${formatDateTime(conversation.created_at)}`}
        back={{ href: "/admin/asistente", label: "Volver al asistente" }}
        intro={
          conversation.lead && (
            <>
              Dejó sus datos:{" "}
              <Link href={`/admin/leads/${conversation.lead.id}`}>
                {conversation.lead.name}
              </Link>
            </>
          )
        }
      />
      <Conversation messages={conversation.chat_message} />
    </div>
  );
}
