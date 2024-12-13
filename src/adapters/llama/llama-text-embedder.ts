import type { LlamaEmbeddingContext } from "node-llama-cpp";
import { TextEmbedder, type TextEmbeddingOptions } from "../../embeddings/text-embedder.js";
import type { Vector } from "../../embeddings/types.js";
import { LlamaProvider } from "./llama-provider.js";

interface LlamaEmbeddingOptions extends TextEmbeddingOptions {
    /**
     * @default true
     */
    parallel?: boolean;
}

export class LlamaTextEmbedder extends TextEmbedder {
    private provider!: LlamaProvider;
    private context!: LlamaEmbeddingContext;

    override async onMount() {
        this.provider = this.app.require(LlamaProvider);
        this.context = await this.provider.model.createEmbeddingContext();
    }

    override async embed(text: string[], options?: LlamaEmbeddingOptions): Promise<Vector[]> {
        if (options?.parallel === false) {
            const vectors: Vector[] = [];

            for (const t of text) {
                const emb = await this.context.getEmbeddingFor(t);
                vectors.push(emb.vector);
            }

            return vectors;
        }

        return Promise.all(
            text.map(async (text) => {
                const emb = await this.context.getEmbeddingFor(text);
                return emb.vector;
            })
        );
    }
}
