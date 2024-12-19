import { Resource } from "../app/index.js";
import { NotFoundError } from "../errors/common-errors.js";
import { Persister, type Reviver } from "../persister/persister.js";
import type { CommonQueryOptions } from "../types/query-options.js";
import type { AnyOptions } from "../types/types.js";
import {
    Chat,
    type ChatEngine,
    type ChatResources,
    type ChatSnapshot,
    type RunResponse,
    type SerializedChat,
    type UpdateChatData,
} from "./chat.js";
import type { Message, Format } from "./types.js";

export interface CreateChatInput {
    resources?: Partial<ChatResources>;
    snapshot?: Partial<ChatSnapshot>;
    /**
     * Persist the chat after creation. This has no effect if when no persister is set.
     * @default true
     */
    persist?: boolean;
}

export interface CreateChatResult<C = any> {
    context: C;
    snapshot: ChatSnapshot;
    chatId: string;
}

export interface LoadChatResult<C = any> {
    snapshot: ChatSnapshot;
    resources: ChatResources;
    /**
     * Context passed to the chat.
     */
    context: C;
}

export interface ListChatsResult {
    chatIds: string[];
}

type ChatPersister = Persister<object, SerializedChat>;

export interface ChatsConfig {
    /**
     * Persist chats using a persister.
     */
    persister?: ChatPersister;
    /**
     * Adds these tags to persister entry keys.
     */
    persisterTags?: string[];
}

export interface RunChatInput {
    /**
     * Run specific messages
     */
    messages?: Message[];
    /**
     * Run specific resources
     */
    resources?: Partial<ChatResources>;
    /**
     * Number of choices to generate.
     */
    choices?: number;
    responseFormat?: Format;
}

export interface RunChatResult extends RunResponse {}

export interface RefreshChatResult {
    snapshot: ChatSnapshot;
}

export interface UpdateChatInput {
    data?: UpdateChatData;
}

export interface CreateChatContextInput {
    /**
     * Can be empty when a chat is newly created.
     */
    chatId: string;
}

/**
 * A flexible chat system that can be used to create chat bots, conversational agents, and more.
 * Chats can be loaded from an external source or persisted in the system.
 * When and how chats are loaded and run is up to the implementation.
 */
export abstract class Chats<C = any> extends Resource implements Reviver<SerializedChat, Chat<C>> {
    private _persister: ChatPersister | undefined;
    private _persisterTags: string[] = [];

    constructor(protected config: ChatsConfig = {}) {
        super();
        this._persister = config.persister;
        this._persisterTags = config.persisterTags || [];
    }

    /**
     * Sets the persister to use for chats unless disabled for specific chats.
     */
    setPersister(persister: ChatPersister | undefined) {
        this._persister = persister;
    }

    addPersisterTags(...tags: string[]) {
        this._persisterTags.push(...tags);
    }

    setPersisterTags(tags: string[]) {
        this._persisterTags = tags;
    }

    /**
     * Gets the persister used for chats.
     */
    get persister() {
        return this._persister;
    }

    private chatKey(chatId: string) {
        return Persister.key("chat", chatId, this._persisterTags);
    }

    async revive({ chatId, resources, snapshot }: SerializedChat): Promise<Chat<C>> {
        const context = await this.createChatContext({ chatId });
        return new Chat(this.createChatEngine(), chatId, resources, snapshot, context);
    }

    // #### Chats ####

    private createChatEngine(): ChatEngine<C> {
        return {
            addMessages: (chat, messages) => {
                return this.pushMessages(chat, messages);
            },
            deleteMessage: (chat, messageId) => {
                return this.deleteMessage(chat, messageId);
            },
            loadMessages: (chat, queryOptions) => {
                return this.loadMessages(chat, queryOptions);
            },
            refresh: async (chat) => {
                const { snapshot } = await this.refreshChat(chat);
                return snapshot;
            },
            run: async (chat, init, options) => {
                const { snapshot, runId } = await this.runChat(chat, { resources: init?.resources }, options);
                return { snapshot, runId };
            },
            update: async (chat, data) => {
                await this.alterChat(chat, { data });
            },
            onChange: async (chat) => {
                if (this._persister && chat.autoPersist) {
                    await this._persister.save(this.chatKey(chat.id), chat.serialize());
                }
            },
        };
    }

    /**
     * Start a new chat.
     */
    async startChat(input: CreateChatInput, options?: AnyOptions): Promise<Chat<C>> {
        const { context, chatId, snapshot } = await this.createChat(input, options);

        const chat = new Chat(
            this.createChatEngine(),
            chatId,
            {
                tools: input.resources?.tools || [],
                resources: input.resources?.resources,
            },
            snapshot,
            context,
            {
                autoPersist: input.persist,
            }
        );

        if (this._persister) {
            await this._persister.save(this.chatKey(chat.id), chat.serialize());
        }

        return chat;
    }

    protected abstract createChat(input: CreateChatInput, options?: AnyOptions): Promise<CreateChatResult<C>>;

    protected abstract createChatContext(input: CreateChatContextInput, options?: AnyOptions): Promise<C>;

    protected abstract refreshChat(chat: Chat<C>): Promise<RefreshChatResult>;

    /**
     * Load a chat by its ID.
     */
    protected abstract loadChat(chatId: string): Promise<LoadChatResult<C> | null>;

    /**
     * Get a chat by its ID.
     */
    async getChat(chatId: string): Promise<Chat<C> | null> {
        const chatData = await this.loadChat(chatId);
        if (!chatData) return null;
        return new Chat(
            this.createChatEngine(),
            chatId,
            chatData.resources,
            chatData.snapshot,
            chatData.context
        );
    }

    private async findChat(chatId: string, required = false): Promise<Chat<C> | null> {
        const chat = await this.getChat(chatId);
        if (!chat && required) {
            throw new NotFoundError("chat");
        }
        return chat;
    }

    /**
     * Update a chat with new data.
     */
    protected abstract alterChat(chat: Chat<C>, input: UpdateChatInput): Promise<void>;

    /**
     * Update a chat with new data.
     */
    async updateChat(chatId: string, input: UpdateChatInput): Promise<void> {
        const chat = await this.findChat(chatId, true);
        return this.alterChat(chat!, input);
    }

    /**
     * Delete a chat.
     */
    protected abstract deleteChat(chatId: string): Promise<void>;

    /**
     * End a chat. Deletes the chat.
     */
    async endChat(chatId: string): Promise<void> {
        await this.deleteChat(chatId);
    }

    /**
     * Clear all chats by loading all chat IDs and deleting them one by one.
     */
    async clearChats(): Promise<void> {
        const chatIds = await this.listChats();
        await Promise.all(chatIds.map((chatId) => this.deleteChat(chatId)));
    }

    /**
     * List all chats.
     */
    protected abstract loadChats(
        queryOptions?: CommonQueryOptions,
        options?: AnyOptions
    ): Promise<ListChatsResult>;

    /**
     * List all chats.
     * @returns The IDs of all chats.
     */
    async listChats(queryOptions?: CommonQueryOptions, options?: AnyOptions): Promise<string[]> {
        const { chatIds } = await this.loadChats(queryOptions, options);
        return chatIds;
    }

    /**
     * Runs the chat.
     */
    protected abstract runChat(
        chat: Chat<C>,
        input: RunChatInput,
        options?: AnyOptions
    ): Promise<RunChatResult>;

    /**
     * Run a chat.
     */
    async run(chatId: string, input: RunChatInput, options?: AnyOptions): Promise<RunChatResult> {
        const chat = await this.findChat(chatId, true);
        return this.runChat(chat!, input, options);
    }

    // #### Messages ####

    /**
     * Add messages to the chat.
     */
    protected abstract pushMessages(chat: Chat<C>, messages: Message[]): Promise<void>;

    /**
     * Add messages to the chat.
     */
    async addMessages(chatId: string, messages: Message[]): Promise<void> {
        const chat = await this.findChat(chatId, true);
        await this.pushMessages(chat!, messages);
    }

    /**
     * Delete a message from the chat.
     */
    protected abstract deleteMessage(chat: Chat<C>, messageId: string): Promise<void>;

    /**
     * Delete a message from the chat.
     */
    async removeMessage(chatId: string, messageId: string): Promise<void> {
        const chat = await this.findChat(chatId, true);
        await this.deleteMessage(chat!, messageId);
    }

    /**
     * Load all messages from the chat.
     */
    protected abstract loadMessages(chat: Chat<C>, queryOptions?: CommonQueryOptions): Promise<Message[]>;

    /**
     * List all messages from the chat.
     */
    async listMessages(chatId: string): Promise<Message[]> {
        const chat = await this.findChat(chatId, true);
        return this.loadMessages(chat!);
    }

    /**
     * Load a message from the chat.
     */
    protected abstract loadMessage(chat: Chat<C>, messageId: string): Promise<Message | null>;

    /**
     * Get a message from the chat.
     */
    async getMessage(chatId: string, messageId: string): Promise<Message | null> {
        const chat = await this.findChat(chatId, true);
        return this.loadMessage(chat!, messageId);
    }
}
