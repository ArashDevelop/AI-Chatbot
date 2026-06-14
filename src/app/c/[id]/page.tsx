import { ChatShell } from '@/components/ChatShell'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ChatShell conversationId={id} />
}
