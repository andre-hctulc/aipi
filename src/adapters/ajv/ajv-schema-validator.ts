import { Ajv } from "ajv";
import { JSONSchemaValidator } from "../../schemas/json-schema-validator.js";
import type { JSONSchema } from "../../types/json-schema.js";

export class AjvSchemaValidator extends JSONSchemaValidator {
    private ajv: Ajv;

    constructor() {
        super();
        this.ajv = new Ajv();
    }

    validate(schema: JSONSchema, data: any): { errors: string[] } {
        const validate = this.ajv.compile(schema);
        validate(data);
        return { errors: validate.errors?.map((error) => error.message || "") ?? [] };
    }
}
