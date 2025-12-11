import { GoogleGenAI } from "@google/genai";
import { ModelType, UnifiedResponse, TextGenerationData, ImageGenerationData } from "../types";
import { generateTextOpenRouter, generateImageOpenRouter, editImageOpenRouter, OR_MODELS, clearApiKeysCache } from "./openRouterService";
import { backendApiKeys } from "./backendService";

// Helper to strip base64 prefix if present for API usage
const stripBase64Header = (base64Str: string) => {
  return base64Str.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (base64Str: string) => {
  const match = base64Str.match(/^data:image\/(png|jpeg|jpg|webp);base64,/);
  return match ? `image/${match[1]}` : 'image/jpeg'; // Default to jpeg if not found
}

const isOpenRouterModel = (model: string) => {
  return model.includes("/") || model.toLowerCase().includes("nanobanana");
};

// Cache for API keys
let apiKeysCache: { google: string; openRouter: string } | null = null;
let apiKeysPromise: Promise<{ google: string; openRouter: string }> | null = null;

// Helper to get Google API Key
// IMPORTANT: Only return key if it looks like a Google Key (starts with AIza)
// This prevents OpenRouter keys from accidentally being passed to Google SDK
const getGoogleApiKey = async () => {
  // Return cached key if available
  if (apiKeysCache?.google) {
    const key = apiKeysCache.google;
    if (key && key.startsWith('AIza')) {
      return key;
    }
  }

  // If a request is already in progress, wait for it
  if (apiKeysPromise) {
    const keys = await apiKeysPromise;
    if (keys.google && keys.google.startsWith('AIza')) {
      return keys.google;
    }
  }

  // Fetch from backend
  try {
    apiKeysPromise = backendApiKeys.getApiKeys();
    const keys = await apiKeysPromise;
    apiKeysCache = keys;
    
    let key = keys.google;
    if (!key || !key.startsWith('AIza')) {
      key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    }

    // Basic validation: Google API Keys typically start with AIza
    if (key && key.startsWith('AIza')) {
      return key;
    }
    
    return null; // Treat as no key if format is invalid
  } catch (error) {
    console.error('Failed to get Google API key:', error);
    const fallbackKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (fallbackKey && fallbackKey.startsWith('AIza')) {
      return fallbackKey;
    }
    return null;
  } finally {
    apiKeysPromise = null;
  }
};

// Function to clear cache (call this after updating API keys)
export const clearGoogleApiKeysCache = () => {
  apiKeysCache = null;
  apiKeysPromise = null;
};

// 1. Optimize Prompt Step (Text/Multimodal Model)
export const optimizePrompt = async (
  base64Image: string,
  instruction: string,
  model: ModelType | string
): Promise<UnifiedResponse<TextGenerationData>> => {
  
  // --- OpenRouter Path ---
  if (isOpenRouterModel(model as string)) {
    const instructionPrompt = `你是一个专业的亚马逊电商图片提示词生成专家。
请仔细观察输入的产品图片，并结合以下场景需求，创作一段全新的、极具画面感的英文图片生成提示词（Prompt）。

场景需求：${instruction}

要求：
1. 创作策略：不要直接翻译或简单扩写场景需求。你要运用摄影师的思维，根据场景需求构思一个完整的画面。
2. 主体融合：描述如何将产品自然地融入该场景（例如光影投射、环境反射、物理放置关系），但不需要详细重复产品的外观细节（因为我们会直接提供原图给生图模型）。
3. 场景细节：丰富场景的质感、道具、背景元素、光照风格（如 "soft morning sunlight streaming through window"）和整体氛围。
4. 负向提示：不需要包含。
5. 输出格式：仅输出最终的英文 Prompt，不要包含 "Here is the prompt" 等废话。`;

    try {
      return await generateTextOpenRouter(model as string, instructionPrompt, base64Image);
    } catch (error) {
      console.error("OpenRouter Prompt optimization failed:", error);
      // Fallback
      return {
        provider: "Fallback",
        model: model as string,
        data: {
          content: `${instruction}, high quality product photography, 4k`
        }
      };
    }
  }

  // --- Direct Google SDK Path (with Auto-Fallback to OpenRouter) ---
  const googleKey = await getGoogleApiKey();
  
  // If no Google Key, check if we can use OpenRouter instead
  if (!googleKey) {
    // Map standard Google models to OpenRouter equivalents
    let fallbackModel = null;
    if (model === ModelType.GEMINI_FLASH) fallbackModel = OR_MODELS.GEMINI_2_5_FLASH; // For Prompt Optimization (Text)
    if (model === ModelType.GEMINI_PRO) fallbackModel = OR_MODELS.GEMINI_2_5_PRO;
    
    if (fallbackModel) {
       console.log(`Google API Key missing. Falling back to OpenRouter model: ${fallbackModel}`);
       // Recursive call with the new OpenRouter model
       return optimizePrompt(base64Image, instruction, fallbackModel);
    }
    
    // If no mapping found, throw original error
    throw new Error("Google API Key is missing. Please configure it in Admin Panel.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: googleKey });
    const cleanBase64 = stripBase64Header(base64Image);
    const mimeType = getMimeType(base64Image);

    const response = await ai.models.generateContent({
      model: model as string, // Should be GEMINI_FLASH or GEMINI_PRO
      contents: {
        parts: [
          {
            text: `你是一个专业的亚马逊电商图片提示词生成专家。
请仔细观察输入的产品图片，并结合以下场景需求，编写一段详细的英文图片生成提示词（Prompt）。

场景需求：${instruction}

要求：
1. 主体描述：准确描述产品的外观、材质、颜色和形状，确保生图时产品一致性。
2. 场景描述：根据场景需求，详细描述背景、光照（如柔光、自然光）、构图和氛围。
3. 风格：商业摄影级别，高分辨率，4k，真实感。
4. 输出格式：仅直接输出英文提示词，不要包含任何前言或解释。`
          },
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
        ],
      },
    });

    return {
      provider: "Google",
      model: model as string,
      data: {
        content: response.text || ""
      }
    };
  } catch (error) {
    console.error("Google Prompt optimization failed:", error);
    return {
      provider: "Fallback",
      model: model as string,
      data: {
        content: `${instruction}, high quality product photography, 4k`
      }
    };
  }
};

// 2. Generate Image Step (Image Model)
export const generateImageFromProduct = async (
  base64Image: string,
  optimizedPrompt: string,
  imageModel: ModelType | string
): Promise<UnifiedResponse<ImageGenerationData>> => {
  
  // --- OpenRouter Path ---
  if (isOpenRouterModel(imageModel as string)) {
    try {
      // Append instruction to preserve product integrity
      const finalPrompt = `${optimizedPrompt}. (Strictly preserve the appearance of the product in the provided image. Seamlessly integrate it into the scene.)`;
      
      // Pass base64Image to allow Image-to-Image generation if supported
      return await generateImageOpenRouter(imageModel as string, finalPrompt, 1024, 1024, base64Image);
    } catch (error) {
      console.error("OpenRouter Image Generation Error:", error);
      throw error;
    }
  }

  // --- Direct Google SDK Path ---
  const apiKey = await getGoogleApiKey();
  if (!apiKey) {
    throw new Error("Google API Key is missing. Please configure it in Admin Panel.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const cleanBase64 = stripBase64Header(base64Image);
  const mimeType = getMimeType(base64Image);

  try {
    const response = await ai.models.generateContent({
      model: imageModel as string, // Should be GEMINI_FLASH_IMAGE or GEMINI_PRO_IMAGE
      contents: {
        parts: [
          {
            text: optimizedPrompt,
          },
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType, 
            },
          },
        ],
      },
      config: {
        // Image generation configs
      }
    });

    return {
      provider: "Google",
      model: imageModel as string,
      data: {
        imageUrl: extractImageFromResponse(response),
        prompt: optimizedPrompt
      }
    };

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export const removeBackground = async (base64Image: string): Promise<string> => {
  const googleKey = await getGoogleApiKey();
  
  // 1. Try Google SDK (Best Quality for BG Removal)
  if (googleKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: googleKey });
      const cleanBase64 = stripBase64Header(base64Image);
      const mimeType = getMimeType(base64Image);
      
      const response = await ai.models.generateContent({
        model: ModelType.GEMINI_FLASH_IMAGE, 
        contents: {
          parts: [
            {
              text: "Remove the background completely and place ONLY the product on a pure solid white background (RGB 255,255,255 / Hex #FFFFFF). The background must be 100% white with absolutely NO shadows, NO gradients, NO transparency, NO gray tones, and NO other colors whatsoever. The product must have NO drop shadows, NO cast shadows, and NO shadow effects of any kind. Do not alter the product's angle, color, shape, or any details. Output only the image with pure white background.",
            },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
          ],
        },
      });

      return extractImageFromResponse(response);
    } catch (error: any) {
      console.warn("Google SDK BG Removal failed, switching to OpenRouter attempt...", error.message);
      // Fallthrough to OpenRouter attempt
    }
  }

  // 2. Attempt OpenRouter (Fallback or Primary if no Google Key)
  try {
    console.log("Attempting BG Removal via OpenRouter...");
    // Using user specified model for BG removal fallback
    const model = "google/gemini-2.5-flash-image"; // Updated per user request
    const instruction = "Remove the background completely and place ONLY the product on a pure solid white background (RGB 255,255,255 / Hex #FFFFFF). The background must be 100% white with absolutely NO shadows, NO gradients, NO transparency, NO gray tones, and NO other colors whatsoever. The product must have NO drop shadows, NO cast shadows, and NO shadow effects of any kind. Do not alter the product's angle, color, shape, or any details. Output only the image with pure white background.";
    
    // Use specialized image editing function
    const imageUrl = await editImageOpenRouter(model, instruction, base64Image);
    return imageUrl;
    
  } catch (orError) {
    console.error("OpenRouter BG Removal failed:", orError);
  }

  // 3. Final Fallback: Return Original Image
  console.warn("All BG removal methods failed. Using original image.");
  return base64Image;
};

const extractImageFromResponse = (response: any): string => {
  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
  }
  throw new Error("No image data found in response");
};
