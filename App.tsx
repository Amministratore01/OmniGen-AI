import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import ImageStudio from './components/ImageStudio';
import VideoStudio from './components/VideoStudio';
import LiveConversation from './components/LiveConversation';
import Analyzer from './components/Analyzer';
import TextToSpeech from './components/TextToSpeech';
import { AppMode } from './types';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.CHAT);

  const NavItem = ({ mode, icon, label }: { mode: AppMode; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => setActiveMode(mode)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeMode === mode 
          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <div className={`${activeMode === mode ? 'text-blue-400' : 'text-slate-500'}`}>{icon}</div>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4">
        <div className="mb-8 px-2 flex items-center space-x-2">
           <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg"></div>
           <h1 className="text-xl font-bold text-white tracking-tight">OmniGen AI</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem 
            mode={AppMode.CHAT} 
            label="Chat Intelligence" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>} 
          />
          <NavItem 
            mode={AppMode.IMAGE} 
            label="Image Studio" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} 
          />
          <NavItem 
            mode={AppMode.VIDEO} 
            label="Veo Video" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>} 
          />
          <NavItem 
            mode={AppMode.LIVE} 
            label="Live Voice" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>} 
          />
          <NavItem 
            mode={AppMode.ANALYZER} 
            label="Media Analyzer" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} 
          />
          <NavItem 
            mode={AppMode.TTS} 
            label="Text to Speech" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>} 
          />
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-hidden relative">
        <div className="h-full w-full rounded-2xl bg-slate-900/50 backdrop-blur-sm shadow-xl border border-slate-800/50 overflow-hidden">
          {activeMode === AppMode.CHAT && <ChatInterface />}
          {activeMode === AppMode.IMAGE && <ImageStudio />}
          {activeMode === AppMode.VIDEO && <VideoStudio />}
          {activeMode === AppMode.LIVE && <LiveConversation />}
          {activeMode === AppMode.ANALYZER && <Analyzer />}
          {activeMode === AppMode.TTS && <TextToSpeech />}
        </div>
      </div>
    </div>
  );
};

export default App;
