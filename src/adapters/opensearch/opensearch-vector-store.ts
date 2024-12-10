import type { CommonQueryOptions, Vector } from "../../types/index.js";
import { VectorStore } from "../../vector-stores/vector-store.js";
import type { Client } from "@opensearch-project/opensearch";

export interface OpenSearchVectorStoreConfig {
    /**
     * The name of the field to store the vector in
     * @default "vectors"
     */
    vectorFieldName?: string;
}

export class OpenSearchVectorStore extends VectorStore<any> {
    private vectorFieldName: string;

    constructor(
        // TODO OpenSearchClient?
        readonly client: Client,
        readonly index: string,
        config?: OpenSearchVectorStoreConfig
    ) {
        super();
        this.vectorFieldName = config?.vectorFieldName || "vector";
    }

    async getVector(id: string): Promise<Vector | null> {
        const res = await this.client.get({
            index: this.index,
            id,
            _source: [this.vectorFieldName],
        });
        return res.body._source?.[this.vectorFieldName] || null;
    }

    /**
     * Set a vector for a given id
     * @param refreshIndex Refresh the index immediately after setting the vector
     */
    async setVector(
        id: string,
        vector: Vector,
        additionalFields?: any,
        refreshIndex?: boolean
    ): Promise<void> {
        const doc = { ...additionalFields, [this.vectorFieldName]: vector };
        // update is upsert in OpenSearch
        await this.client.update({
            index: this.index,
            id,
            body: {
                doc,
                upsert: doc,
            },
        });

        // Refresh the index to make the document immediately searchable
        if (refreshIndex) await this.client.indices.refresh({ index: this.index });
    }

    async deleteVector(id: string): Promise<void> {
        await this.client.delete({
            index: this.index,
            id,
        });
    }

    async listVectors(search: any, queryOptions: CommonQueryOptions): Promise<Vector[]> {
        const res = await this.client.search({
            index: this.index,
            body: {
                query: search,
                _source: [this.vectorFieldName],
                from: queryOptions.offset,
                limit: queryOptions.limit,
            },
        });

        return res.body.hits.hits.map((hit: any) => hit._source[this.vectorFieldName]);
    }
}
