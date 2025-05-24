/**
 * Represents metadata for an AI model.
 */
export interface ModelMetadata {
    /** Unique reference ID for the model (e.g. "openai/gpt-4"). */
    model_ref: string;
    /** The name of the AI model (e.g. "gpt-4", "bert"). */
    model_name: string;
    /** The model owner (e.g. "openai", "jinaai"). */
    model_sub: string;
    /** Optional version of the model (e.g., "1.0", "v2"). */
    model_version: string;
    /** Number of vector dimensions if it's a vector-based model. */
    vector_dimensions: number;
    /** Maximum input size (e.g. token limit for LLMs). */
    max_input_size: number;
    /** Maximum context size (e.g. context window size). */
    max_context_size: number;
    /** Maximum output size (e.g. token limit for responses). */
    max_output_size: number;
    /** Total number of trainable parameters in the model. */
    num_parameters: number;
    /** List of supported modalities (e.g. ["text", "image", "audio"]). */
    supported_modalities: string[];
    /** Indicates whether the model requires a GPU for inference. */
    requires_gpu: boolean;
    /** Precision type of the model (e.g. "fp32", "fp16", "int8"). */
    precision: "fp32" | "fp16" | "int8";
    /** Information on the dataset used for training. */
    training_dataset: string;
    /** License type of the model (e.g. "MIT", "Apache 2.0", "Proprietary"). */
    license_type: string;
    /** The provider or organization behind the model (e.g. "openai", "hugging_face"). */
    model_provider: string;
    /** List of features this model supports (e.g. "embeddings") */
    features: string[];
}
