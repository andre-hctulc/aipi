import type { QueryDslQueryContainer } from "@opensearch-project/opensearch/api/types.js";
import type { Falsy, NestedProperties } from "../../types/index.js";
import { AipiError, ErrorTag } from "../../errors/aipi-error.js";
import { isFalsy } from "../../utils/system.js";
import { getProperty, setProperty, deepKeys } from "dot-prop";

type Field<T extends Record<string, any> = any> = NestedProperties<T>;

/**
 * Helpers for creating OpenSearch queries.
 */
export class OpenSearchQueryHelpers<T extends Record<string, any> = any> {
    /**
     * Creates a query that checks if a field is in a list of values. If the list has only one value it will use a match query.
     */
    isIn<V>(field: Field<T>, values: V | V[] | Falsy) {
        // normalize
        if (isFalsy(values)) values = [];
        else if (!Array.isArray(values)) values = [values];

        if (values.length === 1) return { match: { [field]: values[0] } };
        else return { terms: { [field]: values || [] } };
    }

    match<V>(field: Field<T>, value: V) {
        return { match: { [field]: value } };
    }

    /**
     * Omits all falsy values from the list.
     */
    list(...list: (QueryDslQueryContainer | Falsy)[]): QueryDslQueryContainer[] {
        return list.filter(Boolean) as QueryDslQueryContainer[];
    }

    /**
     * This does **not** support object arrays.
     * @param basePath The base path to prepend to the property paths.
     * @returns An array of queries that match the object properties. If the object is falsy, an empty array is returned.
     */
    matchObject(obj: object | Falsy, basePath?: string): QueryDslQueryContainer[] {
        if (!obj) return [];

        // normalize base path
        basePath = basePath ? (basePath.endsWith(".") ? basePath : `${basePath}.`) : "";

        const propPaths = deepKeys(obj);
        const queries: QueryDslQueryContainer[] = [];

        propPaths.forEach((path) => {
            const value: any = getProperty(obj, path);

            if (Array.isArray(value)) {
                if (value.some((v) => v && typeof v === "object")) {
                    throw new AipiError({
                        message: "Array of objects not supported",
                        tags: [ErrorTag.NOT_SUPPORTED],
                    });
                }
            } else if (value && typeof value === "object") {
                return;
            }

            // Use isIn to support primitive arrays
            queries.push(this.isIn((basePath + path) as Field<T>, value));
        });

        return queries;
    }
}
