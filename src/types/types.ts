export type Falsy = false | null | undefined;

/**
 * Get all keys of an object including nested keys.
 */
export type NestedProperties<T> = T extends object
    ? {
          [K in keyof T]: K | NestedProperties<T[K]>;
      }[keyof T]
    : never;

export type BaseOptions<P extends object = Record<string, any>> = {
    /**
     * Adapter specific options.
     */
    params?: P;
};

export type BaseInput<P extends object = Record<string, any>> = {
    /**
     * Adapter specific input.
     */
    params?: P;
};

export type BaseResult = {
    /**
     * Adapter specific result.
     */
    params?: Record<string, any>;
};

export type BaseConfig = {
    /**
     * Adapter specific config.
     */
    params?: Record<string, any>;
};
