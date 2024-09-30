import OpenAI from "openai";
import { MetaDescription } from "../types";
import {
    Assistants,
    CreateInput,
    CreateResult,
    DeleteInput,
    DeleteResult,
    GetInput,
    GetResult,
    ListInput,
    ListResult,
    UpdateInput,
    UpdateResult,
} from "./assistants";
import { OpenAIProvider } from "../providers/openai-provider";
import { AipiError } from "../aipi-error";

export class OpenAIAssistants extends Assistants {
    constructor(private provider: OpenAIProvider) {
        super();
    }

    private model(model: any): string {
        if (!model) return "gpt-4o-mini";
        return model;
    }

    async create(input: CreateInput, meta: MetaDescription): Promise<CreateResult> {
        const res = await this.provider.client.beta.assistants.create({
            model: this.model(meta.model),
            description: input.description,
            name: input.name,
            metadata: input.metadata,
            instructions: input.instructions,
            tools: input.tools?.map<OpenAI.Beta.Assistants.AssistantTool>((tool) => {
                if (tool.type === "function") {
                    return {
                        type: "function",
                        function: {
                            description: tool.trigger,
                            name: tool.name,
                            ...tool.configure,
                        },
                    };
                } else if (tool.type === "code_interpreter") {
                    return { type: "code_interpreter", ...tool.configure };
                } else if (tool.type === "file_search") {
                    return { type: "file_search", ...input.configure };
                } else {
                    throw new AipiError(
                        "Invalid tool type. Expected 'function', 'code_interpreter', or 'file_search'. Received: " +
                            tool.type
                    );
                }
            }),
            ...input.configure,
        });

        return {
            assistantId: res.id,
            raw: {
                id: res.id,
                created_at: res.created_at,
            },
        };
    }

    async delete(input: DeleteInput, meta: MetaDescription): Promise<DeleteResult> {
        const res = await this.provider.client.beta.assistants.del(input.assistantId, meta.request);
        return { deleted: res.deleted, raw: { id: res.id } };
    }

    async list(input: ListInput, meta: MetaDescription): Promise<ListResult> {
        const res = await this.provider.client.beta.assistants.list(
            {
                after: input.from,
                before: input.to,
                limit: input.limit,
                order: input.sort
            },
            meta.request
        );
        
        return res.data.map((assistant) => ({
            
        }));
    }

    get(input: GetInput, meta: MetaDescription): Promise<GetResult> {
        throw new Error("Method not implemented.");
    }

    update(input: UpdateInput, meta: MetaDescription): Promise<UpdateResult> {
        throw new Error("Method not implemented.");
    }
}
