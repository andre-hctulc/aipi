import type { CommonQueryOptions, Input, Message, MetaDescription, Result, Tool } from "../types";
import { ToolMatch } from "../types/types";

export interface CreateChatInput extends Input {
    tools?: Tool[];
    messages?: Message[];
    resources?: any;
}

export interface CreateChatResult extends Result {
    chatId: string;
}

export interface DeleteChatInput extends Input {
    chatId: string;
}

export interface DeleteChatResult extends Result {
    deleted: boolean;
}

export interface AddMessagesInput extends Input {
    chatId: string;
    messages: Message[];
}

export interface AddMessagesResult extends Result {
    messageIds: string[];
}

export interface CreateResponseInput extends Input {
    chatId: string;
    /**
     * Additional Instructions added for the creation
     * */
    instructions?: string;
    /**
     * Additional Messages added before creating the response
     * */
    messages?: Message[];
    /**
     * Tools to use for this creation. This may override the tools set in the assistant.
     */
    tools?: Tool[];
}

export interface CreateResponseResult extends Result {
    toolMatches?: ToolMatch[];
    responseMessages: Message[];
}

export interface GetMessageInput extends Message {
    chatId: string;
    messageId: string;
}

export interface GetMessageResult extends Result {
    message: Message;
}

export interface ListMessagesInput extends Input {
    chatId: string;
    query?: CommonQueryOptions;
}

export interface ListMessagesResult extends Result {
    messages: Message[];
}

export interface DeleteMessageInput extends Input {
    chatId: string;
    messageId: string;
}

export interface DeleteMessageResult extends Result {
    deleted: boolean;
}

export interface ListChatsInput extends Input {
    query?: CommonQueryOptions;
}

export interface ListChatsResult extends Result {
    chatIds: string[];
}

export interface GetChatInput extends Input {
    chatId: string;
}

export interface GetChatResult extends Result {}

/**
 * Assistants can be used to create and manage chats.
 */
export abstract class Assistant {
    constructor(readonly id: string) {}

    // -- Chats

    abstract createChat(input: CreateChatInput, meta?: MetaDescription): Promise<CreateChatResult>;
    abstract deleteChat(input: DeleteChatInput, meta?: MetaDescription): Promise<DeleteChatResult>;
    abstract listChats(input: ListChatsInput, meta?: MetaDescription): Promise<ListChatsResult>;
    abstract getChat(input: { chatId: string }, meta?: MetaDescription): Promise<any>;

    // -- Messages

    abstract addMessages(input: AddMessagesInput, meta?: MetaDescription): Promise<AddMessagesResult>;
    abstract createResponse(
        input: CreateResponseInput,
        meta?: MetaDescription
    ): Promise<CreateResponseResult>;
    abstract getMessage(input: GetMessageInput, meta?: MetaDescription): Promise<GetMessageResult>;
    abstract listMessages(input: ListMessagesInput, meta?: MetaDescription): Promise<ListMessagesResult>;
    abstract deleteMessage(input: DeleteMessageInput, meta?: MetaDescription): Promise<DeleteMessageResult>;
}
