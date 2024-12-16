import type { SerializedChat } from "../chats/chat.js";
import type { Chats } from "../chats/chats.js";
import { Persister } from "../persister/persister.js";
import type { AnyOptions } from "../types/types.js";
import { createId } from "../utils/system.js";
import {
    Agency,
    type AgencyConfig,
    type CreateAgentContextInput,
    type CreateAgentInput,
    type CreateAgentResult,
    type ListAgentsResult,
    type LoadAgentResult,
    type UpdateAgentInput,
} from "./agency.js";
import { Agent, type AgentConfig, type SerializedAgent } from "./agent.js";

type AgentPersister = Persister<object, SerializedAgent | SerializedChat>;

export interface ChatAgencyConfig<CC = any> extends AgencyConfig {
    persister: AgentPersister;
    chats: (agentId: string) => Chats<CC>;
    /**
     * @default true
     */
    persistChats?: boolean;
}

export class ChatAgency<CC = any> extends Agency<undefined, CC> {
    readonly persister: AgentPersister;

    constructor(config: ChatAgencyConfig<CC>) {
        super(config);
        this.persister = config.persister;
    }

    protected override async createContext(
        input: CreateAgentContextInput,
        options?: AnyOptions
    ): Promise<undefined> {
        return undefined;
    }

    private agentKey(agentId: string) {
        return Persister.key("agent", agentId);
    }

    protected override async loadAgent(agentId: string): Promise<LoadAgentResult<undefined> | null> {
        const obj = (await this.persister.load(this.agentKey(agentId))) as SerializedAgent | undefined;

        if (obj) {
            return { config: obj.config, context: undefined };
        }

        return null;
    }

    /**
     * Does nothing. Override to implement.
     */
    protected override async refreshAgent(agent: Agent<any, any>): Promise<AgentConfig> {
        return agent.getConfig();
    }

    protected override async createAgent(
        input: CreateAgentInput,
        options?: AnyOptions
    ): Promise<CreateAgentResult<undefined>> {
        const result: CreateAgentResult<undefined> = {
            agentId: createId(),
            config: {
                instructions: input.config?.instructions || { content: "" },
                resources: input.config.resources,
                data: input.config.data,
                tools: input.config.tools || [],
                description: input.config.description || "",
                name: input.config.name || "",
            },
            context: undefined,
        };

        await this.persister.save(this.agentKey(result.agentId), {
            agentId: result.agentId,
            config: result.config,
        });

        return result;
    }

    protected override async deleteAgent(agent: Agent<CC, CC>): Promise<void> {
        await this.persister.delete(this.agentKey(agent.id));
    }

    /**
     * Always returns an empty list. Override to use custom logic.
     */
    protected override async loadAgents(): Promise<ListAgentsResult> {
        return { agentIds: [] };
    }

    protected override async alterAgent(agent: Agent<any, any>, input: UpdateAgentInput): Promise<void> {
        await this.persister.save(this.agentKey(agent.id), {
            agentId: agent.id,
            config: { ...agent.getConfig(), ...input.data.config },
        });
    }

    protected override async chats(agentId: string): Promise<Chats<CC>> {
        // TODO implement instructions as system messages
        const chats = await (this.config as ChatAgencyConfig<CC>).chats(agentId);
        if ((this.config as ChatAgencyConfig<CC>).persistChats !== false) {
            chats.setPersister(this.persister as Persister<object, SerializedChat>);
            chats.addPersisterTags(...ChatAgency.persisterTags(agentId));
        }
        return chats;
    }

    static persisterTags = (agentId: string) => ["agent", agentId];
}
