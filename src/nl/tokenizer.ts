import { Resource } from "../app/index.js";

export type TokenTag =
    | "sentence"
    | "word"
    | "punctuation"
    | "number"
    | "email"
    | "url"
    | "emoji"
    | "hashtag"
    | "mention"
    | "emoticon"
    | "symbol"
    | "currency"
    | "time"
    | "paragraph"
    | "date"
    | "abbreviation"
    | "quoted_phrase"
    | "ordinal"
    | "character";

export interface Token {
    tag: (string & {}) | TokenTag;
    text: string;
    range: [number, number] | readonly [number, number];
    children: Token[];
}

export interface TokenizeOptions {
    /**
     * alpha2
     */
    lang?: string;
}

/**
 * Base class for all kinds of tokenizers or other text splitters.
 */
export abstract class Tokenizer extends Resource {
    static icon = "🔪";

    abstract tokenize(text: string, options?: TokenizeOptions): Token[];
}
