
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import GameScene from '../components/game/GameScene';
import GameHUD from '../components/game/GameHUD';
import InventoryPanel from '../components/game/InventoryPanel';
import CharacterPanel from '../components/game/CharacterPanel';
import AuctionPanel from '../components/game/AuctionPanel';
import TeamPanel from '../components/game/TeamPanel';
import ActivitiesPanel from '../components/game/ActivitiesPanel';
import HomelandPanel from '../components/game/HomelandPanel';
import VoicePanel from '../components/game/VoicePanel';
import TeleportPanel from '../components/game/TeleportPanel';

const GamePage: React.FC = () => {
  const { isLoggedIn, isInGame, isLoading, loadingProgress } = useGameStore();
  const [sceneReady, setSceneReady] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.pointerLockElement) {
          document.exitPointerLock?.();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="w-full h-screen bg-slate-900 overflow-hidden relative">
      <GameScene onLoaded={() => setSceneReady(true)} />
      
      {sceneReady && (
        <>
          <GameHUD />
          <InventoryPanel />
          <CharacterPanel />
          <AuctionPanel />
          <TeamPanel />
          <ActivitiesPanel />
          <HomelandPanel />
          <VoicePanel />
          <TeleportPanel />
        </>
      )}
      
      {!sceneReady && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">正在加载大世界...</h2>
          <p className="text-gray-400 mb-4">请稍候，正在准备您的冒险之旅</p>
          <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 right-2 text-xs text-gray-500/50 z-10 pointer-events-none">
        大世界 v1.0.0 | WebGL
      </div>
    </div>
  );
};

export default GamePage;
