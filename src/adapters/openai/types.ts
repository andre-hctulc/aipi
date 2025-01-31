import type { RequestOptions } from "openai/core.mjs";

export interface CommonOpenAIOptions {
    params?: {
        model?: string;
        user?: string;
        requestOptions?: RequestOptions;
    };
}
