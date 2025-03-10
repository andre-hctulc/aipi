import { Completer, type CompleteOptions, type CompleteResult } from "../../chats/completer.js";
import { HFProvider } from "./hf-provider.js";

export class HFCompleter extends Completer {
    private provider!: HFProvider;

    protected override onMount() {
        this.provider = this.app.require(HFProvider);
    }

    override async complete(text: string, options?: CompleteOptions<any>): Promise<CompleteResult> {
        const { generated_text, details } = await this.provider.main.textGeneration(
            { inputs: text },
            options?.params
        );
        return { choices: [generated_text], toolMatches: [] };
    }
}
