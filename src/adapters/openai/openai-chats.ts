import type { Chat } from "../../chats/chat.js";
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
import { NotSupportedError } from "../../errors/common-errors.js";
import { OpenAIProvider } from "./openai-provider.js";
import type { CommonOpenAIOptions } from "./types.js";
import type {
    ChatCompletionMessageParam,
    ChatCompletionTool,
    FunctionParameters,
} from "openai/resources/index";
import { parseFormat } from "./system.js";
import type { CommonQueryOptions } from "../../types/query-options.js";
import type { AnyOptions } from "../../types/types.js";
import { createId } from "../../utils/system.js";

export class OpenAIChats extends Chats<undefined> {
    private provider!: OpenAIProvider;

    override onMount() {
        this.provider = this.app.require(OpenAIProvider);
    }

    // #### Chats ####

    protected override async createChat(
        input: CreateChatInput,
        options?: AnyOptions
    ): Promise<CreateChatResult<undefined>> {
        return {
            context: undefined,
            snapshot: {
                messages: input.snapshot?.messages || [],
                toolMatches: input.snapshot?.toolMatches || [],
            },
            chatId: createId(),
        };
    }

    protected override async createChatContext(
        input: CreateChatContextInput,
        options?: AnyOptions
    ): Promise<undefined> {
        return undefined;
    }

    protected override async refreshChat(chat: Chat<undefined>): Promise<RefreshChatResult> {
        // no real refresh available
        return { snapshot: chat.getSnapshot() };
    }

    /**
     * This will always return null. Use persisters to persist openai chats.
     */
    protected override async loadChat(chatId: string): Promise<LoadChatResult | null> {
        return null;
    }
    /**
     * This will always return an empty list. Use persisters to persist openai llama chats.
     */
    protected override async loadChats(
        queryOptions?: CommonQueryOptions,
        options?: AnyOptions
    ): Promise<ListChatsResult> {
        return { chatIds: [] };
    }

    /**
     * This has no effect. Use persisters to persist and delete openai chats.
     */
    protected override async deleteChat(chatId: string): Promise<void> {}

    protected override async runChat(
        chat: Chat<undefined>,
        input: RunChatInput,
        options?: CommonOpenAIOptions & AnyOptions
    ): Promise<RunChatResult> {
        const tools = [...chat.tools, ...(input.resources?.tools || [])];
        const messages = [...chat.getMessages(), ...(input.messages || [])];
        const res = await this.provider.client.chat.completions.create(
            {
                n: input.choices ?? 1,
                // only allowed when tools provided
                tool_choice: tools.length ? "auto" : undefined,
                model: options?.params?.model || "gpt-4",
                messages: messages.map<ChatCompletionMessageParam>((message) => this.oaiMsg(message)),
                // tools array cannot be empty
                tools: tools.length
                    ? tools
                          .filter((t) => t.type === "function")
                          .map<ChatCompletionTool>((t) => ({
                              type: "function",
                              function: {
                                  name: t.name,
                                  parameters: t.schema as FunctionParameters,
                                  strict: t.schema ? true : false,
                              },
                          }))
                    : undefined,
                response_format: input.responseFormat ? parseFormat(input.responseFormat) : undefined,
            },
            options?.params?.requestOptions
        );

        return {
            runId: createId(),
            snapshot: {
                messages: res.choices.map<Message>((c) => ({
                    role: c.message.role,
                    textContent: c.message.content || "",
                    type: c.finish_reason,
                    id: createId(),
                    index: c.index,
                })),
                toolMatches: res.choices
                    .map<ToolMatch[]>(({ message, index }) => {
                        if (!message.tool_calls) return [];

                        let data: any;
                        let err: Error | undefined;

                        return message.tool_calls.map((tc) => {
                            try {
                                data = JSON.parse(tc.function.arguments || "");
                            } catch (e) {
                                err = e as Error;
                            }

                            return {
                                tool: tc.function.name,
                                params: data,
                                rawParams: err ? tc.function.arguments : undefined,
                                parseError: err,
                                index: index,
                            } as ToolMatch;
                        });
                    })
                    .flat(),
            },
        };
    }

    protected override alterChat(chat: Chat<undefined>, data: any): Promise<void> {
        throw new NotSupportedError("alterChat");
    }

    // #### Messages ####

    private oaiMsg(message: Message): ChatCompletionMessageParam {
        return {
            content: message.textContent,
            role: message.role as any,
        };
    }

    protected override async pushMessages(chat: Chat<undefined>, messages: Message[]): Promise<void> {
        // Nothing to do here
    }

    protected override async deleteMessage(chat: Chat<undefined>, messageId: string): Promise<void> {
        // Nothing to do here
    }

    protected override async loadMessages(chat: Chat<undefined>): Promise<Message[]> {
        return chat.getMessages();
    }

    protected override async loadMessage(chat: Chat<undefined>, messageId: string): Promise<Message | null> {
        return chat.getMessage(messageId);
    }
}
