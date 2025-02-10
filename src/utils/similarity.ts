import { dot, norm, multiply, divide } from "mathjs";
import type { Vector } from "../embeddings/types.js";

/**
 * Calculate the cosine similarity between two vectors.
 */
export function cosineSimilarity(vect1: Vector, vect2: Vector): number {
    const dotProduct = dot(vect1 as number[], vect2 as number[]);
    const magnitudeA = norm(vect1 as number[]);
    const magnitudeB = norm(vect2 as number[]);
    return divide(dotProduct, multiply(magnitudeA, magnitudeB)) as number;
}
