import type { Falsy } from "../types/types.js";

export function isFalsy(value: any): value is Falsy {
    return value === false || value == null;
}

export function getPropPaths(obj: object, includeObjProps = false): string[] {
    if (!obj || typeof obj !== "object") return [];

    const paths = [];
    for (const key in obj) {
        if (typeof (obj as any)[key] === "object") {
            const childPaths = getPropPaths((obj as any)[key]);
            if (includeObjProps) paths.push(key);
            for (const childPath of childPaths) {
                paths.push(`${key}.${childPath}`);
            }
        } else {
            paths.push(key);
        }
    }
    return paths;
}

/**
 * Resolves a property path on an object.
 *
 * **Example:**
 * ```ts
 * const obj = { a: { b: { c: 1 } } };
 * resolvePropertyPath(obj, "a.b.c"); // 1
 * ```
 */
export function resolvePropertyPath<T = any>(obj: object, path: string): T {
    return path.split(".").reduce((acc: any, key) => {
        return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
}

/**
 * Sets a property on an object by a given path.
 *
 * **Example:**
 * ```ts
 * const obj = { a: { b: { c: 1 } } };
 * setPropertyByPath(obj, "a.b.c", 2); // { a: { b: { c: 2 } } }
 * ```
 */
export function setPropertyByPath<T>(obj: object, path: string, value: T): void {
    const keys = path.split(".");
    keys.reduce((acc: any, key: string, index: number) => {
        // If we're at the last key, set the value
        if (index === keys.length - 1) {
            acc[key] = value;
        }
        // Otherwise, create the next object if it doesn't exist
        else {
            if (!acc[key]) {
                acc[key] = {};
            }
        }
        return acc[key];
    }, obj);
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

    if (!o2) return res;

    for (const key in o2) {
        const v2: any = o2[key];

        if (v2 && typeof v2 === "object" && !Array.isArray(v2)) {
            res[key] = deepMerge(o1[key], o2[key]);
        } else if (v2 !== undefined) {
            res[key] = v2;
        }
    }

    return res;
}
