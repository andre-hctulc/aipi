import { AipiError, ErrorTag } from "./aipi-error.js";

export class NotSupportedError extends AipiError {
    constructor(subject: string, message?: string) {
        super({ message: `${subject} not supported` + (message ? `. ${message}` : "") });
    }
}

export class ResourceNotFoundError extends AipiError {
    constructor(resource: any) {
        if (typeof resource === "function") {
            resource = resource.name;
        }

        super({ message: `Resource ${resource} not found` });
    }
}

export class NotFoundError extends AipiError {
    constructor(subject: string, message?: string) {
        super({
            message: `${subject} not found` + (message ? `. ${message}` : ""),
            tags: [ErrorTag.NOT_FOUND],
            httpStatus: 404,
        });
    }
}

export class NotMountedError extends AipiError {
    constructor() {
        super({ message: "Not yet mounted", httpStatus: 500 });
    }
}
