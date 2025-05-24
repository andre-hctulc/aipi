import { AipiError } from "../errors/aipi-error.js";

export interface SchemaBuilderOptions {
    /**
     * Copy the schema before using it
     * @default true
     */
    copySchema?: boolean;
}

export interface BuildSchemaOptions {
    /**
     * Copy the schema before building it
     * @default true
     */
    copy?: boolean;
    /**
     * Adjust the schema before building it
     * @default true
     */
    adjust?: boolean;
    /**
     * Validate the schema before building it.
     * This receives the adjusted schema.
     *
     * Use {@link SchemaBuilder.validate} to validate before adjusting.
     * 
     * @default true
     */
    validate?: boolean;
}

/**
 * JSON Schema Builder.
 * Takes a source schema and allows to validate, adjust and build it.
 */
export abstract class SchemaBuilder<S> {
    protected _schema: S;

    constructor(schema: S, options: SchemaBuilderOptions = {}) {
        this._schema = options.copySchema === false ? schema : this.copy(schema);
    }

    /**
     * Implement this method to adjust the schema on build and optionally on validate
     * @param schema Adjust the schema before validation
     */
    protected adjust?(schema: S): S;

    protected abstract validate(schema: S): {
        /** Errors if schema is not valid */
        errors: string[];
    };

    /**
     * @param adjust Adjust the schema before validation
     */
    isValid(adjust = false): boolean {
        let schema = this._schema;
        if (adjust && this.adjust) {
            schema = this.adjust(this.copy(schema));
        }
        return !this.validate(schema).errors.length;
    }

    getErrors(adjust = false): string[] {
        let schema = this._schema;
        if (adjust && this.adjust) {
            schema = this.adjust(this.copy(schema));
        }
        return this.validate(schema).errors;
    }

    /**
     * Uses {@link structuredClone} to copy the schema.
     *
     * Override this method to implement custom copy logic
     */
    copy(schema: S): S {
        return structuredClone(schema);
    }

    /**
     * Builds the schema
     * @returns The built schema
     * @throws AipiError if the schema is invalid
     */
    build({ copy, adjust, validate }: BuildSchemaOptions = {}): S {
        let result = copy !== false ? this.copy(this._schema) : this._schema;

        if (adjust !== false && this.adjust) {
            result = this.adjust(result);
        }

        if (validate !== false) {
            const { errors } = this.validate(result);

            if (errors.length) {
                throw new AipiError({ message: "Schema validation failed", cause: errors });
            }
        }

        return result;
    }

    /**
     * Sets the schema
     */
    schema(schema: S, copy = true): this {
        this._schema = copy ? this.copy(schema) : schema;
        return this;
    }

    mutate(mutator: (schema: S) => S): this {
        this._schema = this.copy(mutator(this._schema));
        return this;
    }
}
