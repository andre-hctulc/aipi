import OpenAI from "openai";
import { Provider } from "../../providers/provider.js";
import type { ClientOptions } from "openai";

export class OpenAIProvider extends Provider {
    readonly client: OpenAI;

    constructor(client: ClientOptions) {
        super();
        this.client = client instanceof OpenAI ? client : new OpenAI(client);
    }
}
