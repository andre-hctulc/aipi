export enum AipiErrorTag {
    NOT_FOUND = "not-found",
    TYPE_ERROR = "type-error",
    NOT_SUPPORTED = "not-supported",
}

type AipiErrorInfo = {
    message: string;
    cause: unknown;
    data: any;
    tags: AipiErrorTag[];
    unexpected: boolean;
    httpStatus: number;
    /**
     * This is sent to the client in server responses.
     */
    errorCode: string;
    /**
     * true: Use the message as the HTTP response
     */
    httpMessage: string | true;
};

export class AipiError extends Error {
    readonly info: AipiErrorInfo;

    constructor(info: Partial<AipiErrorInfo>) {
        super(
            "AIPI Error" +
                (info.unexpected ? " (unexpected)" : "") +
                (info.message ? ": " + info.message : "")
        );
        this.info = {
            message: info.message || "AIPI Error",
            cause: info.cause ?? null,
            data: info.data,
            tags: info.tags || [],
            unexpected: info.unexpected ?? false,
            httpStatus: info.httpStatus || 500,
            errorCode: info.errorCode || "",
            httpMessage: info.httpMessage === true ? info.message || "" : info.httpMessage || "",
        };
    }

    causeIsAipiError(): boolean {
        return this.info.cause instanceof AipiError;
    }

    addTag(tag: AipiErrorTag) {
        this.info.tags.push(tag);
    }

    removeTag(tag: AipiErrorTag) {
        this.info.tags = this.info.tags.filter((t) => t !== tag);
    }

    hasTag(tag: AipiErrorTag) {
        return this.info.tags.includes(tag);
    }
}

export class ProviderNotFoundError extends AipiError {
    constructor(provider?: string) {
        super({
            message: "no provider found" + (provider ? ` for provider ${provider}` : ""),
            tags: [AipiErrorTag.NOT_FOUND],
        });
    }
}
