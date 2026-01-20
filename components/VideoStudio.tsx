import React, { useState } from 'react';
import { generateVideo } from '../services/geminiService';

const VideoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Image to video
  const [baseImage, setBaseImage] = useState<string | undefined>(undefined);
  const [baseMime, setBaseMime] = useState<string | undefined>(undefined);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImg(result);
        setBaseImage(result.split(',')[1]);
        setBaseMime(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const generate = async () => {
    if (!prompt && !baseImage) {
      alert("Please provide a prompt or an image.");
      return;
    }
    setLoading(true);
    setVideoUrl(null);
    setLoadingMsg("Initializing Veo model...");

    try {
      // Simulate progress messages since Veo takes time
      const msgs = ["Generating frames...", "Synthesizing motion...", "Rendering video...", "Finalizing..."];
      let msgIdx = 0;
      const interval = setInterval(() => {
        if (msgIdx < msgs.length) {
          setLoadingMsg(msgs[msgIdx]);
          msgIdx++;
        }
      }, 5000);

      const url = await generateVideo(prompt, aspectRatio, baseImage, baseMime);
      
      clearInterval(interval);
      setVideoUrl(url);
    } catch (e: any) {
      console.error(e);
      // Check if it's the specific key error that requires retry
      if (e.message?.includes("Requested entity was not found")) {
        alert("Session expired or invalid key. Please try again to re-select key.");
      } else {
        alert("Video generation failed. " + (e.message || ""));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4 text-white overflow-y-auto">
      <div className="flex items-center space-x-3 mb-4">
         <div className="bg-purple-600 p-2 rounded-lg">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
         </div>
         <h2 className="text-2xl font-bold">Veo Video Studio</h2>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-sm text-yellow-200 mb-6">
        <p><strong>Note:</strong> Veo generation requires a paid Google Cloud Project. You will be asked to select your API Key securely.</p>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-white">Billing Documentation</a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl space-y-4">
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Text Prompt</label>
               <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A cinematic drone shot of a futuristic city..."
                  className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
               />
            </div>
            
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Input Image (Optional - Image to Video)</label>
               <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
               />
               {previewImg && <img src={previewImg} alt="Base" className="mt-2 h-20 rounded border border-slate-600" />}
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Aspect Ratio</label>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setAspectRatio('16:9')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${aspectRatio === '16:9' ? 'bg-purple-600 border-purple-600' : 'border-slate-600 hover:bg-slate-700'}`}
                  >
                    Landscape (16:9)
                  </button>
                  <button 
                    onClick={() => setAspectRatio('9:16')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${aspectRatio === '9:16' ? 'bg-purple-600 border-purple-600' : 'border-slate-600 hover:bg-slate-700'}`}
                  >
                    Portrait (9:16)
                  </button>
               </div>
            </div>

            <button
               onClick={generate}
               disabled={loading}
               className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
               {loading ? 'Generating Video...' : 'Generate with Veo'}
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px] border border-slate-700 relative">
          {videoUrl ? (
             <video controls autoPlay loop className="w-full rounded-lg shadow-2xl max-h-[600px]">
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support video.
             </video>
          ) : (
            <div className="text-center text-slate-500">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
               <p>Veo videos will appear here.</p>
               <p className="text-xs mt-2 opacity-60">Generation can take 1-2 minutes.</p>
            </div>
          )}

          {loading && (
             <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center rounded-xl z-20 p-8 text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2">Creating Magic</h3>
                <p className="text-purple-300 animate-pulse">{loadingMsg}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoStudio;
