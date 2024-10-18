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
};

export class AipiError extends Error {
    readonly info: AipiErrorInfo;

    constructor(info: Partial<AipiErrorInfo>) {
        super("AIPI Error" + (info.message ? ": " + info.message : ""));
        this.info = {
            message: info.message || "AIPI Error",
            cause: info.cause ?? null,
            data: info.data,
            tags: info.tags || [],
        };
    }

    causeIsAipiError(): boolean {
        return this.info.cause instanceof AipiError;
    }

    addTag(tag: AipiErrorTag) {
        this.info.tags.push(tag);
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
