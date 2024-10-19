import type { ChatCompletionTool, FunctionParameters } from "openai/resources";
import { MetaDescription, Tool, ToolMatch, Input, Message, Result } from "../types/types";
import {
    ChatInput,
    ChatResult,
    CreateAssistantInput,
    CreateAssistantResult,
    CreateFileInput,
    CreateFileResult,
    DeleteAssistantInput,
    DeleteAssistantResult,
    DeleteFileInput,
    DeleteFileResult,
    EmbedInput,
    EmbedResult,
    GetAssistantInput,
    GetAssistantResult,
    ListAssistantsInput,
    ListAssistantsResult,
    Provider,
    UpdateAssistantInput,
    UpdateAssistantResult,
} from "../providers/provider";
import OpenAI, { ClientOptions } from "openai";
import { OpenAIAssistant } from "./openai-assistant";
import type { AssistantTool } from "openai/resources/beta/assistants";

export interface CompleteResult extends Result {
    choices: { content: string; type: string }[];
}

export interface CompleteInput extends Input {
    messages?: Message[];
    prompt: string;
}

export class OpenAIProvider extends Provider<OpenAIAssistant> {
    readonly client: OpenAI;

    constructor(options: ClientOptions) {
        super();
        this.client = new OpenAI(options);
    }

    override async embed(input: EmbedInput, meta: MetaDescription = {}): Promise<EmbedResult> {
        const res = await this.client.embeddings.create(
            {
                ...input.configure,
                input: input.content,
                model: "text-embedding-3-small",
                user: meta.user,
            },
            meta.request
        );

        return { vectors: res.data.map((d) => d.embedding), raw: res };
    }

    async complete(input: CompleteInput, meta: MetaDescription = {}): Promise<CompleteResult> {
        const res = await this.client.completions.create(
            {
                model: "gpt-3.5-turbo-instruct",
                messages: input.messages,
                user: meta.user,
                prompt: input.prompt,
                ...input.configure,
            },
            meta.request
        );

        return {
            choices: res.choices.map((c) => ({ content: c.text, type: c.finish_reason })),
            raw: { choices: res.choices, created: res.created },
        };
    }

    override async chat(input: ChatInput, meta: MetaDescription = {}): Promise<ChatResult> {
        const res = await this.client.chat.completions.create(
            {
                tool_choice: "auto",
                model: "chatgpt-4o-latest",
                messages: input.messages,
                user: meta.user,
                tools: input.tools
                    ?.filter((t) => t.type === "function")
                    .map<ChatCompletionTool>((t) => ({
                        type: "function",
                        function: {
                            name: t.name,
                            // When no parameters are defined empty parameters will b e created
                            // So we create a default schema if no schema is provided
                            parameters: (t.schema as FunctionParameters) || {
                                type: "object",
                                properties: {
                                    status: {
                                        type: "string",
                                        enum: ["tool_called"],
                                    },
                                },
                                required: ["status"],
                                additionalProperties: false,
                            },
                            description: t.trigger,
                            strict: true,
                        },
                    })),
                response_format: meta.response
                    ? { type: "json_schema", json_schema: meta.response }
                    : { type: "text" },
                ...input.configure,
            },
            meta.request
        );

        return {
            responseMessages: res.choices.map<Message>((c) => ({
                role: c.message.role,
                content: c.message.content || "",
                type: c.finish_reason,
                toolMatches:
                    c.message.tool_calls?.map<ToolMatch>((tc) => {
                        let data: any;
                        let err: Error | undefined;

                        try {
                            data = JSON.parse(tc.function.arguments);
                        } catch (e) {
                            err = e as Error;
                        }

                        return {
                            tool: tc.function.name,
                            generated: data,
                            generatedRaw: err ? tc.function.arguments : undefined,
                            parseError: err,
                        };
                    }) || [],
            })),
            raw: res,
            toolMatches: [],
        };
    }

    // -- Files

    override async createFile(input: CreateFileInput, meta: MetaDescription = {}): Promise<CreateFileResult> {
        const res = await this.client.files.create(
            {
                purpose: input.usage || "assistants",
                file: input.file,
                ...input.configure,
            },
            meta.request
        );

        return { fileId: res.id, raw: res };
    }

    override async deleteFile(input: DeleteFileInput, meta: MetaDescription = {}): Promise<DeleteFileResult> {
        const res = await this.client.files.del(input.fileId, meta.request);
        return { raw: res };
    }

    // -- Assistants

    override async listAssistants(
        input: ListAssistantsInput,
        meta: MetaDescription = {}
    ): Promise<ListAssistantsResult<OpenAIAssistant>> {
        const res = await this.client.beta.assistants.list(
            {
                limit: input.query?.limit,
                after: input.query?.after,
                before: input.query?.before,
                order: input.query?.order as "asc" | "desc",
            },
            meta.request
        );

        return { assistants: res.data.map((a) => new OpenAIAssistant(a.id, this)), raw: res };
    }

    assistantTool(tools: Tool[] | Tool): AssistantTool[] {
        if (!Array.isArray(tools)) tools = [tools];

        return tools
            .filter((t) => t.type === "function")
            .map<AssistantTool>((t) => ({
                function: {
                    parameters: t.schema as any,
                    description: t.trigger,
                    name: t.name,
                    strict: true,
                },
                type: "function",
            }));
    }

    override async createAssistant(
        input: CreateAssistantInput,
        meta: MetaDescription = {}
    ): Promise<CreateAssistantResult<OpenAIAssistant>> {
        const res = await this.client.beta.assistants.create(
            {
                model: "gpt-4-turbo",
                description: input.description,
                name: input.name,
                instructions: input.instructions,
                metadata: input.metadata,
                response_format: meta.response,
                tools: input.tools && this.assistantTool(input.tools),
                tool_resources: input.resources,
                ...input.configure,
            },
            meta.request
        );

        return { assistant: new OpenAIAssistant(res.id, this), raw: res };
    }

    override async getAssistant(
        input: GetAssistantInput,
        meta: MetaDescription = {}
    ): Promise<GetAssistantResult<OpenAIAssistant>> {
        const res = await this.client.beta.assistants.retrieve(input.assistantId, meta.request);

        return { assistant: new OpenAIAssistant(res.id, this), raw: res };
    }
    override async updateAssistant(
        input: UpdateAssistantInput,
        meta: MetaDescription
    ): Promise<UpdateAssistantResult> {
        const data = input.data;
        const res = await this.client.beta.assistants.update(
            input.assistantId,
            {
                instructions: data.instructions,
                description: data.description,
                metadata: data.metadata,
                response_format: meta.response,
                name: data.name,
                tools: data.tools && this.assistantTool(data.tools),
                tool_resources: data.resources,
                ...input.configure,
            },
            meta.request
        );

        return { updated: true, raw: res };
    }
    override async deleteAssistant(
        input: DeleteAssistantInput,
        meta: MetaDescription = {}
    ): Promise<DeleteAssistantResult> {
        const res = await this.client.beta.assistants.del(input.assistantId, meta.request);
        return { deleted: true, raw: res };
    }
}
