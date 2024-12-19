import { Provider } from "../../providers/provider.js";
import { HfInference, type Options } from "@huggingface/inference";

export class HuggingfaceProvider extends Provider {
    readonly hf: HfInference;

    constructor(accessToken: string, options?: Options) {
        super();
        this.hf = new HfInference(accessToken, options);
    }
}
