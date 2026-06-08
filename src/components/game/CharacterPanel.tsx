
import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Heart, Shield, Zap, Swords, Wind, Star } from 'lucide-react';
import { CLASS_INFO } from '../../data/gameData';

const CharacterPanel: React.FC = () => {
  const { showCharacter, toggleCharacter, currentPlayer } = useGameStore();
  
  if (!showCharacter || !currentPlayer) return null;
  
  const classInfo = CLASS_INFO[currentPlayer.playerClass] || { name: '未知', icon: '❓' };
  
  const stats = [
    { label: '生命上限', value: currentPlayer.maxHealth, icon: Heart, color: 'text-red-400' },
    { label: '魔法上限', value: currentPlayer.maxMana, icon: Zap, color: 'text-blue-400' },
    { label: '攻击力', value: currentPlayer.attack, icon: Swords, color: 'text-orange-400' },
    { label: '防御力', value: currentPlayer.defense, icon: Shield, color: 'text-green-400' },
    { label: '移动速度', value: currentPlayer.speed.toFixed(1), icon: Wind, color: 'text-cyan-400' },
  ];
  
  const expToNext = currentPlayer.level * 100;
  const expPercent = (currentPlayer.exp / expToNext) * 100;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60" onClick={toggleCharacter} />
      
      <div className="relative w-[680px] h-[520px] bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg border-2 border-amber-600/70 shadow-2xl shadow-black/50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-600/50 bg-gradient-to-r from-amber-900/30 to-transparent">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Star className="w-5 h-5" />
            角色信息
          </h2>
          <button
            onClick={toggleCharacter}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 p-4 border-r border-gray-700 flex flex-col items-center">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-600/20 to-purple-600/20 border-2 border-amber-500/50 flex items-center justify-center mb-4">
              <div className="text-6xl">🧙</div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{currentPlayer.name}</h3>
            <div className="flex items-center gap-2 text-amber-400 mb-4">
              <span className="text-lg">{classInfo.icon}</span>
              <span>Lv.{currentPlayer.level} {classInfo.name}</span>
            </div>
            
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>经验值</span>
                <span>{currentPlayer.exp} / {expToNext}</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-4 flex flex-col">
            <h4 className="text-lg font-bold text-amber-400 mb-4">属性</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 flex items-center gap-3"
                >
                  <div className={`p-2 rounded-lg bg-gray-700/50 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <h4 className="text-lg font-bold text-amber-400 mb-4">装备栏</h4>
            
            <div className="flex justify-center gap-8">
              <div className="flex flex-col gap-2">
                <EquipSlot label="头盔" icon="🪖" />
                <EquipSlot label="武器" icon="⚔️" />
                <EquipSlot label="胸甲" icon="🛡️" />
              </div>
              
              <div className="flex flex-col gap-2">
                <EquipSlot label="项链" icon="📿" />
                <EquipSlot label="护腕" icon="🥊" />
                <EquipSlot label="靴子" icon="👢" />
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <div className="text-gray-400">
                  战斗力：<span className="text-amber-400 font-bold text-lg">
                    {Math.floor(currentPlayer.attack * 2 + currentPlayer.defense * 1.5 + currentPlayer.maxHealth * 0.5)}
                  </span>
                </div>
                <button className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded transition-colors">
                  技能天赋
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EquipSlot: React.FC<{ label: string; icon: string }> = ({ label, icon }) => {
  return (
    <div className="w-16 h-16 bg-gray-800/50 rounded-lg border-2 border-gray-600 flex flex-col items-center justify-center hover:border-gray-400 transition-colors cursor-pointer">
      <span className="text-2xl">{icon}</span>
      <span className="text-[10px] text-gray-500 mt-0.5">{label}</span>
    </div>
  );
};

export default CharacterPanel;
