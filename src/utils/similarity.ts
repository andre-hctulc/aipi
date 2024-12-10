import type { Vector } from "../types/types.js";
import { dot, norm, multiply, divide } from "mathjs";

/**
 * Calculate the cosine similarity between two vectors.
 */
export function cosineSimilarity(vect1: Vector, vect2: Vector): number {
    const dotProduct = dot(vect1, vect2);
    const magnitudeA = norm(vect1);
    const magnitudeB = norm(vect2);
    return divide(dotProduct, multiply(magnitudeA, magnitudeB)) as number;
}
