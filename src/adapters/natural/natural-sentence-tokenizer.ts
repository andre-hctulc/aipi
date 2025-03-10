import { SentenceTokenizer } from "natural/lib/natural/index.js";
import { Tokenizer, type Token } from "../../nl/tokenizer.js";

export class NaturalSentenceTokenizer extends Tokenizer {
    private instance: SentenceTokenizer;

    constructor(abbreviations: string[] = [], sentenceDemarkers?: string[]) {
        super();
        this.instance = new SentenceTokenizer(abbreviations, sentenceDemarkers);
    }

    override tokenize(text: string): Token[] {
        return this.instance
            .tokenize(text)
            .map((value) => ({ tag: "sentence", value, children: [], range: [0, 0], text: value }));
    }
}
