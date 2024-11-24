export interface FileStorage {
    getFile(key: string): Promise<File>;
    setFile(key: string, file: File): Promise<void>;
    deleteFile(key: string): Promise<void>;
    /**
     * @param key The base key
     * @returns List of file keys
     */
    listFiles(key: string): Promise<string[]>;
}

export function getOnlyFileStorage(getter: (key: string) => Promise<File>) {
    const err: () => never = () => {
        throw new Error("Not implemented, this is a read-only file storage");
    };

    return {
        getFile: getter,
        setFile: async (key: string, file: File) => {
            err();
        },
        deleteFile: async (key: string) => {
            err();
        },
        listFiles: async (key: string) => {
            err();
        },
    } as FileStorage;
}
