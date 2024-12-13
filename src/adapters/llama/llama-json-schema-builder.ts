import { JSONSchemaBuilder } from "../../schemas/json-schema-builder.js";
import type { JSONSchema } from "../../types/json-schema.js";

export class LlamaJSONSchemaBuilder extends JSONSchemaBuilder {
    protected override adjust(schema: JSONSchema): JSONSchema {
        return new JSONSchemaBuilder(schema, { copySchema: false })
            .transform((subSchema) => {
                // TODO
                return subSchema;
            })
            .build();
    }
}
