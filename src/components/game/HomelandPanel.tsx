
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Home, Hammer, Sprout, Users, ThumbsUp, Clock, Coins, Package, ChevronRight, MapPin, Trophy, History, Trash2 } from 'lucide-react';
import { BUILDINGS, CROPS, ITEMS } from '../../data/gameData';
import { BuildingConfig, PlacedBuilding, PlotData, CropData, VisitRecord, RankEntry, HomelandData } from '../../types/game';

const HomelandPanel: React.FC = () => {
  const { showHomeland, toggleHomeland, homeland, setHomeland, buildingConfigs, setBuildingConfigs, currentPlayer, inventory, setInventory, addItem, removeItem, addGold } = useGameStore();
  const [activeTab, setActiveTab] = useState<'build' | 'plant' | 'visit' | 'ranking' | 'records'>('build');
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [showBuildingList, setShowBuildingList] = useState(false);
  const [cropConfigs, setCropConfigs] = useState<any[]>([]);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [rankingList, setRankingList] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const hasLoadedRef = React.useRef(false);

  const buildingList = useMemo(() => Object.values(BUILDINGS), []);
  const cropList = useMemo(() => Object.values(CROPS), []);

  const showMessage = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const generateMockHomeland = useCallback((): HomelandData => {
    const state = useGameStore.getState();
    const player = state.currentPlayer;
    
    const plots: PlotData[] = [];
    for (let i = 0; i < 9; i++) {
      plots.push({
        id: i,
        unlocked: i < 4,
        unlockCost: { gold: (i + 1) * 500 },
        building: null,
        crop: null,
      });
    }
    
    const houseBuilding: PlacedBuilding = {
      instanceId: 'bld_001',
      buildingId: 5001,
      name: '小木屋',
      icon: '🏠',
      position: { x: 0, y: 0 },
      level: 1,
      buildStartTime: Date.now() - 60000,
      buildEndTime: Date.now(),
      isBuilt: true,
      remainingBuildTime: 0,
      lastCollectTime: Date.now() - 300000,
      readyToCollect: 10,
    };
    plots[0].building = houseBuilding;
    
    const farmBuilding: PlacedBuilding = {
      instanceId: 'bld_002',
      buildingId: 5101,
      name: '药草园',
      icon: '🌱',
      position: { x: 1, y: 0 },
      level: 1,
      buildStartTime: Date.now() - 120000,
      buildEndTime: Date.now(),
      isBuilt: true,
      remainingBuildTime: 0,
      lastCollectTime: Date.now() - 200000,
      readyToCollect: 5,
    };
    plots[1].building = farmBuilding;

    return {
      id: 'homeland_001',
      ownerId: player?.id || 'player_001',
      ownerName: player?.name || '冒险者',
      level: 2,
      exp: 150,
      plots,
      buildings: [houseBuilding, farmBuilding],
      crops: [],
      decorationSlots: [],
      likes: 28,
      visitors: [],
      lastVisitTime: {},
      totalVisits: 56,
    };
  }, []);

  useEffect(() => {
    if (!showHomeland) {
      hasLoadedRef.current = false;
      return;
    }
    
    if (hasLoadedRef.current) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const state = useGameStore.getState();
        if (!state.homeland) {
          const mockHomeland = generateMockHomeland();
          setHomeland(mockHomeland);
        }
        
        setBuildingConfigs(Object.values(BUILDINGS));
        setCropConfigs(Object.values(CROPS));
        hasLoadedRef.current = true;
      } catch (err: any) {
        showMessage(err.message || '加载失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [showHomeland, generateMockHomeland, setHomeland, setBuildingConfigs, showMessage]);

  useEffect(() => {
    if (!homeland || homeland.level === undefined) return;

    const timer = setInterval(() => {
      setHomeland((prev: any) => {
        if (!prev) return prev;
        const updatedPlots = prev.plots.map((plot: any) => {
          const newPlot = { ...plot };
          if (newPlot.building && newPlot.building.remainingBuildTime > 0) {
            newPlot.building = {
              ...newPlot.building,
              remainingBuildTime: Math.max(0, newPlot.building.remainingBuildTime - 1),
            };
          }
          if (newPlot.building && newPlot.building.remainingBuildTime === 0) {
            newPlot.building = {
              ...newPlot.building,
              readyToCollect: Math.min(
                newPlot.building.maxStorage || 100,
                (newPlot.building.readyToCollect || 0) + (newPlot.building.productionRate || 1)
              ),
            };
          }
          if (newPlot.crop && newPlot.crop.remainingGrowTime > 0) {
            newPlot.crop = {
              ...newPlot.crop,
              remainingGrowTime: Math.max(0, newPlot.crop.remainingGrowTime - 1),
            };
          }
          return newPlot;
        });
        return { ...prev, plots: updatedPlots };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [homeland?.id, setHomeland]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
  };

  const handleUnlockPlot = (plotId: number) => {
    if (!homeland) return;
    const plot = homeland.plots.find(p => p.id === plotId);
    if (!plot || plot.unlocked) return;
    
    const cost = plot.unlockCost?.gold || 500;
    if (currentPlayer && currentPlayer.gold < cost) {
      showMessage('金币不足!', 'error');
      return;
    }
    
    addGold(-cost);
    setHomeland((prev: any) => {
      if (!prev) return prev;
      const updatedPlots = prev.plots.map((p: PlotData) =>
        p.id === plotId ? { ...p, unlocked: true } : p
      );
      return { ...prev, plots: updatedPlots };
    });
    showMessage('地块解锁成功!', 'success');
  };

  const handleBuild = (plotId: number, buildingId: number) => {
    if (!homeland || !currentPlayer) return;
    
    const config = BUILDINGS[buildingId];
    if (!config) return;
    
    if (currentPlayer.gold < config.goldCost) {
      showMessage('金币不足!', 'error');
      return;
    }
    
    for (const mat of config.materials) {
      const slot = inventory.find(s => s && s.itemId === mat.itemId);
      if (!slot || slot.quantity < mat.quantity) {
        showMessage('材料不足!', 'error');
        return;
      }
    }
    
    addGold(-config.goldCost);
    for (const mat of config.materials) {
      removeItem(mat.itemId, mat.quantity);
    }
    
    const newBuilding: PlacedBuilding = {
      instanceId: `bld_${Date.now()}`,
      buildingId: config.id,
      name: config.name,
      icon: config.icon,
      position: { x: plotId % 3, y: Math.floor(plotId / 3) },
      level: 1,
      buildStartTime: Date.now(),
      buildEndTime: Date.now() + config.buildTime * 1000,
      isBuilt: false,
      remainingBuildTime: config.buildTime,
      lastCollectTime: Date.now(),
      readyToCollect: 0,
    };
    
    setHomeland((prev: any) => {
      if (!prev) return prev;
      const updatedPlots = prev.plots.map((p: PlotData) =>
        p.id === plotId ? { ...p, building: newBuilding } : p
      );
      return { ...prev, plots: updatedPlots, buildings: [...prev.buildings, newBuilding] };
    });
    
    showMessage('开始建造!', 'success');
    setShowBuildingList(false);
    setSelectedPlot(null);
  };

  const handleCollect = (plotId: number) => {
    if (!homeland) return;
    
    const plot = homeland.plots.find(p => p.id === plotId);
    if (!plot || !plot.building || plot.building.readyToCollect <= 0) return;
    
    const buildingConfig = BUILDINGS[plot.building.buildingId];
    const productionItem = buildingConfig?.production?.itemId;
    const amount = plot.building.readyToCollect;
    
    if (productionItem) {
      addItem(productionItem, amount);
    }
    
    setHomeland((prev: any) => {
      if (!prev) return prev;
      const updatedPlots = prev.plots.map((p: PlotData) => {
        if (p.id === plotId && p.building) {
          return {
            ...p,
            building: {
              ...p.building,
              readyToCollect: 0,
              lastCollectTime: Date.now(),
            },
          };
        }
        return p;
      });
      return { ...prev, plots: updatedPlots };
    });
    
    showMessage(`收取成功! +${amount}`, 'success');
  };

  const handleCollectAll = () => {
    if (!homeland) return;
    
    let totalCollected = 0;
    
    setHomeland((prev: any) => {
      if (!prev) return prev;
      const updatedPlots = prev.plots.map((p: PlotData) => {
        if (p.building && p.building.readyToCollect > 0) {
          const buildingConfig = BUILDINGS[p.building.buildingId];
          const productionItem = buildingConfig?.production?.itemId;
          const amount = p.building.readyToCollect;
          
          if (productionItem) {
            addItem(productionItem, amount);
            totalCollected += amount;
          }
          
          return {
            ...p,
            building: {
              ...p.building,
              readyToCollect: 0,
              lastCollectTime: Date.now(),
            },
          };
        }
        return p;
      });
      return { ...prev, plots: updatedPlots };
    });
    
    showMessage(`一键收取成功! 共获得 ${totalCollected} 个物品`, 'success');
  };

  const handlePlant = (plotId: string, cropId: number) => {
    showMessage('种植功能开发中...', 'success');
  };

  const handleHarvest = (plotId: number) => {
    showMessage('收获功能开发中...', 'success');
  };

  const handleRemoveBuilding = (plotId: number) => {
    if (!window.confirm('确定要移除这个建筑吗？会返还部分材料。')) return;
    if (!homeland) return;
    
    const plot = homeland.plots.find(p => p.id === plotId);
    if (!plot || !plot.building) return;
    
    const config = BUILDINGS[plot.building.buildingId];
    if (config) {
      addGold(Math.floor(config.goldCost * 0.5));
      for (const mat of config.materials) {
        addItem(mat.itemId, Math.floor(mat.quantity * 0.5));
      }
    }
    
    setHomeland((prev: any) => {
      if (!prev) return prev;
      const updatedPlots = prev.plots.map((p: PlotData) =>
        p.id === plotId ? { ...p, building: null } : p
      );
      const updatedBuildings = prev.buildings.filter(
        (b: PlacedBuilding) => b.instanceId !== plot.building?.instanceId
      );
      return { ...prev, plots: updatedPlots, buildings: updatedBuildings };
    });
    
    showMessage('建筑已移除，返还50%材料', 'success');
  };

  const handleVisit = (playerId: string) => {
    showMessage('拜访功能开发中...', 'success');
  };

  const handleLike = (homelandId: string) => {
    showMessage('点赞功能开发中...', 'success');
  };

  const loadVisitRecords = () => {
    const mockRecords: VisitRecord[] = [
      { visitorId: 'v1', visitorName: '神剑骑士', visitTime: Date.now() - 3600000, liked: true },
      { visitorId: 'v2', visitorName: '影子猎人', visitTime: Date.now() - 7200000, liked: false },
      { visitorId: 'v3', visitorName: '魔法学徒', visitTime: Date.now() - 86400000, liked: true },
    ];
    setVisitRecords(mockRecords);
  };

  const loadRanking = (type: string = 'level') => {
    const mockRanking: RankEntry[] = [
      { rank: 1, playerId: 'r1', playerName: '天下第一', level: 60, value: 60 },
      { rank: 2, playerId: 'r2', playerName: '逍遥散人', level: 55, value: 55 },
      { rank: 3, playerId: 'r3', playerName: '暗夜精灵', level: 52, value: 52 },
      { rank: 4, playerId: 'r4', playerName: '烈焰战士', level: 48, value: 48 },
      { rank: 5, playerId: 'r5', playerName: '清风明月', level: 45, value: 45 },
    ];
    setRankingList(mockRanking);
  };

  const canAfford = (config: BuildingConfig): boolean => {
    if (!currentPlayer) return false;
    if (currentPlayer.gold < config.goldCost) return false;
    return config.materials.every((m) => {
      const slot = inventory.find((s) => s && s.itemId === m.itemId);
      return slot && slot.quantity >= m.quantity;
    });
  };

  const renderPlot = (plot: PlotData, index: number) => {
    const building = plot.building;
    const crop = plot.crop;
    const isBuilding = building && building.remainingBuildTime > 0;
    const hasProduction = building ? building.readyToCollect > 0 : false;

    return (
      <div
        key={plot.id}
        className={`relative aspect-square rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
          plot.unlocked
            ? building
              ? 'border-green-500 bg-green-900/30'
              : 'border-amber-500/50 bg-amber-900/20 hover:bg-amber-900/40'
            : 'border-gray-600 bg-gray-800/50'
        }`}
        onClick={() => {
          if (plot.unlocked && !building) {
            setSelectedPlot(plot.id);
            setShowBuildingList(true);
          } else if (!plot.unlocked) {
            handleUnlockPlot(plot.id);
          }
        }}
      >
        {plot.unlocked ? (
          building ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
              <div className="text-2xl mb-1">{building.icon || '🏠'}</div>
              <div className="text-xs text-white/80 truncate w-full text-center">
                {building.name}
              </div>
              {isBuilding && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-md">
                  <Clock className="w-5 h-5 text-amber-400 mb-1 animate-pulse" />
                  <div className="text-xs text-amber-300">
                    建造中
                  </div>
                  <div className="text-xs text-white/70">
                    {formatTime(building.remainingBuildTime)}
                  </div>
                </div>
              )}
              {!isBuilding && hasProduction && (
                <div
                  className="absolute bottom-1 right-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold cursor-pointer hover:bg-yellow-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCollect(plot.id);
                  }}
                >
                  {building!.readyToCollect}
                </div>
              )}
              {!isBuilding && crop && crop.remainingGrowTime > 0 && (
                <div className="absolute bottom-1 left-1 text-xs text-green-300">
                  {formatTime(crop.remainingGrowTime)}
                </div>
              )}
              {!isBuilding && crop && crop.remainingGrowTime <= 0 && (
                <div
                  className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold cursor-pointer hover:bg-green-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCollect(plot.id);
                  }}
                >
                  收获
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Hammer className="w-8 h-8 text-amber-500/60" />
              <div className="text-xs text-amber-400/60 mt-1">空地</div>
            </div>
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl">🔒</div>
            <div className="text-xs text-gray-400 mt-1">未解锁</div>
          </div>
        )}
      </div>
    );
  };

  const renderBuildingList = () => {
    if (!showBuildingList || !selectedPlot) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-4 w-96 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">选择建筑</h3>
            <button
              onClick={() => {
                setShowBuildingList(false);
                setSelectedPlot(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {buildingConfigs.map((config) => {
              const affordable = canAfford(config);
              return (
                <div
                  key={config.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    affordable
                      ? 'border-green-500/50 bg-green-900/20 hover:bg-green-900/40'
                      : 'border-gray-600 bg-gray-700/50 opacity-60'
                  }`}
                  onClick={() => affordable && handleBuild(selectedPlot!, config.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{config.icon}</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{config.name}</div>
                      <div className="text-xs text-gray-400">{config.description}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <div className="text-xs text-amber-300 flex items-center gap-1">
                      <span>💰</span>
                      <span>金币</span>
                      <span>x{config.goldCost}</span>
                    </div>
                    {config.materials.map((mat, idx) => {
                      const item = ITEMS[mat.itemId];
                      return (
                        <div key={idx} className="text-xs text-gray-300 flex items-center gap-1">
                          <span>{item?.icon || '📦'}</span>
                          <span>{item?.name || `物品${mat.itemId}`}</span>
                          <span className="text-amber-300">x{mat.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    建造时间: {formatTime(config.buildTime)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (!showHomeland) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40">
      <div className="absolute inset-0 bg-black/60" onClick={toggleHomeland} />
      <div className="relative bg-gray-900 rounded-xl w-[700px] max-w-[95vw] max-h-[85vh] flex flex-col shadow-2xl border border-gray-700">
        {message && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
            message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 rounded-xl">
            <div className="text-white flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">加载中...</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">我的家园</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCollectAll}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
            >
              <Package className="w-4 h-4" />
              一键收取
            </button>
            <button onClick={toggleHomeland} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-700 overflow-x-auto">
          {[
            { key: 'build', label: '建造', icon: Hammer },
            { key: 'plant', label: '种植', icon: Sprout },
            { key: 'visit', label: '拜访', icon: Users },
            { key: 'ranking', label: '排行', icon: Trophy },
            { key: 'records', label: '记录', icon: History },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                if (tab.key === 'ranking') loadRanking();
                if (tab.key === 'records') loadVisitRecords();
              }}
              className={`flex-1 min-w-max py-3 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-green-400 border-b-2 border-green-400 bg-green-900/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'build' && homeland && (
            <div className="grid grid-cols-3 gap-3">
              {homeland.plots.map((plot, index) => renderPlot(plot, index))}
            </div>
          )}

          {activeTab === 'plant' && (
            <div>
              <div className="text-gray-400 text-sm mb-3">选择作物种植在农场建筑上</div>
              <div className="grid grid-cols-2 gap-3">
                {cropList.map((crop) => (
                  <div
                    key={crop.id}
                    className="p-3 rounded-lg bg-green-900/20 border border-green-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{crop.icon}</div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{crop.name}</div>
                        <div className="text-xs text-gray-400">生长: {formatTime(crop.growTime)}</div>
                        <div className="text-xs text-green-400">产量: {crop.yield}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-amber-300">
                      种子ID: {crop.seedItemId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'visit' && (
            <div>
              <div className="text-gray-400 text-sm mb-3">好友家园</div>
              <div className="space-y-2">
                {[
                  { id: 'f1', name: '神剑骑士', level: 15, likes: 128, buildings: 8 },
                  { id: 'f2', name: '影子猎人', level: 12, likes: 95, buildings: 6 },
                  { id: 'f3', name: '魔法学徒', level: 18, likes: 210, buildings: 9 },
                ].map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => handleVisit(friend.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      {friend.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{friend.name}</div>
                      <div className="text-xs text-gray-400">
                        等级 {friend.level} · {friend.buildings} 个建筑
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-pink-400 flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {friend.likes}
                      </div>
                      <button
                        className="px-2 py-1 bg-pink-500 hover:bg-pink-400 text-white text-xs rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(friend.id);
                        }}
                      >
                        点赞
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div>
              <div className="flex gap-2 mb-4">
                <button
                  className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white"
                  onClick={() => loadRanking('level')}
                >
                  等级榜
                </button>
                <button
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                  onClick={() => loadRanking('likes')}
                >
                  人气榜
                </button>
                <button
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                  onClick={() => loadRanking('wealth')}
                >
                  财富榜
                </button>
              </div>
              <div className="space-y-2">
                {rankingList.length > 0 ? (
                  rankingList.map((entry: any, index: number) => (
                    <div
                      key={entry.playerId || index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-800"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-300 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {entry.playerName?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{entry.playerName || `玩家${index + 1}`}</div>
                        <div className="text-xs text-gray-400">
                          {entry.value !== undefined ? `数值: ${entry.value}` : entry.description || ''}
                        </div>
                      </div>
                      <div className="text-green-400 font-bold">
                        {entry.score || entry.value || 0}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无排行数据
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              <div className="text-gray-400 text-sm mb-3">最近访客</div>
              <div className="space-y-2">
                {visitRecords.length > 0 ? (
                  visitRecords.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-800"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        {record.visitorName?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{record.visitorName || '匿名玩家'}</div>
                        <div className="text-xs text-gray-400">
                          {record.visitTime ? new Date(record.visitTime).toLocaleString() : ''}
                        </div>
                      </div>
                      {record.liked && (
                        <div className="text-xs text-pink-400 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          已点赞
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无访客记录
                  </div>
                )}
              </div>
            </div>
          )}

          {!homeland && activeTab === 'build' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <div className="text-gray-400">正在加载家园数据...</div>
            </div>
          )}
        </div>

        {homeland && (
          <div className="p-3 border-t border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="text-gray-400">
                  家园等级: <span className="text-green-400 font-medium">Lv.{homeland.level}</span>
                </div>
                <div className="text-gray-400">
                  已建造: <span className="text-amber-400 font-medium">{homeland.plots.filter(p => p.building).length}/9</span>
                </div>
              </div>
              <div className="text-gray-400">
                总来访: <span className="text-blue-400 font-medium">{homeland.totalVisits}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {renderBuildingList()}
    </div>
  );
};

export default HomelandPanel;
