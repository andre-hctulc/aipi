import { Completer, type CompleteOptions, type CompleteResult } from "../../chats/completer.js";
import type { CommonOpenAIOptions } from "./types.js";
import { OpenAIProvider } from "./openai-provider.js";

export class OpenAICompleter extends Completer {
    private provider!: OpenAIProvider;

    override onMount() {
        this.provider = this.app.require(OpenAIProvider);
    }

    override async complete(
        text: string,
        options?: CompleteOptions & CommonOpenAIOptions
    ): Promise<CompleteResult> {
        const res = await this.provider.main.completions.create(
            {
                model: options?.params?.model ?? "gpt-3.5-turbo-instruct",
                prompt: text,
                n: options?.choices,
                user: options?.params?.user,
            },
            options?.params?.requestOptions
        );

        return {
            toolMatches: [],
            choices: res.choices.map((c) => c.text),
        };
    }
}
