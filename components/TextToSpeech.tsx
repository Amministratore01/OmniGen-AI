import React, { useState } from 'react';
import { generateSpeech, decodeAudioData } from '../services/geminiService';

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSpeak = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const base64Audio = await generateSpeech(text);
      
      // Play audio
      const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(
        Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)),
        ctx,
        24000,
        1
      );
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();

    } catch (e) {
      console.error(e);
      alert("TTS Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">OmniGen TTS</h2>
        <p className="text-slate-400">Turn text into lifelike speech using OmniGen 2.5 Flash TTS</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to speak..."
        className="w-full h-40 bg-slate-800 border border-slate-600 rounded-xl p-4 text-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none shadow-inner"
      />

      <button
        onClick={handleSpeak}
        disabled={loading || !text}
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:transform-none"
      >
        {loading ? (
          <span>Generating Audio...</span>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            <span>Speak Now</span>
          </>
        )}
      </button>
    </div>
  );
};

export default TextToSpeech;