
export enum ModelType {
  // Text/Multimodal Models (for Prompt Optimization)
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_PRO = 'gemini-3-pro-preview',
  
  // Image Generation Models
  GEMINI_FLASH_IMAGE = 'gemini-2.5-flash-image',
  GEMINI_PRO_IMAGE = 'gemini-3-pro-image-preview',
}

export interface ImageDefinition {
  id: string;
  name: string; // e.g., "Main Image", "Lifestyle - Kitchen"
  prompt: string; // e.g., "On a pure white background", "Sitting on a marble counter"
}

export interface ProductMask {
  id: string;
  name: string; // e.g., "Coffee Maker V2"
  promptModel: ModelType; // The model used to generate/optimize the prompt (Text/Multimodal)
  definitions: ImageDefinition[];
}

export interface GeneratedImageResult {
  definitionId: string;
  definitionName: string;
  optimizedPrompt?: string; // Store the optimized prompt for display/debugging
  imageUrl: string | null;
  loading: boolean;
  step?: 'optimizing' | 'generating'; // Track current step
  error?: string;
}

export interface GenerationSession {
  maskId: string;
  originalImage: string; // base64
  results: GeneratedImageResult[];
}
