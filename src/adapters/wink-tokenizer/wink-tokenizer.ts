import WTokenizer from "wink-tokenizer";
import { Splitter, type TextPart } from "../../nl/splitter.js";

/**
 * A `Tokenizer` implementation using `the wink-tokenizer` package.
 */
export class WinkTokenizer extends Splitter {
    private instance = new WTokenizer();

    override tokenize(text: string): TextPart[] {
        return this.instance.tokenize(text);
    }
}
