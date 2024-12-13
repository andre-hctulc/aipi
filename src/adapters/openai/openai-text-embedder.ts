import { TextEmbedder, type TextEmbeddingOptions } from "../../embeddings/text-embedder.js";
import type { Vector } from "../../embeddings/types.js";
import { OpenAIProvider } from "./openai-provider.js";
import type { CommonOpenAIOptions } from "./types.js";

interface OpenAIEmbeddingOptions extends TextEmbeddingOptions, CommonOpenAIOptions {
    dimensions?: number;
}

export class OpenAITextEmbedder extends TextEmbedder {
    private provider!: OpenAIProvider;

    override onMount() {
        this.provider = this.app.require(OpenAIProvider);
    }

    override async embed(text: string[], options?: OpenAIEmbeddingOptions): Promise<Vector[]> {
        const { data } = await this.provider.client.embeddings.create(
            {
                input: text,
                model: options?.model || "gpt-4",
                user: options?.user,
                dimensions: options?.dimensions,
            },
            options?.requestOptions
        );

        return data.map((e) => e.embedding);
    }
}
