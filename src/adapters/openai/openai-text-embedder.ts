import { TextEmbedder, type TextEmbedInput } from "../../embeddings/text-embedder.js";
import type { Vector } from "../../embeddings/types.js";
import { OpenAIProvider } from "./openai-provider.js";
import type { CommonOpenAIOptions } from "./types.js";

export class OpenAITextEmbedder extends TextEmbedder {
    private provider!: OpenAIProvider;

    override onMount() {
        this.provider = this.app.require(OpenAIProvider);
    }

    override async embed({ text, params }: TextEmbedInput, options?: CommonOpenAIOptions): Promise<Vector[]> {
        const { data } = await this.provider.client.embeddings.create(
            {
                input: text,
                model: options?.params?.model || "gpt-4",
                user: options?.params?.user,
                ...options?.params,
            },
            options?.params?.requestOptions
        );

        return data.map((e) => e.embedding);
    }
}
