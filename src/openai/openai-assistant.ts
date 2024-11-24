import {
    Assistant,
    AddMessagesInput,
    AddMessagesResult,
    CreateChatInput,
    CreateChatResult,
    DeleteChatInput,
    DeleteChatResult,
    CreateResponseInput,
    CreateResponseResult,
    DeleteMessageInput,
    DeleteMessageResult,
    GetMessageInput,
    GetMessageResult,
    ListMessagesInput,
    ListMessagesResult,
    ListChatsInput,
    ListChatsResult,
    GetChatInput,
    GetChatResult,
    UpdateChatInput,
    UpdateChatResult,
} from "../assistants/assistant";
import { OpenAIProvider } from "./openai-provider";
import { MetaDescription, ToolMatch } from "../types";
import { AipiError, AipiErrorTag } from "../aipi-error";

/* 
DOCS: https://platform.openai.com/docs/assistants/quickstart?lang=node.js&context=without-streaming
*/

export class OpenAIAssistant extends Assistant {
    constructor(id: string, protected provider: OpenAIProvider, metadata?: Record<string, any>) {
        super(id, metadata);
    }

    // -- Chats

    override async createChat(input: CreateChatInput, meta: MetaDescription = {}): Promise<CreateChatResult> {
        // A run is executed in a thread. A thread can be cerated manually. Then we would need to create a thread and then a tun.
        // We use this helper method to create a thread and run it in one go.
        const thread = await this.provider.client.beta.threads.create(
            {
                messages: input.messages?.map((m) => ({ content: m.textContent, role: m.role })),
                tool_resources: input.resources,
                ...input.configure,
            },
            meta.request
        );

        const run = await this.provider.client.beta.threads.runs.createAndPoll(
            thread.id,
            {
                assistant_id: this.id,
                tools: input.tools && this.provider.assistantTool(input.tools),
            },
            meta.request
        );

        // return thread id, which will be referenced in subsequent calls
        return { chatId: thread.id + "/" + run.id, raw: thread };
    }

    override async updateChat(input: UpdateChatInput, meta: MetaDescription = {}): Promise<UpdateChatResult> {
        const [threadId] = input.chatId.split("/");
        const res = await this.provider.client.beta.threads.update(threadId, input.data, meta.request);
        return { updated: true, raw: res };
    }

    override async deleteChat(input: DeleteChatInput, meta: MetaDescription = {}): Promise<DeleteChatResult> {
        const [threadId] = input.chatId.split("/");
        const res = await this.provider.client.beta.threads.del(threadId, meta.request);
        return { deleted: true, raw: res };
    }

    override async listChats(input: ListChatsInput, meta: MetaDescription = {}): Promise<ListChatsResult> {
        // Not supported by OpenAI
        throw new AipiError({ message: "List chats not supported", tags: [AipiErrorTag.NOT_SUPPORTED] });
    }

    override async getChat(input: GetChatInput, meta: MetaDescription = {}): Promise<GetChatResult> {
        const [threadId] = input.chatId.split("/");
        const res = await this.provider.client.beta.threads.retrieve(threadId, meta.request);
        return { raw: res };
    }

    // -- Messages

    override async addMessages(
        input: AddMessagesInput,
        meta: MetaDescription = {}
    ): Promise<AddMessagesResult> {
        const [threadId] = input.chatId.split("/");

        if (input.messages.length > 1)
            throw new AipiError({
                message: "Only one message can be added at a time",
                tags: [AipiErrorTag.NOT_SUPPORTED],
            });

        const message = input.messages[0];

        if (!message) {
            throw new AipiError({ message: "No message provided" });
        }

        const res = await this.provider.client.beta.threads.messages.create(
            threadId,
            {
                role: message.role as any,
                content: message.textContent,
                attachments: message.attachments,
            },
            meta.request
        );

        return { messageIds: [res.id], raw: res };
    }

    override async run(
        input: CreateResponseInput,
        meta: MetaDescription = {}
    ): Promise<CreateResponseResult> {
        const [threadId, runId] = input.chatId.split("/");

        // This does not respond with messages, these have to be fetched separately
        const run = await this.provider.client.beta.threads.runs.createAndPoll(
            threadId,
            {
                assistant_id: this.id,
                instructions: input.instructions,
                tools: input.tools && this.provider.assistantTool(input.tools),
                response_format: OpenAIProvider.parseResponse(meta.response),
                additional_instructions: input.additionalInstructions,
                additional_messages: input.messages?.map((msg) => ({
                    content: msg.textContent,
                    role: msg.role as any,
                    attachments: msg.attachments,
                })),
                ...input.configure,
            },
            meta.request
        );

        const { messages } = await this.listMessages(
            { chatId: input.chatId, configure: { run_id: run.id } },
            meta
        );

        // fetch response messages. assistant response messages have role "assistant"
        const responseMessages = messages.filter((m) => m.role === "assistant");

        return {
            toolMatches:
                run.required_action?.submit_tool_outputs.tool_calls.map<ToolMatch>((t) => {
                    let obj: any;
                    let err: any;

                    try {
                        obj = JSON.parse(t.function.arguments || "{}");
                    } catch (e) {
                        err = e;
                    }

                    return {
                        tool: t.function.name,
                        generated: JSON.parse(t.function.arguments || "{}"),
                        generatedRaw: err ? t.function.arguments : undefined,
                        parseError: err,
                    };
                }) || [],
            responseMessages: responseMessages,
            raw: run,
        };
    }

    override async getMessage(input: GetMessageInput, meta: MetaDescription = {}): Promise<GetMessageResult> {
        const res = await this.provider.client.beta.threads.messages.retrieve(
            input.chatId,
            input.messageId,
            meta.request
        );

        return {
            message: {
                textContent: res.content
                    .filter((m) => m.type === "text")
                    .map((t) => t.text.value)
                    .join("\n"),
                attachments: res.attachments,
                role: res.role,
            },
            raw: res,
        };
    }

    /**
     * Use `configure.run_id` to get messages from a specific run
     */
    override async listMessages(
        input: ListMessagesInput,
        meta: MetaDescription = {}
    ): Promise<ListMessagesResult> {
        const [threadId, runId] = input.chatId.split("/");

        const res = await this.provider.client.beta.threads.messages.list(
            threadId,
            {
                limit: input.query?.limit,
                after: input.query?.after,
                before: input.query?.before,
                order: input.query?.order as "asc" | "desc",
                ...input.configure,
            },
            meta.request
        );

        return {
            messages: res.data.map((m) => ({
                textContent: m.content
                    .filter((m) => m.type === "text")
                    .map((t) => t.text.value)
                    .join("\n"),
                attachments: m.attachments,
                role: m.role,
            })),
            raw: res,
        };
    }

    override async deleteMessage(
        input: DeleteMessageInput,
        meta: MetaDescription = {}
    ): Promise<DeleteMessageResult> {
        const res = await this.provider.client.beta.threads.messages.del(
            input.chatId,
            input.messageId,
            meta.request
        );

        return {
            deleted: true,
            raw: res,
        };
    }
}
