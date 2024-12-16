import { Resource } from "../app/index.js";
import type { Chats } from "../chats/chats.js";
import type { Message, Tool } from "../chats/types.js";
import { AipiError } from "../errors/aipi-error.js";
import { NotFoundError } from "../errors/common-errors.js";
import type { Reviver } from "../persister/persister.js";
import type { CommonQueryOptions } from "../types/query-options.js";
import type { AnyOptions } from "../types/types.js";
import {
    Agent,
    type AgentEngine,
    type AgentConfig,
    type SerializedAgent,
    type UpdateAgentData,
} from "./agent.js";

export interface StartAgentChatOptions {
    tools?: Tool[];
    messages?: Message[];
    resources?: any;
}

export interface ListAgentChatResult {
    chatIds: string[];
}

export interface UpdateAgentChatInput {
    chatId: string;
    data: any;
}

export interface CreateAgentInput {
    config: Partial<AgentConfig>;
}

export interface CreateAgentResult<C> {
    agentId: string;
    config: AgentConfig;
    context: C;
}

export interface LoadAgentResult<C = any> {
    config: AgentConfig;
    /**
     * Context passed to the agent.
     */
    context: C;
}

export interface ListAgentsResult {
    agentIds: string[];
}

export interface UpdateAgentInput {
    data: UpdateAgentData;
}

export interface AgencyConfig {}

export interface CreateAgentContextInput {
    agentId: string;
}

/**
 * @template C Agent context
 * @template CC Chat context
 */
export abstract class Agency<C = any, CC = any>
    extends Resource
    implements Reviver<SerializedAgent, Agent<C, CC>>
{
    constructor(protected config: AgencyConfig = {}) {
        super();
    }

    async revive(serializedAgent: SerializedAgent): Promise<Agent<C, CC>> {
        return new Agent(
            await this.createAgentEngine(serializedAgent.agentId),
            serializedAgent.agentId,
            await this.createContext({ agentId: serializedAgent.agentId }),
            serializedAgent.config
        );
    }

    // #### Agents ####

    protected abstract createContext(input: CreateAgentContextInput, options?: AnyOptions): Promise<C>;

    private async createAgentEngine(agentId: string): Promise<AgentEngine<C, CC>> {
        const chats = await this.chats(agentId);

        if (!chats.mounted) {
            await this.app.mount(chats);
        }

        return {
            loadChat: (agent, chatId) => {
                return chats.getChat(chatId);
            },
            deleteChat: (agent, chatId) => {
                return chats.endChat(chatId);
            },
            listChats: (agent, queryOptions) => {
                return chats.listChats(queryOptions);
            },
            startChat: (agent, input, options) => {
                return chats.startChat(input, options);
            },
            update: (agent, data) => this.alterAgent(agent, { data }),
            refresh: (agent) => this.refreshAgent(agent),
        };
    }

    protected abstract loadAgent(agentId: string): Promise<LoadAgentResult<C> | null>;

    async getAgent(agentId: string): Promise<Agent<C, CC> | null> {
        const agentData = await this.loadAgent(agentId);
        if (!agentData) return null;
        return new Agent(await this.createAgentEngine(agentId), agentId, agentData.context, agentData.config);
    }

    protected abstract refreshAgent(agent: Agent<C, CC>): Promise<AgentConfig>;

    private async findAgent(agentId: string, required = false): Promise<Agent | null> {
        const agent = await this.getAgent(agentId);
        if (!agent && required) {
            throw new NotFoundError("agent");
        }
        return agent;
    }

    protected abstract createAgent(
        input: CreateAgentInput,
        options?: AnyOptions
    ): Promise<CreateAgentResult<C>>;

    async spawnAgent(input: CreateAgentInput, options?: AnyOptions): Promise<Agent<C, CC>> {
        const { agentId, config, context } = await this.createAgent(input, options);
        return new Agent(await this.createAgentEngine(agentId), agentId, context, config);
    }

    protected abstract deleteAgent(agent: Agent): Promise<void>;

    async killAgent(agentId: string): Promise<void> {
        const agent = await this.findAgent(agentId, true);
        if (!agent) throw new AipiError({ message: "Agent not found." });
        await this.deleteAgent(agent);
    }

    protected abstract loadAgents(queryOptions?: CommonQueryOptions): Promise<ListAgentsResult>;

    async listAgents(queryOptions?: CommonQueryOptions): Promise<string[]> {
        const { agentIds } = await this.loadAgents(queryOptions);
        return agentIds;
    }

    protected abstract alterAgent(agent: Agent<C, CC>, input: UpdateAgentInput): Promise<void>;

    async updateAgent(agentId: string, input: UpdateAgentInput): Promise<void> {
        const agent = await this.findAgent(agentId, true);
        await this.alterAgent(agent!, input);
    }

    // #### Chats ####

    protected abstract chats(agentId: string): Promise<Chats<CC>>;
}
