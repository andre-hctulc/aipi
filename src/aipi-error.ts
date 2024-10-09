type AipiErrorInfo = {
    message: string;
    cause: unknown;
};

export class AipiError extends Error {
    readonly info: AipiErrorInfo;

    constructor(info: Partial<AipiErrorInfo>) {
        super("AIPI Error" + (info.message ? ": " + info.message : ""));
        this.info = {
            message: info.message || "",
            cause: info.cause ?? null,
        };
    }

    causeIsAipiError(): boolean {
        return this.info.cause instanceof AipiError;
    }
}
