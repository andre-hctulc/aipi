import {
    split,
    splitAST,
    type splitOptions,
    type TxtParentNodeWithSentenceNodeContent,
} from "sentence-splitter";
import { Tokenizer, type Token, type TokenizeOptions } from "../../nl/tokenizer.js";

/**
 * A `Tokenizer` implementation using the `sentence-splitter` package.
 */
export class SentenceSplitterTokenizer extends Tokenizer {
    constructor(private options?: splitOptions) {
        super();
    }


    override tokenize(text: string, options?: TokenizeOptions & { params?: splitOptions }): Token[] {
        return split(text, options?.params || this.options).map((node) => this.parseNode(node));
    }

    private parseNode(node: TxtParentNodeWithSentenceNodeContent): Token {
        return {
            tag: this.snakeCase(node.type),
            text: node.raw,
            range: node.range,
            children: (node as any).children?.map((node: any) => this.parseNode(node)) || [],
        };
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
