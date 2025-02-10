import { SentenceTokenizer } from "natural/lib/natural/index.js";
import { Splitter, type Segment } from "../../nl/splitter.js";

export class NaturalSentenceTokenizer extends Splitter {
    private instance: SentenceTokenizer;

    constructor(abbreviations: string[] = [], sentenceDemarkers?: string[]) {
        super();
        this.instance = new SentenceTokenizer(abbreviations, sentenceDemarkers);
    }

    override tokenize(text: string): Segment[] {
        return this.instance
            .tokenize(text)
            .map((value) => ({ tag: "sentence", value, children: [], range: [0, 0], text: value }));
    }
}
