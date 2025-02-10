import type { Message } from "../../chats/types.js";

export const LLAMA_TAG = "$$llama$$";

export function flattenMessages(messages: Message[], role: string) {
    return messages
        .filter((m) => m.role === role)
        .map((m) => m.textContent)
        .join("\n");
}
