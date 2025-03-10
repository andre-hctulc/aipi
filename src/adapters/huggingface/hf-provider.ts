import { Provider } from "../../providers/provider.js";
import { HfInference } from "@huggingface/inference";

export class HFProvider extends Provider<HfInference> {
    #accessToken: string;
    #options: any;

    constructor(accessToken: string, options?: any) {
        super();
        this.#accessToken = accessToken;
        this.#options = options;
    }

    protected override provide(): unknown {
        const hf = new HfInference(this.#accessToken, this.#options);
        this.#options = undefined;
        return hf;
    }
}
