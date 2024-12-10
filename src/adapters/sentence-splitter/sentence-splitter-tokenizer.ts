import { split, splitAST, type splitOptions } from "sentence-splitter";
import { Splitter, type TextPart } from "../../nl/splitter.js";

/**
 * A `Tokenizer` implementation using the `sentence-splitter` package.
 */
export class SentenceSplitterTokenizer extends Splitter {
    constructor(private options?: splitOptions) {
        super();
    }

    override tokenize(text: string, options?: splitOptions): TextPart[] {
        return split(text, options || this.options).map((value) => ({
            tag: this.snakeCase(value.type),
            value: value.raw,
        }));
    }

    private snakeCase(camelCase: string): string {
        return camelCase.replace(/([A-Z])/g, "_$1").toLowerCase();
    }

    /**
     * Exposes the {@link split} function from the `sentence-splitter` package.
     */
    readonly split = split;

    /**
     * Exposes the {@link splitAST} function from the `sentence-splitter` package.
     */
    readonly splitAST = splitAST;
}
