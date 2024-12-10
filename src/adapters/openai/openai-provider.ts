import type { Tool, ToolMatch, Input, Message, Result, MessageFormat } from "../../types/types.js";
import {
    Provider,
    type ChatInput,
    type ChatResult,
    type CompleteInput,
    type CompleteResult,
    type CreateAssistantInput,
    type CreateAssistantResult,
    type CreateFileInput,
    type CreateFileResult,
    type DeleteAssistantInput,
    type DeleteAssistantResult,
    type DeleteFileInput,
    type DeleteFileResult,
    type EmbedInput,
    type EmbedResult,
    type GetAssistantInput,
    type GetAssistantResult,
    type ListAssistantsInput,
    type ListAssistantsResult,
    type UpdateAssistantInput,
    type UpdateAssistantResult,
} from "../../providers/provider.js";
import OpenAI, { type ClientOptions } from "openai";
import { OpenAIAssistant } from "./openai-assistant.js";
import type { AssistantTool } from "openai/resources/beta/assistants";
import type { CommonQueryOptions, JSONSchema } from "../../types/index.js";
import type { ChatCompletionTool, FunctionParameters } from "openai/resources/index";
import type { RequestOptions } from "openai/core.mjs";

export interface CreateVectorStoreInput extends Input {
    name: string;
    files?: string[];
}

export interface CreateVectorStoreResult extends Result {
    id: string;
}

export interface DeleteVectorStoreInput extends Input {
    id: string;
}

export interface DeleteVectorStoreResult extends Result {
    deleted: boolean;
}

export interface ListVectorStoresInput extends Input {
    query?: CommonQueryOptions;
}

export interface ListVectorStoresResult extends Result {
    stores: { id: string; name: string }[];
}

export interface GetVectorStoreInput extends Input {
    id: string;
}

export interface GetVectorStoreResult extends Result {
    store: { id: string; name: string };
}

export interface GetVectorStoreFileInput extends Input {
    storeId: string;
    fileId: string;
}

export interface GetVectorStoreFileResult extends Result {
    createdAt: number;
}

export interface DeleteVectorStoreFileInput extends Input {
    storeId: string;
    fileId: string;
}

export interface DeleteVectorStoreFileResult extends Result {
    deleted: boolean;
}

export interface CreateVectorStoreFileInput extends Input {
    storeId: string;
    file: File;
}

export interface CreateVectorStoreFileResult extends Result {
    fileId: string;
}

export interface ListVectorStoreFilesInput extends Input {
    storeId: string;
    query?: CommonQueryOptions;
}

export interface ListVectorStoreFilesResult extends Result {
    fileIds: string[];
}

export interface UpdateVectorStoreInput extends Input {
    id: string;
    data: any;
}

export interface UpdateVectorStoreResult extends Result {
    updated: boolean;
}

export interface AddVectorStoreFileInput extends Input {
    storeId: string;
    fileId: string;
}

export interface AddVectorStoreFileResult extends Result {
    added: boolean;
}

export class OpenAIProvider extends Provider<OpenAIAssistant> {
    readonly client: OpenAI;

    constructor(client: ClientOptions | OpenAI) {
        super();
        this.client = client instanceof OpenAI ? client : new OpenAI(client);
    }

    static parseFormat(format: MessageFormat) {
        if (format.type === "json" && !format.schema) return { type: "json_object" };

        return {
            type: "json_object",
            json_schema: {
                schema: format.schema,
                strict: true,
                name: "response_object",
            },
        };
    }

    override async embed(input: EmbedInput, requestOptions?: RequestOptions): Promise<EmbedResult> {
        const res = await this.client.embeddings.create(
            {
                ...input.configure,
                input: input.content,
                model: "text-embedding-3-small",
            },
            requestOptions
        );

        return { vectors: res.data.map((d) => d.embedding), raw: res };
    }

    override async complete(input: CompleteInput, requestOptions?: RequestOptions): Promise<CompleteResult> {
        const res = await this.client.completions.create(
            {
                model: "gpt-3.5-turbo-instruct",
                messages: input.messages,
                prompt: input.prompt,
                ...input.configure,
            },
            requestOptions
        );

        return {
            choices: res.choices.map((c) => ({ content: c.text, type: c.finish_reason })),
            raw: { choices: res.choices, created: res.created },
        };
    }

    override async chat(input: ChatInput, requestOptions?: RequestOptions): Promise<ChatResult> {
        const res = await this.client.chat.completions.create(
            {
                tool_choice: "auto",
                model: "chatgpt-4o-latest",
                messages: input.messages,
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
                            description: t.description,
                            strict: true,
                        },
                    })),
                response_format: input.responseFormat
                    ? OpenAIProvider.parseFormat(input.responseFormat)
                    : undefined,
                ...input.configure,
            },
            requestOptions
        );

        return {
            responseMessages: res.choices.map<Message>((c) => ({
                role: c.message.role,
                textContent: c.message.content || "",
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

    async createFile(input: CreateFileInput, requestOptions?: RequestOptions): Promise<CreateFileResult> {
        const res = await this.client.files.create(
            {
                purpose: input.usage || "assistants",
                file: input.file,
                ...input.configure,
            },
            requestOptions
        );

        return { fileId: res.id, raw: res };
    }

    async deleteFile(input: DeleteFileInput, requestOptions?: RequestOptions): Promise<DeleteFileResult> {
        const res = await this.client.files.del(input.fileId, requestOptions);
        return { raw: res };
    }

    // -- Assistants

    override async listAssistants(
        input: ListAssistantsInput,
        requestOptions?: RequestOptions
    ): Promise<ListAssistantsResult<OpenAIAssistant>> {
        const res = await this.client.beta.assistants.list(
            {
                limit: input.query?.limit,
                after: input.query?.after,
                before: input.query?.before,
                order: input.query?.order as "asc" | "desc",
            },
            requestOptions
        );

        return { assistants: res.data.map((a) => new OpenAIAssistant(a.id, this)), raw: res };
    }

    assistantTool(tools: Tool[] | Tool): AssistantTool[] {
        if (!Array.isArray(tools)) tools = [tools];

        return tools.map<AssistantTool>((t) => {
            if (t.type === "function")
                return {
                    function: {
                        parameters: t.schema as any,
                        description: t.description,
                        name: t.name,
                        strict: true,
                    },
                    type: "function",
                };

            return { type: t.type, ...t.configure };
        });
    }

    override async createAssistant(
        input: CreateAssistantInput,
        requestOptions?: RequestOptions
    ): Promise<CreateAssistantResult<OpenAIAssistant>> {
        const res = await this.client.beta.assistants.create(
            {
                model: input.model || "gpt-4-o",
                description: input.description,
                name: input.name,
                instructions: input.instructions,
                metadata: input.metadata,
                tools: input.tools && this.assistantTool(input.tools),
                tool_resources: input.resources,
                ...input.configure,
            },
            requestOptions
        );

        return { assistant: new OpenAIAssistant(res.id, this, res.metadata || {}), raw: res };
    }

    override async getAssistant(
        input: GetAssistantInput,
        requestOptions?: RequestOptions
    ): Promise<GetAssistantResult<OpenAIAssistant>> {
        const res = await this.client.beta.assistants.retrieve(input.assistantId, requestOptions);

        return { assistant: new OpenAIAssistant(res.id, this, res.metadata || {}), raw: res };
    }
    override async updateAssistant(
        input: UpdateAssistantInput,
        requestOptions?: RequestOptions
    ): Promise<UpdateAssistantResult<OpenAIAssistant>> {
        const data = input.data;
        const res = await this.client.beta.assistants.update(
            input.assistantId,
            {
                instructions: data.instructions,
                description: data.description,
                metadata: data.metadata,
                name: data.name,
                tools: data.tools && this.assistantTool(data.tools),
                tool_resources: data.resources,
                model: data.model,
                ...input.configure,
            },
            requestOptions
        );

        return { assistant: new OpenAIAssistant(input.assistantId, this), raw: res };
    }
    override async deleteAssistant(
        input: DeleteAssistantInput,
        requestOptions?: RequestOptions
    ): Promise<DeleteAssistantResult> {
        const res = await this.client.beta.assistants.del(input.assistantId, requestOptions);
        return { deleted: true, raw: res };
    }

    // -- Vector Stores

    async createVectorStore(
        input: CreateVectorStoreInput,
        requestOptions?: RequestOptions
    ): Promise<CreateVectorStoreResult> {
        const res = await this.client.beta.vectorStores.create(
            {
                name: input.name,
                file_ids: input.files,
                ...input.configure,
            },
            requestOptions
        );

        return { id: res.id, raw: res };
    }

    async deleteVectorStore(
        input: DeleteVectorStoreInput,
        requestOptions?: RequestOptions
    ): Promise<DeleteVectorStoreResult> {
        const res = await this.client.beta.vectorStores.del(input.id, requestOptions);
        return { deleted: true, raw: res };
    }

    async listVectorStores(
        input: ListVectorStoresInput,
        requestOptions?: RequestOptions
    ): Promise<ListVectorStoresResult> {
        const res = await this.client.beta.vectorStores.list(
            {
                limit: input.query?.limit,
                after: input.query?.after,
                before: input.query?.before,
                order: input.query?.order as "asc" | "desc",
            },
            requestOptions
        );

        return { stores: res.data.map((d) => ({ id: d.id, name: d.name })), raw: res };
    }

    async getVectorStore(
        input: GetVectorStoreInput,
        requestOptions?: RequestOptions
    ): Promise<GetVectorStoreResult> {
        const res = await this.client.beta.vectorStores.retrieve(input.id, requestOptions);
        return { store: { id: res.id, name: res.name }, raw: res };
    }

    async updateVectorStore(
        input: UpdateVectorStoreInput,
        requestOptions?: RequestOptions
    ): Promise<UpdateVectorStoreResult> {
        const res = await this.client.beta.vectorStores.update(input.id, input.data, requestOptions);
        return { updated: true, raw: res };
    }

    async getVectorStoreFile(
        input: GetVectorStoreFileInput,
        requestOptions?: RequestOptions
    ): Promise<GetVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.retrieve(
            input.storeId,
            input.fileId,
            requestOptions
        );
        return { createdAt: res.created_at, raw: res };
    }

    async deleteVectorStoreFile(
        input: DeleteVectorStoreFileInput,
        requestOptions?: RequestOptions
    ): Promise<DeleteVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.del(
            input.storeId,
            input.fileId,
            requestOptions
        );
        return { deleted: true, raw: res };
    }

    async createVectorStoreFile(
        input: CreateVectorStoreFileInput,
        requestOptions?: RequestOptions & {
            pollIntervalMs?: number;
        }
    ): Promise<CreateVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.uploadAndPoll(
            input.storeId,
            input.file,
            requestOptions
        );

        return { fileId: res.id, raw: res };
    }

    async listVectorStoreFiles(
        input: ListVectorStoreFilesInput,
        requestOptions?: RequestOptions
    ): Promise<ListVectorStoreFilesResult> {
        const res = await this.client.beta.vectorStores.files.list(
            input.storeId,
            {
                limit: input.query?.limit,
                after: input.query?.after,
                before: input.query?.before,
                order: input.query?.order as "asc" | "desc",
                ...input.configure,
            },
            requestOptions
        );

        return { fileIds: res.data.map((d) => d.id), raw: res };
    }

    async addVectorStoreFile(
        input: AddVectorStoreFileInput,
        requestOptions?: RequestOptions
    ): Promise<AddVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.createAndPoll(
            input.storeId,
            { file_id: input.fileId, ...input.configure },
            requestOptions
        );
        return { added: true, raw: res };
    }
}
