import { LangGuesser, type LangGuess, type LangGuessOptions } from "../../nl/lang-guesser.js";
import { NlpJSLangProcessorProvider } from "./nlpjs-lang-processor-provider.js";

export class NlpJSLangGuesser extends LangGuesser {
    private langProcessor!: NlpJSLangProcessorProvider;

    override onMount() {
        this.langProcessor = this.app.require(NlpJSLangProcessorProvider);
    }

    override guess(text: string, options?: LangGuessOptions): LangGuess {
        // text, allowLangs, numGuesses
        return this.langProcessor.main.guess(text, options?.allowLangs ?? null, 1)[0];
    }
}
