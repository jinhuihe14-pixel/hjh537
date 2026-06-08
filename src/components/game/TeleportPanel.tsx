
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, MapPin, Zap, Lock, Check } from 'lucide-react';
import { TeleportPoint } from '../../types/game';
import { TELEPORT_POINTS } from '../../data/gameData';

const TeleportPanel: React.FC = () => {
  const { showTeleport, toggleTeleport, teleportPoints, setTeleportPoints, currentPlayer } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (showTeleport && teleportPoints.length === 0) {
      setTeleportPoints(TELEPORT_POINTS);
    }
  }, [showTeleport, teleportPoints.length, setTeleportPoints]);

  const categories: { key: string; label: string; icon: string }[] = [
    { key: 'all', label: '全部', icon: '🗺️' },
    { key: 'city', label: '主城', icon: '🏰' },
    { key: 'wild', label: '野外', icon: '🌲' },
    { key: 'dungeon', label: '副本', icon: '⚔️' },
    { key: 'homeland', label: '家园', icon: '🏠' },
  ];

  const filteredPoints = teleportPoints.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  const handleTeleport = (point: TeleportPoint) => {
    if (!point.unlocked || !point.isActive) return;
    console.log('传送到:', point.name, point.position);
    toggleTeleport();
  };

  if (!showTeleport) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40">
      <div className="absolute inset-0 bg-black/60" onClick={toggleTeleport} />
      <div className="relative bg-gray-900 rounded-xl w-[500px] max-w-[95vw] max-h-[80vh] flex flex-col shadow-2xl border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">快捷传送</h2>
          </div>
          <button onClick={toggleTeleport} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-1 p-2 border-b border-gray-700 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedCategory === cat.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {filteredPoints.map((point) => {
              const canUse = point.unlocked && point.isActive;
              return (
                <div
                  key={point.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    canUse
                      ? 'border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/40 hover:border-blue-500/60'
                      : 'border-gray-700 bg-gray-800/50 opacity-60'
                  }`}
                  onClick={() => handleTeleport(point)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                        canUse ? 'bg-blue-900/50' : 'bg-gray-700'
                    }`}
                    >
                      {point.icon || '📍'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{point.name}</span>
                        {point.isActive ? (
                          point.unlocked ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-500" />
                          )
                        ) : (
                          <span className="text-xs text-red-400">维护中</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{point.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {point.category === 'city' && '🏰 主城区域'}
                        {point.category === 'wild' && '🌲 野外区域'}
                        {point.category === 'dungeon' && '⚔️ 副本入口'}
                        {point.category === 'homeland' && '🏠 家园区域'}
                      </div>
                    </div>
                    <div className="text-right">
                      {canUse ? (
                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          传送
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500">
                          {!point.unlocked && '未解锁'}
                          {!point.isActive && '已关闭'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPoints.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-5xl mb-4">🗺️</div>
              <div className="text-gray-400">暂无传送点</div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-700 bg-gray-800/50">
          <div className="text-xs text-gray-400 text-center">
            已解锁 {teleportPoints.filter((p) => p.unlocked).length} / {teleportPoints.length} 个传送点
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeleportPanel;
