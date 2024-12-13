import { Resource } from "../app/resource.js";
import type { Vector } from "../embeddings/types.js";
import type { CommonQueryOptions } from "../types/query-options.js";

/**
 * @template S Search object
 */
export abstract class VectorStore<S extends object = any> extends Resource {
    abstract getVector(id: string): Promise<Vector | null>;
    abstract setVector(id: string, vector: Vector, additionalField?: any): Promise<void>;
    abstract deleteVector(id: string): Promise<void>;
    abstract listVectors(search: S, queryOptions: CommonQueryOptions): Promise<Vector[]>;

    async getOrCreate(id: string, create: () => Vector | Promise<Vector>): Promise<Vector> {
        let vect = await this.getVector(id);
        if (vect) return vect;
        vect = await create();
        await this.setVector(id, vect);
        return vect;
    }
}
