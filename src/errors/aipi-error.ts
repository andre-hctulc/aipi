export enum ErrorTag {
    NOT_FOUND = "not-found",
    TYPE_ERROR = "type-error",
    NOT_SUPPORTED = "not-supported",
}

type ErrorInfo = {
    message: string;
    cause: unknown;
    data: any;
    tags: ErrorTag[];
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
    readonly info: ErrorInfo;

    constructor(info: Partial<ErrorInfo>) {
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

    addTag(tag: ErrorTag) {
        this.info.tags.push(tag);
    }

    removeTag(tag: ErrorTag) {
        this.info.tags = this.info.tags.filter((t) => t !== tag);
    }

    hasTag(tag: ErrorTag) {
        return this.info.tags.includes(tag);
    }
}
