import { AipiError } from "../errors/aipi-error.js";
import { type Persistable } from "../persister/persister.js";
import type { CommonQueryOptions } from "../types/query-options.js";
import { mergeObjects } from "../utils/system.js";
import type { Message, Tool, ToolMatch } from "./types.js";
import type { Chats } from "./chats.js";
import type { AnyOptions } from "../types/types.js";

export interface ChatSnapshot {
    messages: Message[];
    toolMatches: ToolMatch[];
}

export interface ChatResources {
    /**
     * Tools to use for the chat.
     */
    tools: Tool[];
    /**
     * Resources to use for the chat.
     */
    resources: any;
}

export interface RunResponse {
    runId: string;
    snapshot: ChatSnapshot;
}

export interface UpdateChatData {
    resources?: Partial<ChatResources>;
}

export interface SerializedChat {
    snapshot: ChatSnapshot;
    resources: ChatResources;
    chatId: string;
}

export interface ChatEngine<C = any> {
    addMessages(chat: Chat<C>, messages: Message[]): Promise<void>;
    deleteMessage(chat: Chat<C>, messageId: string): Promise<void>;
    loadMessages(chat: Chat<C>, queryOptions?: CommonQueryOptions): Promise<Message[]>;
    refresh(chat: Chat<C>): Promise<ChatSnapshot>;
    run(chat: Chat<C>, init: RunInit, options?: AnyOptions): Promise<RunResponse>;
    update(chat: Chat<C>, data: UpdateChatData): Promise<void>;
    /**
     *
     * This is called when the chat changes.
     */
    onChange(chat: Chat<C>): void;
}

export interface RunInit {
    resources?: Partial<ChatResources>;
}

export interface ChatOptions {
    /**
     * Whether to auto persist the chat on change. The {@link Chats} instance must have a persister set.
     * @default true
     */
    autoPersist?: boolean;
}

export class Chat<C = any> implements Persistable<SerializedChat> {
    private _id: string;
    private _resources: ChatResources;
    private _lastRunId: string = "";
    private _context: C;
    private _snapshot: ChatSnapshot;
    private _autoPersist: boolean;

    constructor(
        private engine: ChatEngine<C>,
        id: string,
        resources: ChatResources,
        snapshot: ChatSnapshot,
        context: C,
        options?: ChatOptions
    ) {
        this._id = id;
        this._snapshot = snapshot;
        this._resources = resources;
        this._context = context;
        this._autoPersist = options?.autoPersist ?? true;
    }

    get id(): string {
        return this._id;
    }

    get autoPersist(): boolean {
        return this._autoPersist;
    }

    get tools(): Tool[] {
        return this._resources.tools;
    }

    get resources(): any {
        return this._resources.resources;
    }

    get context(): C {
        return this._context;
    }

    /**
     * The ID of the last run of the chat.
     */
    get lastRunId(): string {
        return this._lastRunId;
    }

    addMessages(message: Message[]): void {
        this.updateSnapshot((snapshot) => {
            snapshot.messages.push(...message);
            return snapshot;
        });
    }

    /**
     * Pushes messages to the chat engine and the chat.
     */
    async pushMessages(messages: Message[]): Promise<void> {
        await this.engine.addMessages(this, messages);
        this.addMessages(messages);
        this.engine.onChange?.(this);
    }

    /**
     * Removes messages from the chat without running the chat engine.
     */
    removeMessage(messageId: string): void {
        const newMessages = this.getMessages().filter((m) => m.id !== messageId);
        this.updateSnapshot({ messages: newMessages });
    }

    /**
     * Deletes a message from the chat engine and the chat.
     */
    async deleteMessage(messageId: string): Promise<void> {
        await this.engine.deleteMessage(this, messageId);
        this.removeMessage(messageId);
        this.engine.onChange?.(this);
    }

    /**
     * Get loaded messages.
     */
    getMessages(): Message[] {
        return this._snapshot.messages;
    }

    /**
     * Get a loaded message by id.
     */
    getMessage(messageId: string): Message | null {
        return this.getMessages().find((m) => m.id === messageId) ?? null;
    }

    /**
     * Load messages from the chat engine and update the chat if all messages are loaded.
     */
    async loadMessages(queryOptions?: CommonQueryOptions): Promise<Message[]> {
        const messages = await this.engine.loadMessages(this, queryOptions);
        if (!queryOptions) this.updateSnapshot({ messages });
        return messages;
    }

    get latestMessage(): Message | null {
        const messages = this.getMessages();
        return messages.length > 0 ? messages[messages.length - 1] : null;
    }

    hasMessages(): boolean {
        return this.getMessages().length > 0;
    }

    /**
     * Refresh the chat using the chat engine.
     */
    async refresh(): Promise<void> {
        const snapshot = await this.engine.refresh(this);
        this.updateSnapshot(snapshot);
        this.engine.onChange?.(this);
    }

    /**
     * Update the chat using the chat engine.
     */
    async update(data: UpdateChatData): Promise<void> {
        await this.engine.update(this, data);
        this._resources = mergeObjects(this._resources, data.resources);
        this.engine.onChange?.(this);
    }

    /**
     * Run the chat using the chat engine.
     */
    async run(init: RunInit, options?: AnyOptions): Promise<RunResponse> {
        const res = await this.engine.run(this, init, options);
        this.updateSnapshot(res.snapshot);
        this._lastRunId = res.runId;
        this.engine.onChange?.(this);
        return res;
    }

    serialize(): SerializedChat {
        return {
            snapshot: this._snapshot,
            resources: this._resources,
            chatId: this._id,
        };
    }

    setSnapshot(snapshot: ChatSnapshot): void {
        this._snapshot = snapshot;
    }

    updateSnapshot(snapshot: Partial<ChatSnapshot> | ((snapshot: ChatSnapshot) => ChatSnapshot)): void {
        if (typeof snapshot === "function") {
            this._snapshot = snapshot({
                messages: [...this._snapshot.messages],
                toolMatches: [...this._snapshot.toolMatches],
            });
        } else {
            this._snapshot = mergeObjects(this._snapshot, snapshot);
        }
    }

    getSnapshot(): ChatSnapshot {
        return this._snapshot;
    }

    /**
     * Query loaded messages.
     */
    query(queryOptions?: Pick<CommonQueryOptions, "limit" | "offset">): Message[] {
        let messages = this.getMessages();
        if (queryOptions?.offset !== undefined) {
            messages = messages.slice(queryOptions.offset);
        }
        if (queryOptions?.limit !== undefined) {
            messages = messages.slice(0, queryOptions.limit);
        }
        return messages;
    }

    assignId(id: string): string {
        if (this.id) throw new AipiError({ message: "Chat already initialized" });
        return (this._id = id);
    }

    updateContext(context: C): void {
        this._context = context;
    }
}
