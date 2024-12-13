import { Resource } from "../app/index.js";
import type { JSONSchema } from "../types/json-schema.js";

export abstract class JSONSchemaValidator extends Resource {
    abstract validate(schema: any, data: any): { errors: string[] };

    isValid(schema: JSONSchema, data: any): boolean {
        return this.validate(schema, data).errors.length === 0;
    }

    getErrors(schema: JSONSchema, data: any): string[] {
        return this.validate(schema, data).errors;
    }
}
