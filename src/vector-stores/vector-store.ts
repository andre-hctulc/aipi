import type { Vector, CommonQueryOptions } from "../types";

/**
 * @template S Search object
 */
export abstract class VectorStore<S extends object = any> {
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