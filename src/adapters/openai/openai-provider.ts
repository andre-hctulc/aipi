import OpenAI, { type ClientOptions } from "openai";
import { Provider } from "../../providers/provider.js";

export class OpenAIProvider extends Provider {
    readonly client: OpenAI;

    constructor(client: ClientOptions) {
        super();
        this.client = client instanceof OpenAI ? client : new OpenAI(client);
    }
}
