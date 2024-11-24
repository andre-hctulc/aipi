import { Falsy, Message } from "../types";

export class ChatBuilder {
    private _messages: Message[] = [];

    constructor() {}

    addMessage(message: Message): ChatBuilder {
        this._messages.push(message);
        return this;
    }

    static from(messages: Message[]): ChatBuilder {
        const builder = new ChatBuilder();
        messages.forEach((message) => builder.addMessage(message));
        return builder;
    }

    static filter<T>(...messages: (Message | Falsy | "")[]): Message[] {
        return messages.filter(Boolean) as Message[];
    }
}
