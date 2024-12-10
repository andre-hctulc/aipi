import { AipiError } from "../errors/aipi-error.js";

interface SchemaBuilderOptions {
    /**
     * Copy the schema before using it
     * @default true
     */
    copy?: boolean;
}

/**
 * JSON Schema Builder
 */
export abstract class SchemaBuilder<S> {
    protected _schema: S;

    constructor(schema: S, options: SchemaBuilderOptions = {}) {
        this._schema = options.copy === false ? schema : this.copy(schema);
    }

    protected abstract validate(schema: S): {
        /** Errors if schema is not valid */
        errors: string[];
    };

    isValid(): boolean {
        return !this.validate(this._schema).errors.length;
    }

    getErrors(): string[] {
        return this.validate(this._schema).errors;
    }

    /**
     * Overwrite this method to implement custom copy logic
     */
    copy(schema: S): S {
        // TODO faster?
        return JSON.parse(JSON.stringify(schema));
    }

    /**
     * Builds the schema
     * @param copy Whether to copy the schema before returning it. Default is true
     * @returns The built schema
     * @throws AipiError if the schema is invalid
     */
    build(copy = true): S {
        const result = copy ? this.copy(this._schema) : this._schema;

        const { errors } = this.validate(this._schema);

        if (!errors.length) {
            throw new AipiError({ message: "Schema validation failed", cause: errors });
        }

        return result;
    }

    /**
     * Sets the schema
     */
    schema(schema: S): this {
        this._schema = this.copy(schema);
        return this;
    }

    mutate(mutator: (schema: S) => S): this {
        this._schema = this.copy(mutator(this._schema));
        return this;
    }
}
