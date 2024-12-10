import { Resource } from "../app/index.js";

export type TextPartTag =
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
    | "date"
    | "abbreviation"
    | "quoted_phrase"
    | "ordinal"
    | "character";

export interface TextPart {
    tag: (string & {}) | TextPartTag;
    value: string;
}

/**
 * Base class for all kinds of tokenizers or other text splitters.
 */
export abstract class Splitter extends Resource {
    abstract tokenize(text: string): TextPart[];
}
