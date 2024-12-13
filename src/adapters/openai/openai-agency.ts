import type { RequestOptions } from "openai/core.mjs";
import {
    Agency,
    type CreateAgentContextInput,
    type CreateAgentInput,
    type CreateAgentResult,
    type ListAgentsResult,
    type LoadAgentResult,
    type UpdateAgentInput,
} from "../../agents/agency.js";
import type { Agent, AgentConfig } from "../../agents/agent.js";
import type { CommonQueryOptions } from "../../types/query-options.js";
import type { AnyOptions } from "../../types/types.js";
import { OpenAIProvider } from "./openai-provider.js";
import type { CommonOpenAIOptions } from "./types.js";
import { assistantTool, reviveAssistantTool } from "./system.js";
import { OpenAIAgentChats, type OpenAIAgentChatContext } from "./openai-agent-chats.js";
import { AipiError } from "../../errors/aipi-error.js";

export class OpenAIAgency extends Agency<undefined, OpenAIAgentChatContext> {
    private provider!: OpenAIProvider;

    override onMount() {
        this.provider = this.app.require(OpenAIProvider);
    }

    protected override async createContext(
        input: CreateAgentContextInput,
        options?: AnyOptions
    ): Promise<undefined> {
        return undefined;
    }

    protected override async loadAgent(
        agentId: string,
        options?: CommonOpenAIOptions
    ): Promise<LoadAgentResult<undefined> | null> {
        const res = await this.provider.client.beta.assistants.retrieve(agentId, options?.requestOptions);

        return {
            config: {
                data: undefined,
                description: res.description || "",
                instructions: { content: res.instructions || "" },
                name: res.name || "",
                resources: res.tool_resources,
                tools: res.tools.map((t) => reviveAssistantTool(t)) || [],
            },
            context: undefined,
        };
    }

    protected override async refreshAgent(
        agent: Agent<undefined, OpenAIAgentChatContext>
    ): Promise<AgentConfig> {
        const data = await this.loadAgent(agent.id);
        if (!data) throw new AipiError({ message: "Failed to refresh agent. Assistant not found" });
        return data.config;
    }

    protected override async createAgent(
        input: CreateAgentInput,
        options: CommonOpenAIOptions = {}
    ): Promise<CreateAgentResult<undefined>> {
        const res = await this.provider.client.beta.assistants.create(
            {
                model: options.model || "gpt-4-o",
                description: input.config.description,
                name: input.config.name,
                instructions: input.config.instructions?.content,
                tools: input.config.tools?.map((t) => assistantTool(t)) || [],
                tool_resources: input.config.resources,
            },
            options.requestOptions
        );

        return {
            agentId: res.id,
            config: {
                resources: res.tool_resources,
                instructions: { content: res.instructions || "" },
                description: res.description || "",
                name: res.name || "",
                data: undefined,
                tools: input.config.tools || [],
            },
            context: undefined,
        };
    }

    protected override async deleteAgent(agentId: string, options?: RequestOptions): Promise<void> {
        await this.provider.client.beta.assistants.del(agentId, options);
    }

    protected override async loadAgents(
        queryOptions?: CommonQueryOptions,
        options?: CommonOpenAIOptions
    ): Promise<ListAgentsResult> {
        const res = await this.provider.client.beta.assistants.list(
            {
                limit: queryOptions?.limit,
                after: queryOptions?.after,
                before: queryOptions?.before,
                order: queryOptions?.order as "asc" | "desc",
            },
            options?.requestOptions
        );

        return { agentIds: res.data.map((a) => a.id) };
    }

    protected override async alterAgent(
        agent: Agent<undefined, OpenAIAgentChatContext>,
        input: UpdateAgentInput,
        options: CommonOpenAIOptions = {}
    ): Promise<void> {
        const data = input.data;
        await this.provider.client.beta.assistants.update(
            agent.id,
            {
                instructions: data.config?.instructions?.content,
                description: data.config?.description,
                name: data.config?.name,
                tools: data.config?.tools && data.config.tools.map((t) => assistantTool(t)),
                tool_resources: data.config?.resources,
                model: options.model,
            },
            options.requestOptions
        );
    }

    protected override async chats(agentId: string): Promise<OpenAIAgentChats> {
        return new OpenAIAgentChats(agentId);
    }
}
