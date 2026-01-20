import { Modality } from "@google/genai";

export enum AppMode {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  LIVE = 'LIVE',
  ANALYZER = 'ANALYZER',
  TTS = 'TTS'
}

export enum ChatModelType {
  PRO_THINKING = 'gemini-3-pro-preview', // For thinking mode, complex tasks
  FLASH_SEARCH = 'gemini-3-flash-preview', // For search grounding
  FLASH_MAPS = 'gemini-2.5-flash', // For maps grounding
  FLASH_LITE = 'gemini-2.5-flash-lite', // For fast responses
  PRO_DEFAULT = 'gemini-3-pro-preview' // For standard chat
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingUrls?: string[];
  timestamp: number;
}

export interface ImageGenConfig {
  prompt: string;
  aspectRatio: string;
  size?: string; // 1K, 2K, 4K
  isEditing: boolean;
  baseImage?: string; // Base64 for editing
}

export interface VideoGenConfig {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p'; // 1080p only for some, usually 720p for veo-fast
  baseImage?: string;
  baseImageMime?: string;
}

// Augment window for Veo API key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
