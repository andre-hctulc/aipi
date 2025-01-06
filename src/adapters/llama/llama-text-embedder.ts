import type { LlamaEmbeddingContext } from "node-llama-cpp";
import { TextEmbedder, type TextEmbedInput } from "../../embeddings/text-embedder.js";
import type { Vector } from "../../embeddings/types.js";
import { LlamaProvider } from "./llama-provider.js";
import type { BaseOptions } from "../../types/types.js";

export class LlamaTextEmbedder extends TextEmbedder {
    private provider!: LlamaProvider;
    private context!: LlamaEmbeddingContext;

    override async onMount() {
        this.provider = this.app.require(LlamaProvider);
        this.context = await this.provider.model.createEmbeddingContext();
    }

    override async embed(
        { text }: TextEmbedInput,
        options?: BaseOptions<{ parallel?: boolean }>
    ): Promise<Vector[]> {
        if (!Array.isArray(text)) {
            text = [text];
        }

        if (options?.params?.parallel === false) {
            const vectors: Vector[] = [];

            for (const t of text) {
                const emb = await this.context.getEmbeddingFor(t);
                vectors.push(emb.vector);
            }

            return vectors;
        }

        const vectors = await Promise.all(
            text.map(async (text) => {
                const emb = await this.context.getEmbeddingFor(text);
                return emb.vector;
            })
        );

        return vectors;
    }
}
