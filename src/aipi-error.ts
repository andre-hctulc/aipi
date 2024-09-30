export class AipiError extends Error {
    constructor(message: string) {
        super("AIPI Error: " + message);
    }
}
