import type { Input, MetaDescription, Result, Tool } from "../types";

export interface AssistantRefInput extends Input {
    assistantId: string;
}

export interface CreateInput extends Input {
    instructions: string;
    description?: string;
    name?: string;
    metadata?: any;
    tools?: Tool[];
}

export interface CreateResult extends Result {
    assistantId: string;
}

export interface UpdateInput extends AssistantRefInput {
    data: any;
}

export interface UpdateResult extends Result {}

export interface DeleteInput extends AssistantRefInput {}

export interface DeleteResult extends Result {
    deleted: boolean;
}

export interface AssistantSkeleton {}

export interface GetInput extends AssistantRefInput {}

export interface GetResult extends Result {
    assistant: AssistantSkeleton;
}

export interface ListInput extends Input {
    offset?: number;
    limit?: number;
    from?: string;
    to?: string;
    sort?: any;
}

export interface ListResult extends Result {
    assistants: AssistantSkeleton[];
}

export abstract class Assistants {
    constructor() {}

    abstract list(input: ListInput, meta: MetaDescription): Promise<ListResult>;

    // CRUD
    abstract create(input: CreateInput, meta: MetaDescription): Promise<CreateResult>;
    abstract get(input: GetInput, meta: MetaDescription): Promise<GetResult>;
    abstract update(input: UpdateInput, meta: MetaDescription): Promise<UpdateResult>;
    abstract delete(input: DeleteInput, meta: MetaDescription): Promise<DeleteResult>;
}
