// @ts-ignore
import {} from "node-nlp";
// @ts-ignore
import { Provider } from "../../providers/provider.js";

export class NlpJSManagerProvider extends Provider<undefined> {
    constructor() {
        super();
    }

    protected override provide(): undefined {
        // // Initialize NLP Manager with language support
        // return new NlpManager({
        //     languages: ["en", "fr", "es", "de", "zh", "ja"],
        //     nlu: { useNoneFeature: true }, // Optional: Configure the NLU behavior
        //     forceNER: true, // Optional: Forces Named Entity Recognition even if not trained
        //     autoSave: false, // Optional: Disables automatic saving
        //     autoLoad: false, // Optional: Disables automatic loading of the model
        //     nluByDomain: true, // Optional: Enables domain-specific NLU
        //     threshold: 0.7, // });
        // });
    }
}
