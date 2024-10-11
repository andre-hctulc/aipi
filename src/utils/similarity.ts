import { Vector } from "../types";
import math from "mathjs";

/**
 * Calculate the cosine similarity between two vectors.
 */
export function cosineSimilarity(vect1: Vector, vect2: Vector): number {
    const dotProduct = math.dot(vect1, vect2);
    const magnitudeA = math.norm(vect1);
    const magnitudeB = math.norm(vect2);
    return math.divide(dotProduct, math.multiply(magnitudeA, magnitudeB)) as number;
}
