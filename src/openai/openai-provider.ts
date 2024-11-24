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
import { CommonQueryOptions } from "../types";

export interface CompleteResult extends Result {
    choices: { content: string; type: string }[];
}

export interface CompleteInput extends Input {
    messages?: Message[];
    prompt: string;
}

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

    constructor(options: ClientOptions) {
        super();
        this.client = new OpenAI(options);
    }

    static parseResponse(response: MetaDescription["response"]) {
        if (response?.jsonMode) return { type: "json_object" };

        if (response?.schema) {
            return {
                type: "json_object",
                json_schema: {
                    schema: response.schema,
                    strict: true,
                    description: response.format,
                    name: "response_object",
                },
            };
        }

        return { type: "text" };
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
                response_format: OpenAIProvider.parseResponse(meta.response),
                ...input.configure,
            },
            meta.request
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

        return tools.map<AssistantTool>((t) => {
            if (t.type === "function")
                return {
                    function: {
                        parameters: t.schema as any,
                        description: t.trigger,
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
        meta: MetaDescription = {}
    ): Promise<CreateAssistantResult<OpenAIAssistant>> {
        const res = await this.client.beta.assistants.create(
            {
                model: input.model || meta.model || "gpt-4-o",
                description: input.description,
                name: input.name,
                instructions: input.instructions,
                metadata: input.metadata,
                response_format: OpenAIProvider.parseResponse(meta.response),
                tools: input.tools && this.assistantTool(input.tools),
                tool_resources: input.resources,
                ...input.configure,
            },
            meta.request
        );

        return { assistant: new OpenAIAssistant(res.id, this, res.metadata || {}), raw: res };
    }

    override async getAssistant(
        input: GetAssistantInput,
        meta: MetaDescription = {}
    ): Promise<GetAssistantResult<OpenAIAssistant>> {
        const res = await this.client.beta.assistants.retrieve(input.assistantId, meta.request);

        return { assistant: new OpenAIAssistant(res.id, this, res.metadata || {}), raw: res };
    }
    override async updateAssistant(
        input: UpdateAssistantInput,
        meta: MetaDescription = {}
    ): Promise<UpdateAssistantResult<OpenAIAssistant>> {
        const data = input.data;
        const res = await this.client.beta.assistants.update(
            input.assistantId,
            {
                instructions: data.instructions,
                description: data.description,
                metadata: data.metadata,
                response_format: OpenAIProvider.parseResponse(meta.response),
                name: data.name,
                tools: data.tools && this.assistantTool(data.tools),
                tool_resources: data.resources,
                model: data.model,
                ...input.configure,
            },
            meta.request
        );

        return { assistant: new OpenAIAssistant(input.assistantId, this), raw: res };
    }
    override async deleteAssistant(
        input: DeleteAssistantInput,
        meta: MetaDescription = {}
    ): Promise<DeleteAssistantResult> {
        const res = await this.client.beta.assistants.del(input.assistantId, meta.request);
        return { deleted: true, raw: res };
    }

    // -- Vector Stores

    async createVectorStore(
        input: CreateVectorStoreInput,
        meta: MetaDescription = {}
    ): Promise<CreateVectorStoreResult> {
        const res = await this.client.beta.vectorStores.create(
            {
                name: input.name,
                file_ids: input.files,
                ...input.configure,
            },
            meta.request
        );

        return { id: res.id, raw: res };
    }

    async deleteVectorStore(
        input: DeleteVectorStoreInput,
        meta: MetaDescription = {}
    ): Promise<DeleteVectorStoreResult> {
        const res = await this.client.beta.vectorStores.del(input.id, meta.request);
        return { deleted: true, raw: res };
    }

    async listVectorStores(
        input: ListVectorStoresInput,
        meta: MetaDescription = {}
    ): Promise<ListVectorStoresResult> {
        const res = await this.client.beta.vectorStores.list(
            {
                limit: input.query?.limit,
                after: input.query?.after,
                before: input.query?.before,
                order: input.query?.order as "asc" | "desc",
            },
            meta.request
        );

        return { stores: res.data.map((d) => ({ id: d.id, name: d.name })), raw: res };
    }

    async getVectorStore(
        input: GetVectorStoreInput,
        meta: MetaDescription = {}
    ): Promise<GetVectorStoreResult> {
        const res = await this.client.beta.vectorStores.retrieve(input.id, meta.request);
        return { store: { id: res.id, name: res.name }, raw: res };
    }

    async updateVectorStore(
        input: UpdateVectorStoreInput,
        meta: MetaDescription = {}
    ): Promise<UpdateVectorStoreResult> {
        const res = await this.client.beta.vectorStores.update(input.id, input.data, meta.request);
        return { updated: true, raw: res };
    }

    async getVectorStoreFile(
        input: GetVectorStoreFileInput,
        meta: MetaDescription = {}
    ): Promise<GetVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.retrieve(
            input.storeId,
            input.fileId,
            meta.request
        );
        return { createdAt: res.created_at, raw: res };
    }

    async deleteVectorStoreFile(
        input: DeleteVectorStoreFileInput,
        meta: MetaDescription = {}
    ): Promise<DeleteVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.del(input.storeId, input.fileId, meta.request);
        return { deleted: true, raw: res };
    }

    async createVectorStoreFile(
        input: CreateVectorStoreFileInput,
        meta: MetaDescription = {}
    ): Promise<CreateVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.uploadAndPoll(input.storeId, input.file, {
            ...meta.request,
            pollIntervalMs: meta.pollInterval,
        });

        return { fileId: res.id, raw: res };
    }

    async listVectorStoreFiles(
        input: ListVectorStoreFilesInput,
        meta: MetaDescription = {}
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
            meta.request
        );

        return { fileIds: res.data.map((d) => d.id), raw: res };
    }

    async addVectorStoreFile(
        input: AddVectorStoreFileInput,
        meta: MetaDescription = {}
    ): Promise<AddVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.createAndPoll(
            input.storeId,
            { file_id: input.fileId, ...input.configure },
            meta.request
        );
        return { added: true, raw: res };
    }
}
