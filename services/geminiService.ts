import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { ChatModelType } from "../types";

// Helper to get fresh instance (important for Veo key selection updates)
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Audio Encoding/Decoding Helpers ---
const encodeAudio = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decodeAudio = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

// --- Chat & Text Services ---

export const generateChatResponse = async (
  modelType: ChatModelType,
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  location?: { lat: number; lng: number },
  isThinkingMode: boolean = false
) => {
  const ai = getAI();
  const tools: any[] = [];
  
  const config: any = {
    systemInstruction: "Se l'utente chiede chi sei (es. 'chi sei?', 'who are you?'), rispondi esattamente: 'Sono un modello linguistico di grandi dimensioni, sviluppato da Alberto.'"
  };

  if (modelType === ChatModelType.FLASH_SEARCH) {
    tools.push({ googleSearch: {} });
  } else if (modelType === ChatModelType.FLASH_MAPS) {
    tools.push({ googleMaps: {} });
    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      };
    }
  }

  if (isThinkingMode) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  // Set tools in config if any exist
  if (tools.length > 0) {
    config.tools = tools;
  }

  const modelId = modelType;

  // For chat, we reconstruct history. 
  // Note: To keep it simple for this demo, we are doing a single turn generateContent with history as context if needed, 
  // or using chat. For simplicity and tool usage consistency, we'll use generateContent with system instructions or just straight prompt for single turn + history context in a real app, 
  // but here we will use the Chat API for multi-turn.
  
  const chat = ai.chats.create({
    model: modelId,
    history: history,
    config: config
  });

  const response = await chat.sendMessage({ message });
  
  let groundingUrls: string[] = [];

  // Extract grounding
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) groundingUrls.push(chunk.web.uri);
      if (chunk.maps?.uri) groundingUrls.push(chunk.maps.uri);
    });
  }

  return {
    text: response.text,
    groundingUrls
  };
};

// --- Image Services ---

export const generateImage = async (
  prompt: string, 
  aspectRatio: string, 
  size: string
) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      }
    }
  });

  const images: string[] = [];
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        images.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
  }
  return images;
};

export const editImage = async (
  prompt: string,
  base64Image: string,
  mimeType: string
) => {
  const ai = getAI();
  // Using Gemini 2.5 Flash Image for editing as requested
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });

  const images: string[] = [];
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        images.push(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
      }
    }
  }
  return images;
};

// --- Analysis Services ---

export const analyzeMedia = async (
  prompt: string,
  mediaBase64: string,
  mimeType: string,
  isVideo: boolean = false
) => {
  const ai = getAI();
  // Video understanding using gemini-3-pro-preview
  // Image understanding using gemini-3-pro-preview
  const model = 'gemini-3-pro-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: mediaBase64,
            mimeType: mimeType
          }
        },
        { text: prompt || (isVideo ? "Analyze this video." : "Describe this image.") }
      ]
    }
  });

  return response.text;
};

export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Audio,
            mimeType: mimeType
          }
        },
        { text: "Transcribe this audio." }
      ]
    }
  });
  return response.text;
};

// --- Video Services (Veo) ---

export const generateVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  baseImage?: string,
  baseImageMime?: string
) => {
  // Check/Request API Key first
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
    }
  }

  // Re-init AI to pick up potential new key from global context
  const ai = getAI();
  const model = 'veo-3.1-fast-generate-preview';
  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: aspectRatio
  };

  let operation;

  if (baseImage && baseImageMime) {
     operation = await ai.models.generateVideos({
      model,
      prompt,
      image: {
        imageBytes: baseImage,
        mimeType: baseImageMime
      },
      config
    });
  } else {
    operation = await ai.models.generateVideos({
      model,
      prompt,
      config
    });
  }

  // Polling
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed or returned no URI");

  // Fetch the actual video bytes using the API key
  const finalRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await finalRes.blob();
  return URL.createObjectURL(blob);
};

// --- TTS Services ---

export const generateSpeech = async (text: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");
  return base64Audio; 
};

// --- Live API Helpers ---

export const createLiveSession = async (
  onAudioData: (buffer: AudioBuffer) => void,
  onClose: () => void
) => {
  const ai = getAI();
  const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);

  let nextStartTime = 0;

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => console.log('Live session opened'),
      onmessage: async (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio) {
           nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
           const audioBuffer = await decodeAudioData(
             decodeAudio(base64Audio),
             outputAudioContext,
             24000,
             1
           );
           const source = outputAudioContext.createBufferSource();
           source.buffer = audioBuffer;
           source.connect(outputNode);
           source.start(nextStartTime);
           nextStartTime += audioBuffer.duration;
        }
      },
      onclose: () => onClose(),
      onerror: (e) => console.error("Live API Error", e)
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
      },
      systemInstruction: "Se l'utente chiede chi sei (es. 'chi sei?', 'who are you?'), rispondi esattamente: 'Sono un modello linguistico di grandi dimensioni, sviluppato da Alberto.'"
    }
  });

  return {
    sessionPromise,
    outputAudioContext,
    sendAudio: (pcmBlob: any) => {
      sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
    },
    close: () => {
       sessionPromise.then(session => session.close());
       outputAudioContext.close();
    }
  };
};

export const createPCM16Blob = (data: Float32Array) => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000'
  };
};
