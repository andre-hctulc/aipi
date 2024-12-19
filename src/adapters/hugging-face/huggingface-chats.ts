import { chatCompletion, textGeneration } from "@huggingface/inference";
import type { Chat } from "../../chats/chat.js";
import {
    Chats,
    type CreateChatContextInput,
    type CreateChatInput,
    type CreateChatResult,
    type ListChatsResult,
    type LoadChatResult,
    type RefreshChatResult,
    type RunChatInput,
    type RunChatResult,
    type UpdateChatInput,
} from "../../chats/chats.js";
import type { Message } from "../../chats/types.js";
import type { CommonQueryOptions } from "../../types/query-options.js";
import type { AnyOptions } from "../../types/types.js";
import { HuggingfaceProvider } from "./huggingface-provider.js";

export class HuggingfaceChats extends Chats<undefined> {
    private provider!: HuggingfaceProvider;

    protected override onMount() {
        this.provider = this.app.require(HuggingfaceProvider);
    }

    protected override createChat(
        input: CreateChatInput,
        options?: AnyOptions
    ): Promise<CreateChatResult<any>> {
        throw new Error("Method not implemented.");
    }
    protected override createChatContext(input: CreateChatContextInput, options?: AnyOptions): Promise<any> {
        throw new Error("Method not implemented.");
    }

    protected override refreshChat(chat: Chat<any>): Promise<RefreshChatResult> {
        throw new Error("Method not implemented.");
    }
    protected override loadChat(chatId: string): Promise<LoadChatResult<any> | null> {
        throw new Error("Method not implemented.");
    }
    protected override alterChat(chat: Chat<any>, input: UpdateChatInput): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected override deleteChat(chatId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected override loadChats(
        queryOptions?: CommonQueryOptions,
        options?: AnyOptions
    ): Promise<ListChatsResult> {
        throw new Error("Method not implemented.");
    }
    protected override runChat(
        chat: Chat<any>,
        input: RunChatInput,
        options?: AnyOptions
    ): Promise<RunChatResult> {
        throw new Error("Method not implemented.");
    }
    protected override pushMessages(chat: Chat<any>, messages: Message[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected override deleteMessage(chat: Chat<any>, messageId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected override loadMessages(chat: Chat<any>, queryOptions?: CommonQueryOptions): Promise<Message[]> {
        throw new Error("Method not implemented.");
    }
    protected override loadMessage(chat: Chat<any>, messageId: string): Promise<Message | null> {
        throw new Error("Method not implemented.");
    }
}
