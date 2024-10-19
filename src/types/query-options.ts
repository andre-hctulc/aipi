export type CommonQueryOptions = {
    /**
     * Maximum number of results to return
     */
    limit?: number;
    /**
     * Number of results to skip
     */
    offset?: number;
    sort?: string;
    after?: string;
    before?: string;
    order?: "asc" | "desc" | ({} & string);
};
