import { AipiError } from "../aipi-error";
import { OpenAIProvider } from "./openai-provider";

const ProvidersMap = {
    openai: new OpenAIProvider(),
};

export function findProvider(provider: string) {
    switch (provider) {
        case "openai":
            return ProvidersMap.openai;
    }

    throw new AipiError(`Provider ${provider} not found`);
}
