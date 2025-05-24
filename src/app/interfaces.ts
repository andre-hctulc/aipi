export interface WithScope<S> {
    covers(scope: S): boolean;
}
