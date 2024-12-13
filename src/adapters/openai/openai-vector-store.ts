import OpenAI, { type ClientOptions } from "openai";
import type { RequestOptions, Uploadable } from "openai/core.mjs";
import { Resource } from "../../app/index.js";
import type { CommonQueryOptions } from "../../types/query-options.js";
import type { VectorStoreUpdateParams } from "openai/resources/beta/vector-stores/vector-stores.mjs";

export interface ListVectorStoresResult {
    stores: { id: string; name: string }[];
}

export interface GetVectorStoreResult {
    store: { id: string; name: string };
}

export interface GetVectorStoreFileResult {
    createdAt: number;
}

export interface CreateVectorStoreFileResult {
    fileId: string;
}

export interface ListVectorStoreFilesResult {
    fileIds: string[];
}

export class OpenAIVectorStore extends Resource {
    readonly client: OpenAI;

    constructor(client: ClientOptions | OpenAI) {
        super();
        this.client = client instanceof OpenAI ? client : new OpenAI(client);
    }

    async createVectorStore(
        name: string,
        fileIds: string[],
        options?: { expiresAfter?: number; requestOptions?: RequestOptions }
    ): Promise<void> {
        await this.client.beta.vectorStores.create(
            {
                name,
                file_ids: fileIds,
                expires_after: options?.expiresAfter
                    ? { anchor: "last_active_at", days: options.expiresAfter }
                    : undefined,
            },
            options?.requestOptions
        );
    }

    async deleteVectorStore(vectorStoreId: string, requestOptions?: RequestOptions): Promise<void> {
        await this.client.beta.vectorStores.del(vectorStoreId, requestOptions);
    }

    async listVectorStores(
        queryOptions: CommonQueryOptions = {},
        requestOptions?: RequestOptions
    ): Promise<ListVectorStoresResult> {
        const res = await this.client.beta.vectorStores.list(
            {
                limit: queryOptions?.limit,
                after: queryOptions?.after,
                before: queryOptions?.before,
                order: queryOptions?.order as "asc" | "desc",
            },
            requestOptions
        );

        return { stores: res.data.map((d) => ({ id: d.id, name: d.name })) };
    }

    async getVectorStore(
        vectorStoreId: string,
        requestOptions?: RequestOptions
    ): Promise<GetVectorStoreResult> {
        const res = await this.client.beta.vectorStores.retrieve(vectorStoreId, requestOptions);
        return { store: { id: res.id, name: res.name } };
    }

    async updateVectorStore(
        vectorStoreId: string,
        data: VectorStoreUpdateParams,
        requestOptions?: RequestOptions
    ): Promise<void> {
        await this.client.beta.vectorStores.update(vectorStoreId, data, requestOptions);
    }

    async getVectorStoreFile(
        vectorStoreId: string,
        fileId: string,
        requestOptions?: RequestOptions
    ): Promise<GetVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.retrieve(vectorStoreId, fileId, requestOptions);
        return { createdAt: res.created_at };
    }

    async deleteVectorStoreFile(
        vectorStoreId: string,
        fileId: string,
        requestOptions?: RequestOptions
    ): Promise<void> {
        const res = await this.client.beta.vectorStores.files.del(vectorStoreId, fileId, requestOptions);
    }

    async createVectorStoreFile(
        vectorStoreId: string,
        file: Uploadable,
        options?: {
            requestOptions?: RequestOptions;
            pollIntervalMs?: number;
        }
    ): Promise<CreateVectorStoreFileResult> {
        const res = await this.client.beta.vectorStores.files.uploadAndPoll(vectorStoreId, file, {
            ...options?.requestOptions,
            pollIntervalMs: options?.pollIntervalMs,
        });

        return { fileId: res.id };
    }

    async listVectorStoreFiles(
        vectorStoreId: string,
        queryOptions: CommonQueryOptions = {},
        requestOptions?: RequestOptions
    ): Promise<ListVectorStoreFilesResult> {
        const res = await this.client.beta.vectorStores.files.list(
            vectorStoreId,
            {
                limit: queryOptions.limit,
                after: queryOptions.after,
                before: queryOptions.before,
                order: queryOptions.order as "asc" | "desc",
            },
            requestOptions
        );

        return { fileIds: res.data.map((d) => d.id) };
    }

    async addVectorStoreFile(
        vectorStoreId: string,
        fileId: string,
        requestOptions?: RequestOptions
    ): Promise<void> {
        const res = await this.client.beta.vectorStores.files.createAndPoll(
            vectorStoreId,
            { file_id: fileId },
            requestOptions
        );
    }
}
