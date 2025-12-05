
import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";

// Helper to strip base64 prefix if present for API usage
const stripBase64Header = (base64Str: string) => {
  return base64Str.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (base64Str: string) => {
  const match = base64Str.match(/^data:image\/(png|jpeg|jpg|webp);base64,/);
  return match ? `image/${match[1]}` : 'image/jpeg'; // Default to jpeg if not found
}

// 1. Optimize Prompt Step (Text/Multimodal Model)
export const optimizePrompt = async (
  base64Image: string,
  instruction: string,
  model: ModelType
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = stripBase64Header(base64Image);
  const mimeType = getMimeType(base64Image);

  try {
    const response = await ai.models.generateContent({
      model: model, // Should be GEMINI_FLASH or GEMINI_PRO
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

    return response.text || "";
  } catch (error) {
    console.error("Prompt optimization failed:", error);
    // Fallback: simply combine instruction + generic tag
    return `${instruction}, high quality product photography, 4k`;
  }
};

// 2. Generate Image Step (Image Model)
export const generateImageFromProduct = async (
  base64Image: string,
  optimizedPrompt: string,
  imageModel: ModelType
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const cleanBase64 = stripBase64Header(base64Image);
  const mimeType = getMimeType(base64Image);

  try {
    const response = await ai.models.generateContent({
      model: imageModel, // Should be GEMINI_FLASH_IMAGE or GEMINI_PRO_IMAGE
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
        // Note: responseMimeType is NOT supported for these models
      }
    });

    return extractImageFromResponse(response);

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export const removeBackground = async (base64Image: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = stripBase64Header(base64Image);
  const mimeType = getMimeType(base64Image);

  try {
    // Use Flash Image for fast background removal
    const response = await ai.models.generateContent({
      model: ModelType.GEMINI_FLASH_IMAGE,
      contents: {
        parts: [
          {
            text: "Strictly copy the product from the image and place it on a pure solid white background (Hex #FFFFFF). Do not alter the product's angle, color, or shape. Output only the image.",
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
  } catch (error) {
    console.error("Background removal failed:", error);
    throw error;
  }
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
