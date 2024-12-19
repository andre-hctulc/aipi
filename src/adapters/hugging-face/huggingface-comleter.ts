import { Completer, type CompleteOptions, type CompleteResult } from "../../chats/completer.js";
import { HuggingfaceProvider } from "./huggingface-provider.js";
import type { CommonHFOptions } from "./types.js";

export class HuggingFaceCompleter extends Completer {
    private provider!: HuggingfaceProvider;

    protected override onMount() {
        this.provider = this.app.require(HuggingfaceProvider);
    }

    override async complete(
        text: string,
        options?: CommonHFOptions & CompleteOptions
    ): Promise<CompleteResult> {
        const { generated_text, details } = await this.provider.hf.textGeneration(
            { inputs: text },
            options?.params
        );
        return { choices: [generated_text], toolMatches: [] };
    }
}
