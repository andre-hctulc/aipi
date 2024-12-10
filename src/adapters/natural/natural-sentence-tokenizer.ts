import { SentenceTokenizer } from "natural";
import { Splitter, type TextPart } from "../../nl/splitter.js";

export class NaturalSentenceTokenizer extends Splitter {
    private instance: SentenceTokenizer;

    constructor(abbreviations: string[] = [], sentenceDemarkers?: string[]) {
        super();
        this.instance = new SentenceTokenizer(abbreviations, sentenceDemarkers);
    }

    override tokenize(text: string): TextPart[] {
        return this.instance.tokenize(text).map((value) => ({ tag: "sentence", value }));
    }
}
