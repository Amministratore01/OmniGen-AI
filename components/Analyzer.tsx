import React, { useState } from 'react';
import { analyzeMedia, transcribeAudio } from '../services/geminiService';

type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

const Analyzer: React.FC = () => {
  const [activeType, setActiveType] = useState<MediaType>('IMAGE');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !preview) return;
    setLoading(true);
    try {
      const base64 = preview.split(',')[1];
      const mime = file.type;
      
      let text = '';
      if (activeType === 'AUDIO') {
        text = await transcribeAudio(base64, mime);
      } else {
        text = await analyzeMedia(prompt, base64, mime, activeType === 'VIDEO');
      }
      setResult(text);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 text-white overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Media Intelligence</h2>

      <div className="flex space-x-2 mb-6 border-b border-slate-700 pb-2">
        {(['IMAGE', 'VIDEO', 'AUDIO'] as MediaType[]).map(t => (
          <button
            key={t}
            onClick={() => { setActiveType(t); setFile(null); setPreview(null); setResult(''); }}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeType === t ? 'bg-slate-700 text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            {t === 'IMAGE' ? 'Image Analysis' : t === 'VIDEO' ? 'Video Understanding' : 'Audio Transcription'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
           <div className="bg-slate-800 p-6 rounded-xl">
              <label className="block text-sm font-medium text-slate-400 mb-2">Upload {activeType.toLowerCase()}</label>
              <input 
                 type="file" 
                 accept={activeType === 'IMAGE' ? "image/*" : activeType === 'VIDEO' ? "video/*" : "audio/*"}
                 onChange={handleFileChange}
                 className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-slate-600 file:text-white hover:file:bg-slate-500 cursor-pointer"
              />
           </div>

           {activeType !== 'AUDIO' && (
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Prompt (Optional)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={activeType === 'VIDEO' ? "e.g., Summarize the key events in this video." : "e.g., Identify the objects in this image."}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
             </div>
           )}

           <button
             onClick={handleAnalyze}
             disabled={!file || loading}
             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-colors"
           >
             {loading ? 'Analyzing...' : (activeType === 'AUDIO' ? 'Transcribe' : 'Analyze')}
           </button>
        </div>

        <div className="space-y-4">
           {/* Preview */}
           {preview && (
             <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 max-h-[300px] flex justify-center overflow-hidden">
                {activeType === 'IMAGE' && <img src={preview} alt="Preview" className="object-contain max-h-full" />}
                {activeType === 'VIDEO' && <video src={preview} controls className="max-h-full w-full" />}
                {activeType === 'AUDIO' && (
                  <div className="flex items-center justify-center h-24 w-full bg-slate-900 rounded">
                    <span className="text-4xl">🎵</span>
                    <audio src={preview} controls className="ml-4" />
                  </div>
                )}
             </div>
           )}

           {/* Result */}
           <div className="bg-slate-800 rounded-xl p-6 min-h-[200px] border border-slate-700">
             <h3 className="text-lg font-semibold mb-2 text-slate-300">Analysis Result</h3>
             {loading ? (
               <div className="space-y-2 animate-pulse">
                 <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                 <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                 <div className="h-2 bg-slate-700 rounded w-5/6"></div>
               </div>
             ) : (
               <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                 {result || "Results will appear here."}
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
