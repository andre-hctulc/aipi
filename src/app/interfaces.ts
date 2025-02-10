export interface WithScopes<S> {
    covers(scope: S): boolean;
}
