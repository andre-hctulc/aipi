import type { ChatCompletionTool, FunctionParameters } from "openai/resources";
import { OpenAIAssistants } from "../assistants/openai-assistants";
import { MetaDescription, ToolMatch } from "../types/types";
import {
    ChatInput,
    ChatResult,
    CompleteInput,
    CompleteResult,
    CreateFileInput,
    CreateFileResult,
    DeleteFileInput,
    DeleteFileResult,
    EmbedInput,
    EmbedResult,
    Provider,
} from "./provider";
import OpenAI, { ClientOptions } from "openai";

export class OpenAIProvider extends Provider {
    readonly client: OpenAI;

    constructor(options: ClientOptions) {
        super();
        this.client = new OpenAI(options);
    }

    private model(model: any): string {
        if (!model) return "text-embedding-3-small";
        return model;
    }

    supportAssistants() {
        return new OpenAIAssistants(this);
    }

    async embed(input: EmbedInput, meta: MetaDescription = {}): Promise<EmbedResult> {
        const res = await this.client.embeddings.create(
            {
                ...input.configure,
                input: input.content,
                model: this.model(meta.model),
                user: meta.user,
            },
            meta.request
        );

        return { vectors: res.data.map((d) => d.embedding) };
    }

    async complete(input: CompleteInput, meta: MetaDescription = {}): Promise<CompleteResult> {
        const res = await this.client.completions.create(
            {
                ...input.configure,
                model: this.model(meta.model),
                messages: input.messages,
                user: meta.user,
                prompt: input.prompt,
            },
            meta.request
        );

        return {
            choices: res.choices.map((c) => ({ content: c.text, type: c.finish_reason })),
            raw: { choices: res.choices, created: res.created },
        };
    }

    async chat(input: ChatInput, meta: MetaDescription = {}): Promise<ChatResult> {
        const res = await this.client.chat.completions.create(
            {
                tool_choice: "auto",
                ...input.configure,
                model: this.model(meta.model),
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
            },
            meta.request
        );

        return {
            choices: res.choices.map((c) => ({
                content: c.message.content || "",
                type: c.finish_reason,
                triggeredTools:
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
                            error: err,
                        };
                    }) || [],
            })),
            raw: { choices: res.choices, created: res.created },
            triggeredTools: [],
        };
    }

    async createFile(input: CreateFileInput, meta: MetaDescription = {}): Promise<CreateFileResult> {
        const res = await this.client.files.create(
            {
                purpose: input.usage || "assistants",
                file: input.file,
                ...input.configure,
            },
            meta.request
        );

        return { fileId: res.id };
    }

    async deleteFile(input: DeleteFileInput, meta: MetaDescription = {}): Promise<DeleteFileResult> {
        await this.client.files.del(input.fileId, meta.request);
        return {};
    }
}
