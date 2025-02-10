import WTokenizer from "wink-tokenizer";
import { Splitter, type Segment } from "../../nl/splitter.js";

/**
 * A `Tokenizer` implementation using `the wink-tokenizer` package.
 */
export class WinkTokenizer extends Splitter {
    private instance = new WTokenizer();

    override tokenize(text: string): Segment[] {
        return this.instance.tokenize(text).map((token) => ({
            text: token.value,
            range: [0, 0],
            children: [],
            tag: token.tag,
        }));
    }
}
