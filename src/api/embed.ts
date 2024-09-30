import { findProvider } from "../providers/providers-list";
import type { HandlerParams, Embeddable, Vector } from "../types";

export interface EmbedParams extends HandlerParams {
    content: Embeddable;
}

export async function handler(params: EmbedParams): Promise<Vector[]> {
    const provider = findProvider(params.provider);
    return await provider.embed();
}
