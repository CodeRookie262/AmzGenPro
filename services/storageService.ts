
import { ProductMask, ModelType, ImageDefinition } from '../types';

const STORAGE_KEY = 'amazongen_masks';

const DEFAULT_MASKS: ProductMask[] = [
  {
    id: 'default-1',
    name: '通用产品 - 标准套图',
    // Default to a text model for prompt optimization
    promptModel: ModelType.GEMINI_FLASH, 
    definitions: [
      {
        id: 'def-1',
        name: '白底主图',
        prompt: '专业电商白底图，展示产品全貌，光影自然。'
      },
      {
        id: 'def-2',
        name: '生活场景 - 桌面展示',
        prompt: '放置在温馨明亮的木质桌面上，背景有绿植，生活化场景。'
      }
    ]
  }
];

export const getMasks = (): ProductMask[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_MASKS;
    const parsed = JSON.parse(stored);
    
    // Migration helper for old data structure if needed (mapping model to promptModel)
    return parsed.map((m: any) => ({
        ...m,
        promptModel: m.promptModel || m.model || ModelType.GEMINI_FLASH
    }));
  } catch (e) {
    console.error("Failed to load masks", e);
    return DEFAULT_MASKS;
  }
};

export const saveMasks = (masks: ProductMask[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(masks));
  } catch (e) {
    console.error("Failed to save masks", e);
  }
};

export const createMask = (name: string, promptModel: ModelType = ModelType.GEMINI_FLASH): ProductMask => {
  return {
    id: crypto.randomUUID(),
    name,
    promptModel,
    definitions: []
  };
};

export const createImageDefinition = (name: string, prompt: string): ImageDefinition => {
  return {
    id: crypto.randomUUID(),
    name,
    prompt
  };
};
