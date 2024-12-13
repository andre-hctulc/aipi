import type { RequestOptions } from "openai/core.mjs";

export interface CommonOpenAIOptions {
    model?: string;
    user?: string;
    requestOptions?: RequestOptions;
}
