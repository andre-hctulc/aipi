import { client } from "../client";

type Embeddable = string | string[];
type Vector = number[];
export async function handler(embeddable: Embeddable): Promise<Vector[]> {
    const strArr = Array.isArray(embeddable) ? embeddable : [embeddable];
    const res = await client.embeddings.create({ model: "text-embedding-3-small", input: strArr });
    return res.data.map((d) => d.embedding);
}
