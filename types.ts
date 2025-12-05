
export enum ModelType {
  // --- Google Direct (Original Manufacturer) ---
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_FLASH_IMAGE = 'gemini-2.5-flash-image',
  
  // --- OpenRouter Models ---
  OR_GEMINI_3_PRO = 'google/gemini-3-pro-preview',
  OR_GEMINI_3_IMAGE = 'google/gemini-3-pro-image-preview',
  OR_GEMINI_2_5_PRO = 'google/gemini-2.5-pro',
  OR_GEMINI_2_5_FLASH_IMAGE = 'google/gemini-2.5-flash-image', // Updated to correct ID
}

// --- Unified Service Interfaces ---

export interface UnifiedResponse<T> {
  provider: string;
  model: string;
  data: T;
}

export interface TextGenerationData {
  content: string;
}

export interface ImageGenerationData {
  imageUrl: string;
  prompt: string; // The final prompt used
}

// ----------------------------------

export interface ImageDefinition {
  id: string;
  name: string; // e.g., "Main Image", "Lifestyle - Kitchen"
  prompt: string; // e.g., "On a pure white background", "Sitting on a marble counter"
}

export interface ProductMask {
  id: string;
  name: string; // e.g., "Coffee Maker V2"
  promptModel: ModelType | string; // Allow string for custom models
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
