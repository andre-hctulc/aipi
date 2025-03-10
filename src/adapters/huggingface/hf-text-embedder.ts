import { TextEmbedder, type TextEmbedInput, type Vector } from "../../embeddings/index.js";
import type { BaseOptions } from "../../types/types.js";
import { HFProvider } from "./hf-provider.js";

export class HFTextEmbedder extends TextEmbedder {
    private provider!: HFProvider;

    protected override onMount() {
        this.provider = this.app.require(HFProvider);
    }

    override async embed({ text, ...input }: TextEmbedInput, options?: BaseOptions<any>): Promise<Vector[]> {
        const vectors = await this.provider.main.featureExtraction({ inputs: text, ...input.params }, {});
        return vectors as Vector[];
    }
}
