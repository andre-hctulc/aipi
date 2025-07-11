import { Chat, type ChatSnapshot } from "../../chats/chat.js";
import {
    Chats,
    type CreateChatContextInput,
    type RefreshChatResult,
    type LoadChatResult,
    type UpdateChatInput,
    type ListChatsResult,
    type RunChatInput,
    type RunChatResult,
    type CreateChatInput,
    type CreateChatResult,
} from "../../chats/chats.js";
import type { Message, ToolMatch } from "../../chats/types.js";
import type { CommonQueryOptions } from "../../types/query-options.js";
import type { BaseOptions } from "../../types/types.js";
import { OpenAIProvider } from "./openai-provider.js";
import type { CommonOpenAIOptions } from "./types.js";
import { assistantTool, parseFormat } from "./system.js";
import { NotSupportedError } from "../../errors/common-errors.js";
import type { Instructions } from "../../agents/types.js";
import { createId } from "../../utils/system.js";
import type OpenAI from "openai";
import type { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs.mjs";

type RequestOptions = OpenAI.RequestOptions;

export interface OpenAIAgentChatContext {
    threadId: string;
    assistantId: string;
}

export interface RunOpenAIChatOptions {
    instructions?: Instructions;
    additionalInstructions?: Instructions;
    requestOptions?: RequestOptions;
}

// TODO static method that creates the assistant?

export class OpenAIAgentChats extends Chats<OpenAIAgentChatContext> {
    constructor(readonly assistantId: string) {
        super();
    }

    private provider!: OpenAIProvider;

    override onMount() {
        this.provider = this.app.require(OpenAIProvider);
    }

    // #### Chats ####

    protected override async createChatContext(
        input: CreateChatContextInput,
        options?: BaseOptions
    ): Promise<OpenAIAgentChatContext> {
        const [chatId, threadId] = input.chatId.split("/");
        return { threadId, assistantId: this.assistantId };
    }

    override async createChat(
        input: CreateChatInput,
        requestOptions?: RequestOptions & BaseOptions
    ): Promise<CreateChatResult<OpenAIAgentChatContext>> {
        // A run is executed in a thread. A thread can be cerated manually. Then we would need to create a thread and then a tun.
        // We use this helper method to create a thread and run it in one go.
        const thread = await this.provider.main.beta.threads.create(
            {
                messages: input.snapshot?.messages?.map((m) => ({
                    content: m.textContent || "",
                    attachments: m.attachments,
                    role: m.role as any,
                })),
                tool_resources: input.resources?.toolResources,
            },
            requestOptions
        );

        // return thread id, which will be referenced in subsequent calls
        return {
            context: { assistantId: this.assistantId, threadId: thread.id },
            chatId: createId() + "/" + thread.id,
            snapshot: {
                messages: input.snapshot?.messages || [],
                toolMatches: [],
            },
        };
    }

    protected override async refreshChat(chat: Chat<OpenAIAgentChatContext>): Promise<RefreshChatResult> {
        // Refresh messages
        const messages = await this.loadMessages(chat);
        return { snapshot: { messages, toolMatches: chat.getSnapshot().toolMatches } };
    }

    protected override async loadChat(
        chatId: string,
        requestOptions?: RequestOptions
    ): Promise<LoadChatResult<OpenAIAgentChatContext> | null> {
        const [_, threadId] = chatId.split("/");
        const res = await this.provider.main.beta.threads.retrieve(threadId, requestOptions);
        return {
            context: { assistantId: this.assistantId, threadId: res.id },
            resources: { toolResources: res.tool_resources, tools: [] },
            snapshot: { messages: [], toolMatches: [] },
        };
    }

    protected override async alterChat(
        chat: Chat<OpenAIAgentChatContext>,
        input: UpdateChatInput
    ): Promise<void> {
        await this.provider.main.beta.threads.update(chat.context.threadId, {
            tool_resources: input.data?.resources?.toolResources,
        });
    }

    protected override async deleteChat(chatId: string, requestOptions?: RequestOptions): Promise<void> {
        const [_, threadId] = chatId.split("/");
        await this.provider.main.beta.threads.del(threadId, requestOptions);
    }

    protected override loadChats(
        queryOptions?: CommonQueryOptions,
        options?: BaseOptions
    ): Promise<ListChatsResult> {
        throw new NotSupportedError("loadChats");
    }

    protected override async runChat(
        chat: Chat<OpenAIAgentChatContext>,
        input: RunChatInput,
        options?: RunOpenAIChatOptions & BaseOptions
    ): Promise<RunChatResult> {
        const tools = [...(chat.resources?.tools || []), ...(input.resources?.tools || [])];
        // This does not respond with messages, these have to be fetched separately
        const run = await this.provider.main.beta.threads.runs.createAndPoll(
            chat.context.threadId,
            {
                assistant_id: chat.context.assistantId,
                // Only allowed when tools are present
                tool_choice: tools.length ? "auto" : undefined,
                instructions: options?.instructions?.content,
                // Tools array cannot be empty
                tools: tools.length ? tools.map((t) => assistantTool(t)) : undefined,
                response_format: input.responseFormat ? parseFormat(input.responseFormat) : undefined,
                additional_instructions: options?.additionalInstructions?.content,
                additional_messages: input.messages?.map((msg) => ({
                    content: msg.textContent || "",
                    role: msg.role as any,
                    attachments: msg.attachments,
                })),
                // model: "gpt-4-turbo",
            },
            options?.requestOptions
        );

        const snapshot: ChatSnapshot = {
            messages: [],
            toolMatches:
                run.required_action?.submit_tool_outputs.tool_calls.map<ToolMatch>((t) =>
                    this.parseToolMatch(t)
                ) || [],
        };

        return {
            snapshot: Chat.stackSnapshots(chat.getSnapshot(), snapshot),
            runId: run.id,
        };
    }

    private parseToolMatch(match: RequiredActionFunctionToolCall): ToolMatch {
        let obj: any;
        let err: any;

        try {
            obj = JSON.parse(match.function.arguments || "{}");
        } catch (e) {
            err = e;
        }

        return {
            tool: match.function.name,
            params: JSON.parse(match.function.arguments || "{}"),
            rawParams: err ? match.function.arguments : undefined,
            parseError: err,
        };
    }

    protected override async pushMessages(
        chat: Chat<OpenAIAgentChatContext>,
        messages: Message[],
        requestOptions?: RequestOptions
    ): Promise<void> {
        for (const message of messages) {
            await this.provider.main.beta.threads.messages.create(
                chat.context.threadId,
                {
                    role: message.role as any,
                    content: message.textContent || "",
                    attachments: message.attachments,
                },
                requestOptions
            );
        }
    }

    protected override async deleteMessage(
        chat: Chat<OpenAIAgentChatContext>,
        messageId: string,
        options?: CommonOpenAIOptions
    ): Promise<void> {
        await this.provider.main.beta.threads.messages.del(
            chat.id,
            messageId,
            options?.params?.requestOptions
        );
    }

    protected override async loadMessages(
        chat: Chat<OpenAIAgentChatContext>,
        queryOptions: CommonQueryOptions = {},
        options: CommonOpenAIOptions = {}
    ): Promise<Message[]> {
        const res = await this.provider.main.beta.threads.messages.list(
            chat.context.threadId,
            {
                limit: queryOptions.limit,
                after: queryOptions.after,
                before: queryOptions.before,
                order: queryOptions.order as "asc" | "desc",
            },
            options.params?.requestOptions
        );

        return res.data.map((m) => ({
            textContent: m.content
                .filter((m) => m.type === "text")
                .map((t) => t.text.value)
                .join("\n"),
            attachments: m.attachments,
            role: m.role,
        }));
    }

    protected override async loadMessage(
        chat: Chat<OpenAIAgentChatContext>,
        messageId: string,
        options?: CommonOpenAIOptions
    ): Promise<Message | null> {
        const res = await this.provider.main.beta.threads.messages.retrieve(
            chat.id,
            messageId,
            options?.params?.requestOptions
        );

        return {
            textContent: res.content
                .filter((m) => m.type === "text")
                .map((t) => t.text.value)
                .join("\n"),
            attachments: res.attachments,
            role: res.role,
        };
    }
}
