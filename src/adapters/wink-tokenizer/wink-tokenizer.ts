import WTokenizer from "wink-tokenizer";
import { Tokenizer, type Token } from "../../nl/tokenizer.js";

/**
 * A `Tokenizer` implementation using `the wink-tokenizer` package.
 */
export class WinkTokenizer extends Tokenizer {
    private instance = new WTokenizer();

    override tokenize(text: string): Token[] {
        return this.instance.tokenize(text).map((token) => ({
            text: token.value,
            range: [0, 0],
            children: [],
            tag: token.tag,
        }));
    }
}
