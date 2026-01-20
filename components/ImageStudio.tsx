import React, { useState } from 'react';
import { generateImage, editImage } from '../services/geminiService';

const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'GENERATE' | 'EDIT'>('GENERATE');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [size, setSize] = useState('1K');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Editing state
  const [editBaseImage, setEditBaseImage] = useState<string | null>(null);
  const [editMimeType, setEditMimeType] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 part
        const base64 = result.split(',')[1];
        setEditBaseImage(base64);
        setEditMimeType(file.type);
        setResultImage(result); // Show preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!prompt) return;
    setLoading(true);
    setResultImage(null);
    try {
      let images: string[] = [];
      if (mode === 'GENERATE') {
        images = await generateImage(prompt, aspectRatio, size);
      } else {
        if (!editBaseImage) {
          alert("Please upload an image to edit");
          setLoading(false);
          return;
        }
        images = await editImage(prompt, editBaseImage, editMimeType);
      }

      if (images.length > 0) {
        setResultImage(images[0]);
      }
    } catch (e) {
      console.error(e);
      alert("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4 text-white overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Image Studio</h2>
      
      <div className="flex space-x-4 bg-slate-800 p-1 rounded-lg w-fit">
        <button 
          onClick={() => setMode('GENERATE')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'GENERATE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Generate (Pro)
        </button>
        <button 
          onClick={() => setMode('EDIT')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'EDIT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Edit (Flash)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-6 bg-slate-800 p-6 rounded-xl h-fit">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder={mode === 'GENERATE' ? "Describe the image you want..." : "e.g., 'Add a retro filter' or 'Remove the background'"}
            />
          </div>

          {mode === 'GENERATE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Aspect Ratio</label>
                <select 
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Size</label>
                <select 
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
            </>
          )}

          {mode === 'EDIT' && (
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Source Image</label>
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={handleFileChange}
                 className="block w-full text-sm text-slate-400
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-600 file:text-white
                   hover:file:bg-blue-700"
               />
             </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Processing...' : (mode === 'GENERATE' ? 'Generate Image' : 'Edit Image')}
          </button>
        </div>

        {/* Preview Area */}
        <div className="md:col-span-2 bg-slate-800 rounded-xl p-6 flex items-center justify-center min-h-[400px] border border-slate-700 relative">
          {resultImage ? (
            <img src={resultImage} alt="Result" className="max-w-full max-h-[600px] rounded-lg shadow-2xl object-contain" />
          ) : (
            <div className="text-center text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>{mode === 'GENERATE' ? 'Enter a prompt to start creating.' : 'Upload an image and describe your edits.'}</p>
            </div>
          )}
          {loading && (
             <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-xl z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;
