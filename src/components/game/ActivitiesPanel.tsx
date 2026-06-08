
import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Trophy, Swords, Gift, Calendar, Star, Clock, Users } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'event' | 'boss';
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  rewards: { type: string; value: string; icon: string }[];
  participants?: number;
  startTime?: string;
  endTime?: string;
}

const ActivitiesPanel: React.FC = () => {
  const { showActivities, toggleActivities } = useGameStore();
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'boss' | 'rank'>('all');
  
  const activities: Activity[] = [
    {
      id: '1',
      name: '每日签到',
      description: '每日登录签到领取丰厚奖励',
      type: 'daily',
      status: 'available',
      rewards: [
        { type: 'gold', value: '1000', icon: '💰' },
        { type: 'exp', value: '500', icon: '⭐' },
      ],
    },
    {
      id: '2',
      name: '在线奖励',
      description: '累计在线时长领取奖励',
      type: 'daily',
      status: 'in_progress',
      rewards: [
        { type: 'gold', value: '500', icon: '💰' },
        { type: 'item', value: '生命药水x5', icon: '🧪' },
      ],
    },
    {
      id: '3',
      name: '世界BOSS - 炎魔领主',
      description: '全服玩家共同挑战强大的世界BOSS',
      type: 'boss',
      status: 'available',
      participants: 1256,
      startTime: '每天 20:00',
      rewards: [
        { type: 'gold', value: '5000', icon: '💰' },
        { type: 'item', value: '史诗装备', icon: '🎁' },
        { type: 'item', value: '稀有材料', icon: '💎' },
      ],
    },
    {
      id: '4',
      name: '公会战',
      description: '公会之间的激烈战斗，争夺领地',
      type: 'weekly',
      status: 'locked',
      startTime: '每周六 19:00',
      rewards: [
        { type: 'gold', value: '10000', icon: '💰' },
        { type: 'item', value: '传说装备', icon: '👑' },
      ],
    },
    {
      id: '5',
      name: '跨服竞技场',
      description: '与其他服务器的玩家一决高下',
      type: 'event',
      status: 'available',
      participants: 3420,
      rewards: [
        { type: 'diamond', value: '100', icon: '💎' },
        { type: 'title', value: '竞技场王者', icon: '🏆' },
      ],
    },
    {
      id: '6',
      name: '双倍经验周末',
      description: '周末全天经验双倍掉落',
      type: 'event',
      status: 'in_progress',
      startTime: '周六 00:00 - 周日 24:00',
      rewards: [
        { type: 'exp', value: '200%', icon: '⭐' },
      ],
    },
  ];
  
  const filteredActivities = activities.filter((a) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'daily') return a.type === 'daily';
    if (activeTab === 'boss') return a.type === 'boss';
    if (activeTab === 'rank') return a.type === 'event';
    return true;
  });
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return 'text-green-400 bg-green-900/30';
      case 'in_progress': return 'text-blue-400 bg-blue-900/30';
      case 'completed': return 'text-gray-500 bg-gray-700/30';
      case 'locked': return 'text-gray-500 bg-gray-700/30';
      default: return 'text-gray-400';
    }
  };
  
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'available': return '可参与';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'locked': return '未开放';
      default: return '';
    }
  };
  
  if (!showActivities) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60" onClick={toggleActivities} />
      
      <div className="relative w-[700px] h-[560px] bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg border-2 border-amber-600/70 shadow-2xl shadow-black/50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-600/50 bg-gradient-to-r from-amber-900/30 to-transparent">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            活动中心
          </h2>
          <button
            onClick={toggleActivities}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-1 px-4 pt-2 border-b border-gray-700">
          {[
            { key: 'all', label: '全部', icon: Calendar },
            { key: 'daily', label: '日常', icon: Gift },
            { key: 'boss', label: 'BOSS', icon: Swords },
            { key: 'rank', label: '排行', icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 text-sm rounded-t transition-colors flex items-center gap-1 ${
                activeTab === tab.key
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`bg-gray-800/50 rounded-lg p-4 border transition-all ${
                activity.status === 'available' || activity.status === 'in_progress'
                  ? 'border-amber-600/40 hover:border-amber-500'
                  : 'border-gray-700 opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl ${
                  activity.type === 'boss' ? 'bg-red-900/50' :
                  activity.type === 'daily' ? 'bg-green-900/50' :
                  activity.type === 'event' ? 'bg-purple-900/50' :
                  'bg-blue-900/50'
                }`}>
                  {activity.type === 'boss' && '👹'}
                  {activity.type === 'daily' && '📅'}
                  {activity.type === 'event' && '🎉'}
                  {activity.type === 'weekly' && '🏰'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{activity.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                      {getStatusText(activity.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{activity.description}</p>
                  
                  {activity.startTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Clock className="w-3 h-3" />
                      {activity.startTime}
                    </div>
                  )}
                  
                  {activity.participants && (
                    <div className="flex items-center gap-1 text-xs text-cyan-400 mb-2">
                      <Users className="w-3 h-3" />
                      {activity.participants.toLocaleString()} 人参与
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">奖励：</span>
                    {activity.rewards.map((reward, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-amber-300">
                        <span>{reward.icon}</span>
                        <span>{reward.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  disabled={activity.status === 'locked' || activity.status === 'completed'}
                  className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                    activity.status === 'available'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : activity.status === 'in_progress'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {activity.status === 'available' && '立即参与'}
                  {activity.status === 'in_progress' && '查看详情'}
                  {activity.status === 'completed' && '已完成'}
                  {activity.status === 'locked' && '敬请期待'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesPanel;
