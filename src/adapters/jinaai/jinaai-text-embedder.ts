import { TextEmbedder, type TextEmbedInput } from "../../embeddings/text-embedder.js";
import type { Vector } from "../../embeddings/types.js";
import type { BaseOptions } from "../../types/index.js";
import { JinaAIProvider } from "./jinaai-provider.js";

export interface JinaAITextEmbedParams {
    model?: "jina-embeddings-v3" | (string & {});
    task?:
        | "text-matching"
        | "none"
        | "classification"
        | "separation"
        | "retrieval.query"
        | "retrieval.passage"
        | (string & {});
    late_chunking?: boolean;
    dimensions?: number;
    embedding_type?: string;
}

export class JinaAITextEmbedder extends TextEmbedder {
    static readonly MAX_TOKENS = Object.seal({
        "jina-embeddings-v3": 8192,
    });

    private provider!: JinaAIProvider;

    protected override onMount() {
        this.provider = this.app.require(JinaAIProvider);
    }

    override async embed(
        input: TextEmbedInput<JinaAITextEmbedParams>,
        options?: BaseOptions
    ): Promise<Vector[]> {
        // Request body
        const requestBody = {
            model: "jina-embeddings-v3",
            task: "text-matching",
            late_chunking: false,
            dimensions: 1024,
            embedding_type: "float",
            ...input?.params,
            input: Array.isArray(input.text) ? input.text : [input.text],
        };

        // Making the HTTP POST request
        const response = await this.provider.fetch("/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();

        return responseData.data?.map((item: any) => item?.embedding || []) || [];
    }
}
