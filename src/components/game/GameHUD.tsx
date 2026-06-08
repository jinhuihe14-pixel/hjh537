
import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { User, Coins, Gem, Heart, Zap, Settings, Package, Users, Scroll, Trophy } from 'lucide-react';

const GameHUD: React.FC = () => {
  const {
    currentPlayer,
    showInventory,
    showCharacter,
    showTeam,
    showActivities,
    showSettings,
    toggleInventory,
    toggleCharacter,
    toggleTeam,
    toggleActivities,
    toggleSettings,
  } = useGameStore();

  if (!currentPlayer) return null;

  const healthPercent = (currentPlayer.health / currentPlayer.maxHealth) * 100;
  const manaPercent = (currentPlayer.mana / currentPlayer.maxMana) * 100;
  const expPercent = (currentPlayer.exp / (currentPlayer.level * 100)) * 100;

  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/70 to-transparent flex items-center px-4 z-10">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center border-2 border-amber-400 shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="text-white font-bold text-sm">{currentPlayer.name}</div>
            <div className="text-amber-400 text-xs">Lv.{currentPlayer.level}</div>
            
            <div className="w-40 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            
            <div className="w-40 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                style={{ width: `${manaPercent}%` }}
              />
            </div>
            
            <div className="w-40 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-300"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-amber-600/50">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 font-bold">{currentPlayer.gold.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-cyan-600/50">
            <Gem className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-300 font-bold">{currentPlayer.diamond.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 w-40 h-40 bg-black/60 rounded-lg border-2 border-amber-600/60 overflow-hidden z-10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
        </div>
        <div className="absolute bottom-1 left-1 text-xs text-white/70">小地图</div>
        <div className="absolute top-1 right-1 text-xs text-amber-400 font-bold">
          {Math.floor(currentPlayer.position.x)}, {Math.floor(currentPlayer.position.z)}
        </div>
      </div>
      
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button
          onClick={toggleCharacter}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            showCharacter
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/50'
              : 'bg-black/60 text-gray-300 hover:bg-black/80 hover:text-white border border-gray-600'
          }`}
          title="角色"
        >
          <User className="w-6 h-6" />
        </button>
        
        <button
          onClick={toggleInventory}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            showInventory
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/50'
              : 'bg-black/60 text-gray-300 hover:bg-black/80 hover:text-white border border-gray-600'
          }`}
          title="背包"
        >
          <Package className="w-6 h-6" />
        </button>
        
        <button
          onClick={toggleTeam}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            showTeam
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/50'
              : 'bg-black/60 text-gray-300 hover:bg-black/80 hover:text-white border border-gray-600'
          }`}
          title="组队"
        >
          <Users className="w-6 h-6" />
        </button>
        
        <button
          onClick={toggleActivities}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            showActivities
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/50'
              : 'bg-black/60 text-gray-300 hover:bg-black/80 hover:text-white border border-gray-600'
          }`}
          title="活动"
        >
          <Trophy className="w-6 h-6" />
        </button>
        
        <button
          onClick={toggleSettings}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            showSettings
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/50'
              : 'bg-black/60 text-gray-300 hover:bg-black/80 hover:text-white border border-gray-600'
          }`}
          title="设置"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
      
      <div className="absolute bottom-40 right-4 flex flex-col gap-2 z-10">
        <SkillBar />
      </div>
      
      <div className="absolute bottom-0 left-0 right-48 h-32 z-10">
        <ChatBox />
      </div>
    </>
  );
};

const SkillBar: React.FC = () => {
  const { skills } = useGameStore();
  
  const displaySkills = skills.slice(0, 6);
  
  return (
    <div className="flex flex-col gap-2">
      {displaySkills.map((skill, index) => (
        <div
          key={skill.skillId}
          className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-amber-600/60 flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-amber-400 transition-all"
        >
          <span className="text-2xl">⚔️</span>
          <div className="absolute bottom-0.5 right-0.5 text-xs text-white bg-black/70 px-1 rounded">
            {index + 1}
          </div>
          {skill.currentCooldown > 0 && (
            <div
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
              style={{
                clipPath: `inset(${100 - (skill.currentCooldown / 5) * 100}% 0 0 0)`,
              }}
            >
              <span className="text-white font-bold text-sm">{skill.currentCooldown.toFixed(1)}s</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ChatBox: React.FC = () => {
  const { chatMessages } = useGameStore();
  
  const [inputText, setInputText] = React.useState('');
  const [activeChannel, setActiveChannel] = React.useState('world');
  
  const handleSend = () => {
    if (!inputText.trim()) return;
    setInputText('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-t-lg border-t border-l border-r border-gray-700 h-full flex flex-col ml-4">
      <div className="flex gap-1 px-2 pt-1 border-b border-gray-700">
        {['world', 'team', 'guild'].map((channel) => (
          <button
            key={channel}
            onClick={() => setActiveChannel(channel)}
            className={`px-3 py-1 text-xs rounded-t transition-colors ${
              activeChannel === channel
                ? 'bg-amber-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {channel === 'world' && '世界'}
            {channel === 'team' && '队伍'}
            {channel === 'guild' && '公会'}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-sm">
        {chatMessages.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无消息</div>
        ) : (
          chatMessages.slice(-20).map((msg) => (
            <div key={msg.id} className="text-gray-300">
              <span className="text-amber-400 font-bold">{msg.senderName}：</span>
              <span>{msg.content}</span>
            </div>
          ))
        )}
      </div>
      
      <div className="p-2 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
