import type { Falsy } from "../types/types.js";
import type { Message } from "./types.js";

export class ChatBuilder {
    private _messages: Message[] = [];

    constructor() {}

    addMessage(message: Message): ChatBuilder {
        this._messages.push(message);
        return this;
    }

    build(): Message[] {
        return this._messages;
    }

    static from(messages: Message[]): ChatBuilder {
        const builder = new ChatBuilder();
        messages.forEach((message) => builder.addMessage(message));
        return builder;
    }

    static filter(...messages: (Message | Falsy | "")[]): Message[] {
        return messages.filter(Boolean) as Message[];
    }
}
