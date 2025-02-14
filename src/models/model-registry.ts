import { Resource } from "../app/index.js";
import type { AIModelMetadata } from "./models-types.js";

/**
 * A simple registry for models metadata
 */
export class ModelsRegistry extends Resource {
    private map: Map<string, Partial<AIModelMetadata>> = new Map();

    constructor() {
        super();
    }

    clear() {
        this.map.clear();
    }

    forgetModel(modelRef: string) {
        this.map.delete(modelRef);
    }

    findModel(modelRef: string): Partial<AIModelMetadata> | null {
        const metadata = this.map.get(modelRef);
        if (!metadata) {
            return null;
        }
        return metadata;
    }

    hasModel(modelRef: string): boolean {
        return this.map.has(modelRef);
    }

    registerModel(metadata: Partial<AIModelMetadata>) {
        if (!metadata.model_ref) {
            throw new Error("Model reference is required");
        }
        this.map.set(metadata.model_ref, metadata);
    }

    registerModels(...models: Partial<AIModelMetadata>[]) {
        models.forEach((metadata) => this.registerModel(metadata));
    }

    findMany(...modelRefs: string[]): Partial<AIModelMetadata>[] {
        return modelRefs.map((model) => {
            const metadata = this.findModel(model);
            if (!metadata) {
                throw new Error(`Model not found: ${model}`);
            }
            return metadata;
        });
    }

    get(modelRef: string): Partial<AIModelMetadata> | null {
        const metadata = this.findModel(modelRef);
        if (!metadata) return null;
        return metadata;
    }
}
