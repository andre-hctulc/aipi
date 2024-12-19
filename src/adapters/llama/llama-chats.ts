import {
    defineChatSessionFunction,
    LlamaChatSession,
    type ChatHistoryItem,
    type ChatSessionModelFunction,
    type LlamaContextOptions,
} from "node-llama-cpp";
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
} from "../../chats/chats.js";
import type { Message, ToolMatch } from "../../chats/types.js";
import { LlamaProvider } from "./llama-provider.js";
import { NotSupportedError } from "../../errors/common-errors.js";
import { flattenMessages } from "./system.js";
import type { Chat } from "../../chats/chat.js";
import type { CommonQueryOptions } from "../../types/query-options.js";
import type { AnyOptions } from "../../types/types.js";
import { createId } from "../../utils/system.js";

export interface LlamaCreateContextOptions {
    params?: {
        contextOptions?: LlamaContextOptions;
        sessionOptions?: Partial<LlamaChatSession>;
        systemPrompt?: Message[];
    };
}

interface LlamaChatContext {
    session: LlamaChatSession;
}

export class LlamaChats extends Chats<LlamaChatContext> {
    private provider!: LlamaProvider;

    override onMount() {
        this.provider = this.app.require(LlamaProvider);
    }

    // #### Chats ####

    protected override async createChat(
        input: CreateChatInput,
        options?: LlamaCreateContextOptions & AnyOptions
    ): Promise<CreateChatResult<LlamaChatContext>> {
        return {
            context: await this.createChatContext({ chatId: "" }, options),
            snapshot: {
                messages: input.snapshot?.messages || [],
                toolMatches: input.snapshot?.toolMatches || [],
            },
            chatId: createId(),
        };
    }

    protected override async refreshChat(chat: Chat<LlamaChatContext>): Promise<RefreshChatResult> {
        // no real refresh available
        return { snapshot: chat.getSnapshot() };
    }

    /**
     * This will always return null. Use persisters to persist llama chats.
     */
    protected override async loadChat(chatId: string): Promise<LoadChatResult | null> {
        return null;
    }

    /**
     * This has no effect. Use persisters to persist and delete llama chats.
     */
    protected override async deleteChat(chatId: string): Promise<void> {}

    /**
     * This will always return an empty list. Use persisters to persist llama chats.
     */
    protected override async loadChats(
        queryOptions?: CommonQueryOptions,
        options?: AnyOptions
    ): Promise<ListChatsResult> {
        return { chatIds: [] };
    }

    protected override async createChatContext(
        input: CreateChatContextInput,
        options?: LlamaCreateContextOptions & AnyOptions
    ): Promise<LlamaChatContext> {
        const context = await this.provider.model.createContext({ ...options?.params?.contextOptions });
        const session = new LlamaChatSession({
            contextSequence: context.getSequence(),
            systemPrompt: flattenMessages(options?.params?.systemPrompt || [], "system"),
            ...options?.params?.sessionOptions,
        });

        return { session };
    }

    override async runChat(chat: Chat<LlamaChatContext>, input: RunChatInput): Promise<RunChatResult> {
        const tools = [...chat.tools, ...(input.resources?.tools || [])];
        const messages = [...chat.getMessages(), ...(input.messages || [])];

        const functions: {
            [name: string]: ChatSessionModelFunction;
        } = {};

        tools.forEach((tool) => {
            functions[tool.name] = defineChatSessionFunction({
                params: tool.schema as any,
                description: tool.description,
                handler: (params) => {
                    toolMatches.push({ tool: tool.name, params: params, rawParams: params });
                },
            });
        });

        const toolMatches: ToolMatch[] = [];
        const responseMessages: Message[] = [];

        let i = 0;

        for (const message of messages) {
            if (message.role === "user" && message.textContent !== undefined) {
                const { responseText } = await chat.context.session.promptWithMeta(message.textContent, {
                    functions,
                });
                responseMessages.push({
                    textContent: responseText,
                    role: "system",
                    index: i,
                    id: createId(i),
                });
            }

            i++;
        }

        return {
            runId: createId(),
            snapshot: {
                messages: responseMessages,
                toolMatches,
            },
        };
    }

    override alterChat(chat: Chat, data: any): Promise<void> {
        throw new NotSupportedError("alterChat");
    }

    // #### Messages ####

    private parseHistoryItem(item: ChatHistoryItem): Message {
        if (item.type === "user") {
            return {
                textContent: item.text,
                role: "user",
            };
        }

        if (item.type === "system") {
            return {
                content: item.text,
                role: "system",
            };
        }

        return {
            content: item.response,
            role: item.type,
        };
    }

    override async pushMessages(chat: Chat<LlamaChatContext>, messages: Message[]): Promise<void> {
        // Nothing to do here
    }

    protected override async deleteMessage(chat: Chat<LlamaChatContext>, messageId: string): Promise<void> {
        // Nothing to do here
    }

    protected override async loadMessages(chat: Chat): Promise<Message[]> {
        const session = chat.context as LlamaChatSession;
        return session.getChatHistory().map<Message>((message) => this.parseHistoryItem(message));
    }

    protected override async loadMessage(chat: Chat, messageId: string): Promise<Message | null> {
        const session = chat.context as LlamaChatSession;
        const message = session.getChatHistory().find((message, i) => String(i) === messageId);
        if (!message) return null;
        return this.parseHistoryItem(message);
    }
}
