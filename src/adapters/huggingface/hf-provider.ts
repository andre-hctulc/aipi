import { Provider } from "../../providers/provider.js";
import { HfInference } from "@huggingface/inference";

export class HFProvider extends Provider {
    readonly hf: HfInference;

    constructor(accessToken: string, options?: any) {
        super();
        this.hf = new HfInference(accessToken, options);
    }
}
