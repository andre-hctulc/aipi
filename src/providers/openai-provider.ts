import { ChatCompletionTool } from "openai/resources";
import { OpenAIAssistants } from "../assistants/openai-assistants";
import { MetaDescription } from "../types/types";
import {
    ChatInput,
    ChatResult,
    CompleteInput,
    CompleteResult,
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
        const res = await this.client.embeddings.create({
            ...input.configure,
            input: input.content,
            model: this.model(meta.model),
            user: meta.user,
        });

        return { vectors: res.data.map((d) => d.embedding) };
    }

    async complete(input: CompleteInput, meta: MetaDescription = {}): Promise<CompleteResult> {
        const res = await this.client.completions.create({
            ...input.configure,
            model: this.model(meta.model),
            messages: input.messages,
            user: meta.user,
            prompt: input.prompt,
        });

        return {
            choices: res.choices.map((c) => ({ content: c.text, type: c.finish_reason })),
            raw: { choices: res.choices, created: res.created },
        };
    }

    async chat(input: ChatInput, meta: MetaDescription = {}): Promise<ChatResult> {
        const res = await this.client.chat.completions.create({
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
                        parameters: t.schema || {
                            type: "object",
                            properties: {},
                            additionalProperties: false,
                        },
                        description: t.description,
                        strict: true,
                    },
                })),
            prompt: input.prompt,
            response_format: meta.responseFormat
                ? { type: "json_schema", json_schema: meta.responseFormat }
                : { type: "text" },
        });

        return {
            choices: res.choices.map((c) => ({ content: c.message.content || "", type: c.finish_reason })),
            raw: { choices: res.choices, created: res.created },
        };
    }
}
