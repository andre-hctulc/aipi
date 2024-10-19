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
} from "../assistants/assistant";
import { OpenAIProvider } from "./openai-provider";
import { MetaDescription, ToolMatch } from "../types";
import { AipiError, AipiErrorTag } from "../aipi-error";

/* 
DOCS: https://platform.openai.com/docs/assistants/quickstart?lang=node.js&context=without-streaming
*/

export class OpenAIAssistant extends Assistant {
    constructor(id: string, protected provider: OpenAIProvider) {
        super(id);
    }

    // -- Chats

    override async createChat(input: CreateChatInput, meta: MetaDescription): Promise<CreateChatResult> {
        const res = await this.provider.client.beta.threads.create(
            {
                messages: input.messages?.map((msg) => ({
                    role: msg.role as any,
                    content: msg.content,
                    attachments: msg.attachments,
                })),
                tool_resources: input.resources,
                ...input.configure,
            },
            meta.request
        );

        return { chatId: res.id, raw: res };
    }

    override async deleteChat(input: DeleteChatInput, meta: MetaDescription): Promise<DeleteChatResult> {
        const res = await this.provider.client.beta.threads.del(input.chatId, meta.request);
        return { deleted: true, raw: res };
    }

    override async listChats(input: ListChatsInput, meta: MetaDescription): Promise<ListChatsResult> {
        // Not supported by OpenAI
        throw new AipiError({ message: "List chats not supported", tags: [AipiErrorTag.NOT_SUPPORTED] });
    }

    override async getChat(input: GetChatInput, meta: MetaDescription): Promise<GetChatResult> {
        const res = await this.provider.client.beta.threads.retrieve(input.chatId, meta.request);
        return { raw: res };
    }

    // -- Messages

    override async addMessages(input: AddMessagesInput, meta: MetaDescription): Promise<AddMessagesResult> {
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
            input.chatId,
            {
                role: message.role as any,
                content: message.content,
                attachments: message.attachments,
            },
            meta.request
        );

        return { messageIds: [res.id], raw: res };
    }

    override async createResponse(
        input: CreateResponseInput,
        meta: MetaDescription
    ): Promise<CreateResponseResult> {
        // This does not respond with messages, these have to be fetched separately
        const res = await this.provider.client.beta.threads.runs.createAndPoll(
            input.chatId,
            {
                assistant_id: this.id,
                instructions: input.instructions,
                tools: input.tools && this.provider.assistantTool(input.tools),
                response_format: meta.response,
                additional_instructions: input.instructions,
                additional_messages: input.messages,
                ...input.configure,
            },
            meta.request
        );

        const { messages } = await this.listMessages({ chatId: input.chatId }, meta);

        // fetch response messages. assistant response messages have role "assistant"
        const responseMessages = messages.filter((m) => m.role === "assistant");

        return {
            toolMatches: res.required_action?.submit_tool_outputs.tool_calls.map<ToolMatch>((t) => {
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
            }),
            responseMessages: responseMessages,
            raw: res,
        };
    }

    override async getMessage(input: GetMessageInput, meta: MetaDescription): Promise<GetMessageResult> {
        const res = await this.provider.client.beta.threads.messages.retrieve(
            input.chatId,
            input.messageId,
            meta.request
        );

        return {
            message: {
                content: res.content
                    .filter((m) => m.type === "text")
                    .map((t) => t.text.value)
                    .join("\n"),
                attachments: res.attachments,
                role: res.role,
            },
            raw: res,
        };
    }

    override async listMessages(
        input: ListMessagesInput,
        meta: MetaDescription
    ): Promise<ListMessagesResult> {
        const res = await this.provider.client.beta.threads.messages.list(
            input.chatId,
            {
                limit: input.query?.limit,
                after: input.query?.after,
                before: input.query?.before,
                order: input.query?.order as "asc" | "desc",
            },
            meta.request
        );

        return {
            messages: res.data.map((m) => ({
                content: m.content
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
        meta: MetaDescription
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
