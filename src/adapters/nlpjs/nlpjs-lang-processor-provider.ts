// @ts-ignore
import { Language } from "node-nlp";
import { Provider } from "../../providers/provider.js";

export class NlpJSLangProcessorProvider extends Provider<Language> {
    constructor() {
        super();
    }

    protected override provide(): Language {
        return new Language();
    }
}
