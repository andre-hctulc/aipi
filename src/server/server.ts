import { type FastifyListenOptions } from "fastify";
import { Resource } from "../app/index.js";
import type { Endpoint, EndpointParams, ParamDef, RawEndpointParams, RefinedEndpoint } from "./endpoints.js";
import { ParamParser } from "./param-parser.js";
import { AipiError } from "../errors/aipi-error.js";

export type ServerErrorMapper = (error: unknown) => AipiError | undefined | null | void;

export interface AipiServerOptions {
    paramParsers?: ParamParser[];
    mapError?: ServerErrorMapper;
}

interface ServerErrorObject {
    message: string;
    status: number;
    errorCode: string;
}

/**
 * @template S The server instance
 * @template Req The request object
 * @template Res The response object
 */
export abstract class AipiServer<S, Req, Res> extends Resource {
    constructor(
        readonly server: S,
        protected readonly options: AipiServerOptions = {}
    ) {
        super();
    }

    override async onMount(): Promise<void> {
        // Start server on init
        await this.start();
    }

    endpoint(endpoint: Endpoint): RefinedEndpoint<Req, Res> {
        const refinedEndpoint: RefinedEndpoint<Req, Res> = {
            method: endpoint.method,
            path: endpoint.path,
            handler: async (request, response) => {
                let error: unknown = undefined;
                let params: EndpointParams | false | null = null;
                let data: any = undefined;

                const mapError = (error: unknown) => {
                    const mappers = [this.options.mapError, this.mapError, this.defaultErrorMapper];
                    let serverError: AipiError | null = null;

                    while (!serverError && mappers.length) {
                        const mapper = mappers.shift();
                        if (!mapper) continue;

                        serverError = mapper.apply(this, [error]) || null;
                    }

                    return serverError!;
                };

                try {
                    params = this.parseParams(request, endpoint.params);
                } catch (err) {
                    error = err;
                }

                if (!error) {
                    if (params) {
                        try {
                            data = await endpoint.action(params);
                        } catch (err) {
                            error = err;
                        }
                    } else {
                        error = new AipiError({ message: "Invalid parameters", httpStatus: 400 });
                    }
                }

                const aipiError = mapError(error);
                const status = aipiError ? aipiError.info.httpStatus : 200;

                await this.send(
                    response,
                    error
                        ? ({
                              errorCode: aipiError.info.errorCode,
                              message: aipiError.info.httpMessage,
                              status: aipiError.info.httpStatus,
                          } as ServerErrorObject)
                        : data,
                    status,
                    {
                        request,
                        response,
                    }
                );

                return { response, data, status, request };
            },
        };

        this.defineEndpoint(refinedEndpoint);

        return refinedEndpoint;
    }

    private defaultErrorMapper(error: unknown): ReturnType<ServerErrorMapper> {
        if (!(error instanceof AipiError)) {
            return new AipiError({
                message: "Unexpected error",
                cause: error,
                httpStatus: 500,
                errorCode: "unexpected",
            });
        }
        return error;
    }

    private parseParams(req: Req, params: ParamDef[]): EndpointParams {
        const raw = this.parseRequest(req);

        const result: EndpointParams = {
            body: undefined,
            headers: {},
            query: {},
            path: {},
        };

        params.map((param) => {
            const parser =
                this.app.cover(param, ParamParser) ||
                this.options?.paramParsers?.find((p) => p.covers(param));

            if (!parser) {
                throw new AipiError({ message: `No parser found for parameter: ${param.name}` });
            }

            switch (param.in) {
                case "body":
                    result.body[param.name] = parser.parse(raw.body[param.name], param);
                    break;
                case "header":
                    result.headers[param.name] = parser.parse(raw.headers[param.name], param);
                    break;
                case "query":
                    result.query[param.name] = parser.parse(raw.query[param.name], param);
                    break;
                case "path":
                    result.path[param.name] = parser.parse(raw.path[param.name], param);
                    break;
            }
        });

        return raw;
    }

    abstract start(options?: Partial<FastifyListenOptions>): void;

    /**
     * Return
     */
    protected abstract parseRequest(request: Req): RawEndpointParams;

    /**
     * Do nothing if the server does not send the data via the response object. These server adapters would handle the registered endpoint themselves.
     *
     * This will be awaited before returning the endpoint action data!
     */
    protected abstract send(
        response: Res,
        data: any,
        status: number,
        context: { request: Req; response: Res }
    ): void;

    protected abstract defineEndpoint(endpoint: RefinedEndpoint<Req, Res>): void;

    protected mapError?(error: unknown): ReturnType<ServerErrorMapper>;
}
