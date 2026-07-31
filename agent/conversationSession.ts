interface AgentSession {
  dong: string;
  updatedAt: number;
}

const TTL_MS = 30 * 60 * 1000;

function getStore(): Map<string, AgentSession> {
  const globalRef = globalThis as typeof globalThis & {
    __walkAgentSessions?: Map<string, AgentSession>;
  };
  if (!globalRef.__walkAgentSessions) {
    globalRef.__walkAgentSessions = new Map();
  }
  return globalRef.__walkAgentSessions;
}

export function setConversationDong(
  conversationId: string,
  dong: string,
): void {
  getStore().set(conversationId, { dong, updatedAt: Date.now() });
}

export function getConversationDong(conversationId: string): string | null {
  const session = getStore().get(conversationId);
  if (!session) return null;
  if (Date.now() - session.updatedAt > TTL_MS) {
    getStore().delete(conversationId);
    return null;
  }
  return session.dong;
}

export function clearConversationDong(conversationId: string): void {
  getStore().delete(conversationId);
}
