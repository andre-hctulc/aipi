import type { ParamParser } from "./param-parser.js";

export type Endpoint<
    B = any,
    Q extends Record<string, any> = Record<string, string | string[]>,
    P extends Record<string, string> = Record<string, string>,
    H extends Record<string, string | string[]> = Record<string, string | string[]>,
> = {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    params: ParamDef[];
    action: (params: EndpointParams<P, Q, B, H>) => any | Promise<any>;
};

export interface RequestContext<Req> {
    request: Req;
}

/**
 * @template Req The request object
 * @template Res The response object
 */
export type RefinedEndpoint<Req, Res> = {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    /**
     * This handler calls `AipiServer.send` internally. To allow further customization the handler returns the data that needs to be sent and the request context.
     * @returns The response object, the data to be sent and the status code
     */
    handler: (
        request: Req,
        response: Res
    ) => Promise<{ data: any; status: number; response: Res } & RequestContext<Req>>;
};

export interface EndpointParams<
    P extends Record<string, string> = Record<string, string>,
    Q extends Record<string, any> = Record<string, string | string[]>,
    B = any,
    H extends Record<string, string | string[]> = Record<string, string | string[]>,
> {
    body: B;
    query: Q;
    path: P;
    headers: H;
}

export type RawEndpointParams = {
    body: any;
    query: Record<string, string | string[]>;
    path: Record<string, string>;
    headers: Record<string, string | string[]>;
};

export type ParamType =
    | "file"
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "vector"
    | "any"
    | "string_array"
    | "number_array"
    | "boolean_array"
    | "object_array"
    | (string & {});

export type ParamDef = {
    name: string;
    type: ParamType;
    in: "body" | "query" | "path" | "header";
    optional?: boolean;
    nullable?: boolean;
    defaultValue?: any;
    /**
     * @default true
     */
    defaultValueForNull?: boolean;
    /**
     * Skips parsing if the value is _undefined_. This allows {@link ParamParser}s to handle _undefined_ values.
     */
    skipUndefinedParsing?: boolean;
    /**
     * @default true
     */
    defaultValueForUndefined?: boolean;
    /**
     * Skips parsing if the value is _null_. This allows {@link ParamParser}s to handle _null_ values.
     */
    skipNullParsing?: boolean;
};
