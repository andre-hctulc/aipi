import { Persister } from "./persister.js";

export abstract class FileStorage extends Persister<string, File> {}
