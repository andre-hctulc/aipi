import { Chat, type ChatSnapshot } from "../../chats/chat.js";
import {
    Chats,
    type CreateChatContextInput,
    type CreateChatInput,
    type CreateChatResult,
    type ListChatsResult,
    type LoadChatResult,
    type RefreshChatResult,
    type RunChatInput,
    type RunChatResult,
    type UpdateChatInput,
} from "../../chats/chats.js";
import type { Message } from "../../chats/types.js";
import type { CommonQueryOptions } from "../../types/query-options.js";
import type { BaseOptions } from "../../types/types.js";
import { HFProvider } from "./hf-provider.js";
import { NotSupportedError } from "../../errors/common-errors.js";
import { createId } from "../../utils/system.js";

export class HFChats extends Chats<undefined> {
    private provider!: HFProvider;

    protected override onMount() {
        this.provider = this.app.require(HFProvider);
    }

    protected override async createChat(
        input: CreateChatInput,
        options?: BaseOptions
    ): Promise<CreateChatResult<any>> {
        return {
            chatId: createId(),
            context: undefined,
            snapshot: {
                messages: input.snapshot?.messages || [],
                toolMatches: input.snapshot?.toolMatches || [],
            },
        };
    }
    protected override async createChatContext(
        input: CreateChatContextInput,
        options?: BaseOptions
    ): Promise<undefined> {
        return undefined;
    }

    protected override async refreshChat(chat: Chat<any>): Promise<RefreshChatResult> {
        return { snapshot: chat.getSnapshot() };
    }

    protected override async loadChat(chatId: string): Promise<LoadChatResult<any> | null> {
        return null;
    }

    protected override async alterChat(chat: Chat<any>, input: UpdateChatInput): Promise<void> {
        throw new NotSupportedError("alterChat");
    }

    protected override async deleteChat(chatId: string): Promise<void> {
        // Nothing to do
    }

    protected override async loadChats(
        queryOptions?: CommonQueryOptions,
        options?: BaseOptions
    ): Promise<ListChatsResult> {
        return { chatIds: [] };
    }

    protected override async runChat(
        chat: Chat<any>,
        input: RunChatInput,
        options?: BaseOptions<any>
    ): Promise<RunChatResult> {
        const tools = [...chat.tools, ...(input.resources?.tools || [])];
        const messages = [...chat.getMessages(), ...(input.messages || [])];
        const res = await this.provider.hf.chatCompletion(
            {
                messages: messages.map((m) => ({ content: m.textContent || "", role: m.role })),
                tools: tools.map((tool) => ({
                    type: "function",
                    function: { arguments: tool.schema, name: tool.name, description: tool.description },
                })),
                ...input.params,
            },
            options?.params
        );

        const choice = res.choices[0].message;
        const snapshot: ChatSnapshot = {
            messages: [{ textContent: choice.content, role: choice.role }],
            toolMatches:
                choice.tool_calls?.map((t: any) => ({
                    tool: t.function.name,
                    params: t.function.arguments,
                })) || [],
        };

        return {
            runId: createId(),
            snapshot: Chat.stackSnapshots(chat.getSnapshot(), snapshot),
        };
    }

    protected override async pushMessages(chat: Chat<any>, messages: Message[]): Promise<void> {
        // Nothing to do
    }

    protected override async deleteMessage(chat: Chat<any>, messageId: string): Promise<void> {
        chat.removeMessage(messageId);
    }

    protected override async loadMessages(
        chat: Chat<any>,
        queryOptions?: CommonQueryOptions
    ): Promise<Message[]> {
        return chat.getMessages();
    }

    protected override async loadMessage(chat: Chat<any>, messageId: string): Promise<Message | null> {
        return chat.getMessage(messageId);
    }
}
