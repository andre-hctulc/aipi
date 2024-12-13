import fastify, {
    type FastifyInstance,
    type FastifyListenOptions,
    type FastifyReply,
    type FastifyRequest,
    type FastifyServerOptions,
} from "fastify";
import { AipiServer, type AipiServerOptions } from "../../server/server.js";
import type { RawEndpointParams, RefinedEndpoint, RequestContext } from "../../server/endpoints.js";

export class FastifyAipiServer extends AipiServer<FastifyInstance, FastifyRequest, FastifyReply> {
    constructor(options?: AipiServerOptions, fastifyOptions?: FastifyServerOptions) {
        super(fastify(fastifyOptions), options);
    }

    override start(options?: Partial<FastifyListenOptions>): void {
        this.server.listen({ port: 8087, ...options });
    }

    protected override defineEndpoint(endpoint: RefinedEndpoint<FastifyRequest, FastifyReply>): void {
        this.server.route({
            method: endpoint.method,
            url: endpoint.path,
            handler: endpoint.handler,
        });
    }

    protected override send(
        response: FastifyReply,
        data: any,
        status: number,
        context: RequestContext<FastifyRequest>
    ) {
        response.code(status).send(data);
    }

    protected override parseRequest(req: FastifyRequest): RawEndpointParams {
        return {
            path: (req.params as any) || {},
            headers: (req.headers as any) || {},
            body: req.body,
            query: (req.query as any) || {},
        };
    }
}
