import React, { useEffect, useRef, useState } from 'react';
import { createLiveSession, createPCM16Blob } from '../services/geminiService';

const LiveConversation: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Ready to connect");
  const sessionRef = useRef<any>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    try {
      setStatus("Initializing audio...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      inputContextRef.current = inputContext;

      const session = await createLiveSession(
        (audioBuffer) => { /* Handle audio visualization if needed */ },
        () => setIsActive(false)
      );
      sessionRef.current = session;

      const source = inputContext.createMediaStreamSource(stream);
      const processor = inputContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPCM16Blob(inputData);
        session.sendAudio(pcmBlob);
      };

      source.connect(processor);
      processor.connect(inputContext.destination);

      setIsActive(true);
      setStatus("Conversation active");
    } catch (e) {
      console.error(e);
      setStatus("Error accessing microphone or connecting");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setStatus("Disconnected");
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8">
      <div className="relative">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.5)]' : 'bg-slate-700/50'}`}>
           <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
           </div>
        </div>
        {isActive && (
           <div className="absolute inset-0 rounded-full border-4 border-blue-400 opacity-20 animate-ping"></div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Live Conversation</h2>
        <p className="text-slate-400">{status}</p>
        <p className="text-sm text-slate-500 mt-2">Powered by OmniGen 2.5 Native Audio</p>
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        className={`px-8 py-3 rounded-full font-bold text-white transition-all transform hover:scale-105 ${
          isActive 
          ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20' 
          : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20'
        }`}
      >
        {isActive ? 'End Conversation' : 'Start Conversation'}
      </button>
    </div>
  );
};

export default LiveConversation;