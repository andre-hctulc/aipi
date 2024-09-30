import { OpenAIAssistants } from "../assistants/openai-assistants";
import { MetaDescription } from "../types";
import {
    ChatInput,
    ChatResult,
    CompleteInput,
    CompleteResult,
    EmbedInput,
    EmbedResult,
    Provider,
} from "./provider";
import OpenAI from "openai";

export const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIProvider extends Provider {
    readonly client = client;

    constructor() {
        super();
    }

    private model(model: any): string {
        if (!model) return "text-embedding-3-small";
        return model;
    }

    supportAssistants() {
        return new OpenAIAssistants(this);
    }

    async embed(input: EmbedInput, meta: MetaDescription): Promise<EmbedResult> {
        const res = await client.embeddings.create({
            ...input.configure,
            input: input.content,
            model: this.model(meta.model),
            user: meta.user,
        });

        return { vectors: res.data.map((d) => d.embedding) };
    }

    async complete(input: CompleteInput, meta: MetaDescription): Promise<CompleteResult> {
        const res = await client.completions.create({
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

    async chat(input: ChatInput, meta: MetaDescription): Promise<ChatResult> {
        const res = await client.chat.completions.create({
            tool_choice: "auto",
            ...input.configure,
            model: this.model(meta.model),
            messages: input.messages,
            user: meta.user,
            tools: input.tools,
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
