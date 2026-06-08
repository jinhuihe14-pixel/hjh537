
import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { networkManager } from '../../game/network/NetworkManager';
import { X, Search, TrendingUp, Clock, Tag, History, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { AuctionOrder, TradeRecord, TradeRiskTag } from '../../types/game';
import { ITEMS } from '../../data/gameData';

const AuctionPanel: React.FC = () => {
  const { showAuction, toggleAuction, auctionOrders, setAuctionOrders, currentPlayer } = useGameStore();
  const [activeTab, setActiveTab] = useState<'market' | 'my' | 'sell' | 'records'>('market');
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const showMessage = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);
  
  useEffect(() => {
    if (showAuction && auctionOrders.length === 0) {
      const mockOrders: AuctionOrder[] = [
        {
          id: '1',
          sellerId: 'player1',
          sellerName: '神剑骑士',
          itemId: 1002,
          itemName: '精钢长剑',
          quantity: 1,
          price: 500,
          expireTime: Date.now() + 3600000 * 12,
          timestamp: Date.now(),
        },
        {
          id: '2',
          sellerId: 'player2',
          sellerName: '影子猎人',
          itemId: 2002,
          itemName: '锁子甲',
          quantity: 1,
          price: 800,
          expireTime: Date.now() + 3600000 * 8,
          timestamp: Date.now(),
        },
        {
          id: '3',
          sellerId: 'player3',
          sellerName: '魔法学徒',
          itemId: 4003,
          itemName: '魔晶',
          quantity: 10,
          price: 200,
          expireTime: Date.now() + 3600000 * 24,
          timestamp: Date.now(),
        },
        {
          id: '4',
          sellerId: 'player4',
          sellerName: '铁血战士',
          itemId: 1003,
          itemName: '烈焰之刃',
          quantity: 1,
          price: 5000,
          expireTime: Date.now() + 3600000 * 6,
          timestamp: Date.now(),
        },
        {
          id: '5',
          sellerId: 'player5',
          sellerName: '采药人',
          itemId: 4002,
          itemName: '草药',
          quantity: 99,
          price: 50,
          expireTime: Date.now() + 3600000 * 48,
          timestamp: Date.now(),
        },
        {
          id: '6',
          sellerId: 'player6',
          sellerName: '矿工老王',
          itemId: 4001,
          itemName: '铁矿石',
          quantity: 200,
          price: 30,
          expireTime: Date.now() + 3600000 * 36,
          timestamp: Date.now(),
        },
      ];
      setAuctionOrders(mockOrders);
    }
  }, [showAuction, auctionOrders.length, setAuctionOrders]);
  
  if (!showAuction) return null;
  
  const filteredOrders = auctionOrders.filter((order) => {
    if (searchText && !order.itemName.includes(searchText)) return false;
    return true;
  });
  
  const loadTradeRecords = async () => {
    try {
      setLoading(true);
      const records = await networkManager.getTradeRecords(50);
      setTradeRecords(records);
    } catch (err: any) {
      showMessage(err.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (order: AuctionOrder) => {
    try {
      setLoading(true);
      await networkManager.buyAuctionItem(order.id);
      showMessage('购买成功!', 'success');
      loadTradeRecords();
    } catch (err: any) {
      showMessage(err.message || '购买失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRiskTagColor = (tag: TradeRiskTag): { label: string; color: string; bgColor: string } => {
    switch (tag) {
      case TradeRiskTag.NORMAL:
        return { label: '正常', color: 'text-green-400', bgColor: 'bg-green-900/30' };
      case TradeRiskTag.HIGH_PRICE:
        return { label: '高价', color: 'text-red-400', bgColor: 'bg-red-900/30' };
      case TradeRiskTag.LOW_PRICE:
        return { label: '低价', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' };
      case TradeRiskTag.MANUAL_REVIEW:
        return { label: '待审核', color: 'text-orange-400', bgColor: 'bg-orange-900/30' };
      case TradeRiskTag.STUDIO_SUSPECT:
        return { label: '工作室嫌疑', color: 'text-red-500', bgColor: 'bg-red-900/40' };
      case TradeRiskTag.FIRST_TRADE:
        return { label: '首次交易', color: 'text-blue-400', bgColor: 'bg-blue-900/30' };
      case TradeRiskTag.FREQUENT_TRADE:
        return { label: '高频交易', color: 'text-purple-400', bgColor: 'bg-purple-900/30' };
      case TradeRiskTag.HIGH_VALUE:
        return { label: '高价值', color: 'text-amber-400', bgColor: 'bg-amber-900/30' };
      default:
        return { label: tag, color: 'text-gray-400', bgColor: 'bg-gray-700/50' };
    }
  };
  
  const formatTime = (expireTime: number) => {
    const remaining = expireTime - Date.now();
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return `${hours}时${minutes}分`;
  };
  
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60" onClick={toggleAuction} />
      
      <div className="relative w-[780px] h-[560px] bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg border-2 border-amber-600/70 shadow-2xl shadow-black/50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-600/50 bg-gradient-to-r from-amber-900/30 to-transparent">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            交易行
          </h2>
          <button
            onClick={toggleAuction}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-1 px-4 pt-2 border-b border-gray-700 overflow-x-auto">
          {[
            { key: 'market', label: '市场' },
            { key: 'my', label: '我的上架' },
            { key: 'sell', label: '出售物品' },
            { key: 'records', label: '交易记录' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as typeof activeTab);
                if (tab.key === 'records') loadTradeRecords();
              }}
              className={`px-4 py-2 text-sm rounded-t transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {activeTab === 'market' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-36 p-3 border-r border-gray-700 space-y-1">
              {['all', 'weapon', 'armor', 'consumable', 'material'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full px-3 py-2 text-sm text-left rounded transition-colors ${
                    selectedCategory === cat
                      ? 'bg-amber-600/30 text-amber-300 border-l-2 border-amber-500'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  {cat === 'all' && '全部'}
                  {cat === 'weapon' && '武器'}
                  {cat === 'armor' && '防具'}
                  {cat === 'consumable' && '消耗品'}
                  {cat === 'material' && '材料'}
                </button>
              ))}
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜索物品..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-1 gap-2">
                  {filteredOrders.map((order) => {
                    const item = ITEMS[order.itemId];
                    return (
                      <div
                        key={order.id}
                        className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 flex items-center gap-3 hover:border-amber-600/50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                          {item?.icon || '📦'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm">{order.itemName}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {order.quantity} 个
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            剩余 {formatTime(order.expireTime)}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-amber-400 font-bold flex items-center gap-1 justify-end">
                            <span>💰</span>
                            {order.price}
                          </div>
                          <div className="text-xs text-gray-500">卖家：{order.sellerName}</div>
                        </div>
                        
                        <button
                          onClick={() => handleBuy(order)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded transition-colors"
                        >
                          购买
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'my' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-center text-gray-500 py-8">
              暂无上架物品
            </div>
          </div>
        )}
        
        {activeTab === 'sell' && (
          <div className="flex-1 p-4">
            <div className="text-center text-gray-500 py-8">
              选择背包中的物品进行上架
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="flex-1 overflow-y-auto p-3">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && tradeRecords.length > 0 ? (
              <div className="space-y-2">
                {tradeRecords.map((record) => {
                  const isBuyer = record.buyerId === currentPlayer?.id;
                  return (
                    <div
                      key={record.id}
                      className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                          📦
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{record.itemName}</span>
                            <span className="text-xs text-gray-400">x{record.quantity}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {isBuyer ? '购买自' : '出售给'} {isBuyer ? record.sellerName : record.buyerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(record.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${isBuyer ? 'text-red-400' : 'text-green-400'}`}>
                            {isBuyer ? '-' : '+'}💰{record.totalAmount}
                          </div>
                          {record.riskTags && record.riskTags.length > 0 && (
                            <div className="flex gap-1 justify-end mt-1 flex-wrap">
                              {record.riskTags.slice(0, 2).map((tag, idx) => {
                                const tagInfo = getRiskTagColor(tag);
                                return (
                                  <span
                                    key={idx}
                                    className={`text-xs px-1.5 py-0.5 rounded ${tagInfo.color} ${tagInfo.bgColor}`}
                                  >
                                    {tagInfo.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !loading ? (
              <div className="text-center text-gray-500 py-8">
                暂无交易记录
              </div>
            ) : null}
          </div>
        )}
      </div>

      {message && (
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
          message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default AuctionPanel;
