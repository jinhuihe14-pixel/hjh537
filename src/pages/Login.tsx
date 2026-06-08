
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Play, Sparkles, Shield, Users, Globe } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { PlayerClass } from '../types/game';
import { CLASS_INFO } from '../data/gameData';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLoggedIn, setPlayerId } = useGameStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClass, setSelectedClass] = useState<PlayerClass>(PlayerClass.WARRIOR);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setLoggedIn(true);
      setPlayerId('player_' + Date.now());
      setIsLoading(false);
      navigate('/character');
    }, 1000);
  };
  
  const handleGuestLogin = () => {
    setIsLoading(true);
    setLoggedIn(true);
    setPlayerId('guest_' + Date.now());
    setIsLoading(false);
    navigate('/character');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      <div className="absolute inset-0 opacity-30">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 mb-3">
            大世界
          </h1>
          <p className="text-gray-400 text-lg">开放探索 · 自由冒险 · 多人同屏</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-8 border border-amber-600/30 shadow-2xl shadow-black/50">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${
                    isLogin
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  登录
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${
                    !isLogin
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  注册
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="用户名"
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="密码"
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
                
                {!isLogin && (
                  <div className="space-y-3">
                    <label className="text-sm text-gray-400">选择职业</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.keys(CLASS_INFO) as PlayerClass[]).map((cls) => {
                        const info = CLASS_INFO[cls];
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setSelectedClass(cls)}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                              selectedClass === cls
                                ? 'border-amber-500 bg-amber-900/30'
                                : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                            }`}
                          >
                            <span className="text-2xl">{info.icon}</span>
                            <span className="text-xs text-gray-300">{info.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      {isLogin ? '开始游戏' : '创建账号'}
                    </>
                  )}
                </button>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-slate-800/50 text-gray-500 text-sm">或者</span>
                </div>
              </div>
              
              <button
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full py-3 border border-slate-600 hover:border-amber-500 text-gray-300 hover:text-amber-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5" />
                游客体验
              </button>
            </div>
          </div>
          
          <div className="hidden md:block space-y-4">
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-amber-400 mb-4">游戏特色</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">超大世界</h4>
                    <p className="text-sm text-gray-400">无缝开放世界，自由探索无尽冒险</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">多人同屏</h4>
                    <p className="text-sm text-gray-400">实时多人互动，组队挑战世界BOSS</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">自由交易</h4>
                    <p className="text-sm text-gray-400">开放经济系统，玩家自由交易</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-2xl p-5 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-amber-300">新玩家福利</span>
              </div>
              <p className="text-sm text-gray-300">
                注册即送1000金币 + 新手大礼包，开启你的冒险之旅！
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2024 大世界游戏 · 即点即玩 · 无需下载</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
