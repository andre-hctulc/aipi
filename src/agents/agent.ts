import type { Chat } from "../chats/chat.js";
import type { CreateChatInput } from "../chats/chats.js";
import type { Tool } from "../chats/types.js";
import type { Persistable } from "../persister/persister.js";
import type { CommonQueryOptions } from "../types/query-options.js";
import type { BaseOptions } from "../types/types.js";
import type { Instructions } from "./types.js";

export interface AgentConfig {
    tools: Tool[];
    resources: any;
    data: any;
    instructions: Instructions;
    description: string;
    name: string;
}
export interface UpdateAgentData {
    config?: Partial<AgentConfig>;
}

export interface AgentEngine<C = any, CC = any> {
    loadChat(agent: Agent<C, CC>, chatId: string): Promise<Chat<CC> | null>;
    deleteChat(agent: Agent<C, CC>, chatId: string): Promise<void>;
    listChats(agent: Agent<C, CC>, queryOptions?: CommonQueryOptions): Promise<string[]>;
    startChat(agent: Agent<C, CC>, input: CreateChatInput, options?: BaseOptions): Promise<Chat<CC>>;
    update(agent: Agent<C, CC>, data: UpdateAgentData): Promise<void>;
    refresh(agent: Agent<C, CC>): Promise<AgentConfig>;
}

export interface SerializedAgent {
    config: AgentConfig;
    agentId: string;
}

export class Agent<C = any, CC = any> implements Persistable<SerializedAgent> {
    private _context: C;
    private _config: AgentConfig;

    constructor(
        private engine: AgentEngine,
        readonly id: string,
        context: C,
        config: AgentConfig
    ) {
        this._config = config;
        this._context = context;
    }

    serialize(): SerializedAgent {
        return { config: this._config, agentId: this.id };
    }

    get context(): C {
        return this._context;
    }

    get resources(): AgentConfig {
        return this._config;
    }

    async loadChat(chatId: string): Promise<Chat<CC> | null> {
        return this.engine.loadChat(this, chatId);
    }

    async deleteChat(chatId: string): Promise<void> {
        return this.engine.deleteChat(this, chatId);
    }

    async listChats(queryOptions?: CommonQueryOptions): Promise<string[]> {
        return this.engine.listChats(this, queryOptions);
    }

    async startChat(input: CreateChatInput, options?: BaseOptions): Promise<Chat<CC>> {
        return this.engine.startChat(this, input, options);
    }

    async refresh(): Promise<void> {
        const newConfig = await this.engine.refresh(this);
        this.setConfig(newConfig);
    }

    getConfig() {
        return this._config;
    }

    setConfig(config: AgentConfig) {
        this._config = config;
    }

    async update(data: UpdateAgentData): Promise<void> {
        return this.engine.update(this, data);
    }

    updateContext(context: C): void {
        this._context = context;
    }
}
