import type { Falsy } from "../types/types.js";

export function isFalsy(value: any): value is Falsy {
    return value === false || value == null;
}

export function createId(length = 8): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < length; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

/**
 * `o2` overwrites `o1`
 */
export function deepMerge(o1: any, o2: any) {
    const res = { ...o1 };

    for (const key in o2) {
        const v2: any = o2[key];

        if (v2 && typeof v2 === "object" && !Array.isArray(v2)) {
            res[key] = deepMerge(o1?.[key], o2[key]);
        } else if (v2 !== undefined) {
            res[key] = v2;
        }
    }

    return res;
}
