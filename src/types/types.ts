export type Falsy = false | null | undefined;

/**
 * Get all keys of an object including nested keys.
 */
export type NestedProperties<T> = T extends object
    ? {
          [K in keyof T]: K | NestedProperties<T[K]>;
      }[keyof T]
    : never;

export type AnyOptions =  Record<string, any>;
