
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, X, User, Swords, Heart, Shield, Zap } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { PlayerClass } from '../types/game';
import { CLASS_INFO, SKILLS } from '../data/gameData';

const CharacterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSkills, currentPlayer, setCurrentPlayer, setInGame } = useGameStore();
  
  const [characters] = useState([
    {
      id: 'char_1',
      name: '神剑骑士',
      level: 15,
      playerClass: PlayerClass.WARRIOR,
      avatar: '⚔️',
    },
  ]);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedClass, setSelectedClass] = useState<PlayerClass>(PlayerClass.WARRIOR);
  
  const handleEnterGame = () => {
    if (characters.length > 0) {
      const char = characters[0];
      setSkills(char.playerClass);
      setInGame(true);
      navigate('/game');
    }
  };
  
  const handleCreateCharacter = () => {
    if (!newName.trim()) return;
    setShowCreate(false);
    setNewName('');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-indigo-900/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>
      
      <div className="relative z-10 w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 mb-8">
          选择角色
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {characters.map((char) => {
            const classInfo = CLASS_INFO[char.playerClass];
            return (
              <div
                key={char.id}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-amber-500/50 cursor-pointer hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/20 transition-all group"
                onClick={handleEnterGame}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center text-4xl border-2 border-amber-500/30 group-hover:scale-110 transition-transform">
                  {char.avatar}
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-1">{char.name}</h3>
                <div className="flex items-center justify-center gap-2 text-amber-400 text-sm mb-4">
                  <span>Lv.{char.level}</span>
                  <span>·</span>
                  <span>{classInfo?.name}</span>
                </div>
                <button className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  进入游戏
                </button>
              </div>
            );
          })}
          
          {characters.length < 4 && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-dashed border-slate-600 hover:border-amber-500/50 hover:bg-slate-700/30 transition-all flex flex-col items-center justify-center min-h-[280px]"
            >
              <div className="w-20 h-20 mb-4 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-500">
                <Plus className="w-8 h-8" />
              </div>
              <span className="text-slate-400">创建新角色</span>
            </button>
          )}
        </div>
        
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-amber-600/50 w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-amber-400">创建角色</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-gray-400 hover:text-white p-1 hover:bg-gray-700/50 rounded"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">角色名称</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="请输入角色名称"
                      maxLength={12}
                      className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-3">选择职业</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(CLASS_INFO) as PlayerClass[]).map((cls) => {
                      const info = CLASS_INFO[cls];
                      const skills = SKILLS[cls];
                      const isSelected = selectedClass === cls;
                      
                      return (
                        <button
                          key={cls}
                          onClick={() => setSelectedClass(cls)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-900/20'
                              : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{info.icon}</span>
                            <div>
                              <div className="font-bold text-white">{info.name}</div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">{info.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            {skills.slice(0, 2).map((skill) => (
                              <span
                                key={skill.id}
                                className="text-lg"
                                title={skill.name}
                              >
                                {skill.icon}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-amber-400 mb-3">职业特点</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Swords className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-gray-400 w-16">攻击力</span>
                      <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-red-400"
                          style={{
                            width: selectedClass === PlayerClass.MAGE ? '90%' :
                                   selectedClass === PlayerClass.ARCHER ? '75%' :
                                   selectedClass === PlayerClass.WARRIOR ? '70%' : '40%',
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400 w-16">防御力</span>
                      <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                          style={{
                            width: selectedClass === PlayerClass.WARRIOR ? '85%' :
                                   selectedClass === PlayerClass.PRIEST ? '60%' :
                                   selectedClass === PlayerClass.ARCHER ? '50%' : '40%',
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-400 w-16">生命值</span>
                      <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-600 to-green-400"
                          style={{
                            width: selectedClass === PlayerClass.WARRIOR ? '90%' :
                                   selectedClass === PlayerClass.PRIEST ? '65%' : '55%',
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-gray-400 w-16">速度</span>
                      <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                          style={{
                            width: selectedClass === PlayerClass.ARCHER ? '85%' :
                                   selectedClass === PlayerClass.MAGE ? '50%' : '65%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCreateCharacter}
                  disabled={!newName.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  创建角色
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterPage;
