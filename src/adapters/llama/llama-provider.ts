import { getLlama, type Llama, type LlamaModel, type LlamaModelOptions } from "node-llama-cpp";
import { Provider } from "../../providers/provider.js";

export class LlamaProvider extends Provider {
    llama!: Llama;
    model!: LlamaModel;

    constructor(private options: LlamaModelOptions) {
        super();
    }

    override async onMount(): Promise<void> {
        this.llama = await getLlama();
        this.model = await this.llama.loadModel(this.options);
    }
}
