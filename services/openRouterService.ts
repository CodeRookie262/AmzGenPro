import { OpenRouter } from "@openrouter/sdk";
import { UnifiedResponse, TextGenerationData, ImageGenerationData } from '../types';
import { getApiKeys } from "./storageService";

// OpenRouter specific model IDs
export const OR_MODELS = {
  GEMINI_3_PRO: "google/gemini-3-pro-preview",
  GEMINI_3_PRO_IMAGE: "google/gemini-3-pro-image-preview",
  GEMINI_2_5_PRO: "google/gemini-2.5-pro",
  GEMINI_2_5_FLASH: "google/gemini-2.0-flash-001", // Text/Multimodal for Prompt Opt
  GEMINI_2_5_FLASH_IMAGE: "google/gemini-2.5-flash-image", // New dedicated Image model
};

const getApiKey = () => {
  const keys = getApiKeys();
  const apiKey = keys.openRouter || process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API Key is missing. Please configure it in Admin Panel.");
  return apiKey;
};

/**
 * Generate text or multimodal response using OpenRouter API (via Fetch to bypass SDK validation issues)
 */
export const generateTextOpenRouter = async (
  model: string,
  prompt: string,
  imageBase64?: string
): Promise<UnifiedResponse<TextGenerationData>> => {
  const apiKey = getApiKey();

  // Construct content payload
  let content: any = prompt;
  
  if (imageBase64) {
    // Format for Multimodal input
    const url = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;
    
    content = [
      { 
        type: "text", 
        text: prompt 
      },
      {
        type: "image_url",
        image_url: { url }
      }
    ];
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://amazongen.local",
        "X-Title": "AmazonGen",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        // Optional: Add parameters if needed
        // temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "";

    return {
      provider: "OpenRouter",
      model: model,
      data: {
        content: responseText
      }
    };
  } catch (error) {
    console.error("OpenRouter Text/Multimodal Gen Error:", error);
    throw error;
  }
};

/**
 * Specialized function for Image Editing / Background Removal via OpenRouter
 * Takes Image + Text Prompt -> Returns Image URL (if model supports outputting images in chat)
 */
export const editImageOpenRouter = async (
  model: string,
  prompt: string,
  imageBase64: string
): Promise<string> => {
  const apiKey = getApiKey();

  const url = imageBase64.startsWith('data:') 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`;
  
  const content = [
    { 
      type: "text", 
      text: prompt 
    },
    {
      type: "image_url",
      image_url: { url }
    }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://amazongen.local",
        "X-Title": "AmazonGen",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        modalities: ["image", "text"] // Request image output if supported
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Edit API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    // 1. Try standard 'images' array (Gemini 3 style)
    // @ts-ignore
    if (message?.images && message.images.length > 0) {
      // @ts-ignore
      return message.images[0].image_url.url;
    } 
    
    // 2. Try parsing Markdown image or URL from content
    if (message?.content) {
      const urlMatch = message.content.match(/https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp)/i);
      if (urlMatch) {
        return urlMatch[0];
      }
      // Also try markdown image syntax
      const mdMatch = message.content.match(/!\[.*?\]\((.*?)\)/);
      if (mdMatch) {
        return mdMatch[1];
      }
    }

    // 3. Debug log if no image found
    console.warn("OpenRouter response did not contain an image:", message);
    throw new Error("OpenRouter did not return an image. It might have returned text description instead.");

  } catch (error) {
    console.error("OpenRouter Edit Image Error:", error);
    throw error;
  }
};

/**
 * Generate image using OpenRouter (Chat Completions with Modalities for Gemini 3 or Standard Image API)
 */
export const generateImageOpenRouter = async (
  model: string,
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  imageBase64?: string
): Promise<UnifiedResponse<ImageGenerationData>> => {
  const apiKey = getApiKey();

  try {
    // Check if we are using a model that supports the new "modalities" param (like Gemini 3 Image)
    // or if we should fallback to standard image generation.
    const isGemini3Image = model.includes("gemini-3") && model.includes("image");
    // Check if it is a Google Flash model (likely multimodal via chat, not image api)
    const isGoogleFlash = model.includes("flash") && model.includes("google");

    if (isGemini3Image || isGoogleFlash) {
       // Use Chat Completions API for Gemini 3 Image Generation OR Google Flash Multimodal
       
       // Prepare payload content (text-only or multimodal)
       let content: any = prompt;
       if (imageBase64) {
          const url = imageBase64.startsWith('data:') 
            ? imageBase64 
            : `data:image/jpeg;base64,${imageBase64}`;
            
          content = [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url } }
          ];
       }

       const body: any = {
          model: model,
          messages: [
            {
              role: "user",
              content: content
            }
          ]
       };

       // Only Gemini 3 officially documents 'modalities' for image output in OR currently
       if (isGemini3Image) {
          body.modalities = ["image", "text"];
       }

       const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://amazongen.local",
          "X-Title": "AmazonGen",
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter Chat(Image) API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const message = result.choices?.[0]?.message;
      
      // Check for image in the response (Gemini 3 style)
      // Note: OpenRouter might map this to standard content or a specific field depending on implementation
      // Adjusting logic to look for 'images' or embedded url in content if needed
      if (message?.images && message.images.length > 0) {
        const imageUrl = message.images[0].image_url.url;
        return {
          provider: "OpenRouter",
          model: model,
          data: { imageUrl, prompt }
        };
      } else if (message?.content) {
        // Fallback: check if content contains a markdown image or url
        // Some models might return just the URL in content
        const urlMatch = message.content.match(/https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp)/i);
        if (urlMatch) {
           return {
            provider: "OpenRouter",
            model: model,
            data: { imageUrl: urlMatch[0], prompt }
          };
        }
      }
      
      throw new Error("No image generated in response");

    } else {
      // Fallback to standard OpenRouter Image API (DALL-E 3 style interface)
      const response = await fetch(`https://openrouter.ai/api/v1/images/generations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://amazongen.local",
          "X-Title": "AmazonGen",
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          n: 1,
          size: `${width}x${height}`,
        }),
      });

      if (!response.ok) {
         const err = await response.text();
         throw new Error(`OpenRouter Image API Error: ${err}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0]?.url;
      
      return {
        provider: "OpenRouter",
        model: model,
        data: {
          imageUrl: imageUrl,
          prompt: prompt
        }
      };
    }

  } catch (error) {
    console.error("OpenRouter Image Gen Error:", error);
    throw error;
  }
};
