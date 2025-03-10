import { Tokenizer, type Token, type TokenizeOptions } from "../../nl/tokenizer.js";
import { NlpJSLangProcessorProvider } from "./nlpjs-lang-processor-provider.js";
// @ts-ignore
import { getTokenizer } from "@nlpjs/lang-all";

/**
 * Splits given text into sentence
 */
export class NlpJSTokenizer extends Tokenizer {
    // private langProcessor!: NlpJSLangProcessorProvider;

    // override onMount() {
    //     this.langProcessor = this.app.require(NlpJSLangProcessorProvider);
    // }

    // BUG splits into words not sentences
    override tokenize(text: string, options?: TokenizeOptions): Token[] {
        const tokenizer = getTokenizer(options?.lang);
        const sentences: string[] = tokenizer.tokenize(text);
        const ranges = this.getSentenceRanges(text, sentences);

        return sentences.map<Token>((sentence: string, i) => ({
            tag: "sentence",
            text: sentence,
            range: ranges[i],
            children: [],
        }));
    }

    private getSentenceRanges(text: string, sentences: string[]) {
        const ranges: [number, number][] = [];
        let start = 0;

        sentences.forEach((sentence) => {
            const end = text.indexOf(sentence, start) + sentence.length;
            ranges.push([start, end]);
            start = end;
        });

        return ranges;
    }
}
