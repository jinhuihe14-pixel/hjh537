
import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Users, Crown, Plus, LogOut, UserPlus, Search } from 'lucide-react';
import { PlayerClass } from '../../types/game';
import { CLASS_INFO } from '../../data/gameData';

const TeamPanel: React.FC = () => {
  const { showTeam, toggleTeam, team, setTeam, currentPlayer } = useGameStore();
  const [searchText, setSearchText] = useState('');
  
  if (!showTeam) return null;
  
  const handleCreateTeam = () => {
    if (!currentPlayer) return;
    
    setTeam({
      id: 'team_1',
      leaderId: currentPlayer.id,
      maxMembers: 5,
      members: [
        {
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          level: currentPlayer.level,
          playerClass: currentPlayer.playerClass,
          health: currentPlayer.health,
          maxHealth: currentPlayer.maxHealth,
        },
      ],
    });
  };
  
  const handleLeaveTeam = () => {
    setTeam(null);
  };
  
  const handleInvitePlayer = () => {
    if (team && team.members.length < team.maxMembers) {
      const mockMember = {
        playerId: 'player_' + Math.random().toString(36).substr(2, 9),
        playerName: '神秘玩家',
        level: Math.floor(Math.random() * 30) + 10,
        playerClass: [PlayerClass.WARRIOR, PlayerClass.MAGE, PlayerClass.ARCHER, PlayerClass.PRIEST][Math.floor(Math.random() * 4)],
        health: 500,
        maxHealth: 500,
      };
      
      setTeam({
        ...team,
        members: [...team.members, mockMember],
      });
    }
  };
  
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60" onClick={toggleTeam} />
      
      <div className="relative w-[560px] h-[480px] bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg border-2 border-amber-600/70 shadow-2xl shadow-black/50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-600/50 bg-gradient-to-r from-amber-900/30 to-transparent">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Users className="w-5 h-5" />
            组队
          </h2>
          <button
            onClick={toggleTeam}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {team ? (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-gray-400 text-sm">队伍人数：</span>
                <span className="text-white font-bold">{team.members.length} / {team.maxMembers}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleInvitePlayer}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  邀请
                </button>
                <button
                  onClick={handleLeaveTeam}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  离开
                </button>
              </div>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto">
              {team.members.map((member, index) => {
                const classInfo = CLASS_INFO[member.playerClass];
                const isLeader = member.playerId === team.leaderId;
                const healthPercent = (member.health / member.maxHealth) * 100;
                
                return (
                  <div
                    key={member.playerId}
                    className={`bg-gray-800/50 rounded-lg p-3 border flex items-center gap-3 ${
                      isLeader ? 'border-amber-500/50' : 'border-gray-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-2xl border-2 border-gray-600">
                      {classInfo?.icon || '👤'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{member.playerName}</span>
                        {isLeader && (
                          <Crown className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Lv.{member.level}</span>
                        <span>{classInfo?.name}</span>
                      </div>
                      <div className="mt-1 w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
                          style={{ width: `${healthPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                        💬
                      </button>
                      {index > 0 && isLeader && (
                        <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors">
                          👢
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {team.members.length < team.maxMembers && (
              <button
                onClick={handleInvitePlayer}
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-amber-500 hover:text-amber-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                招募队友
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <Users className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">暂无队伍</h3>
            <p className="text-gray-400 text-center mb-6">
              创建队伍邀请好友一起冒险，或加入他人的队伍
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleCreateTeam}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                创建队伍
              </button>
              <button className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2">
                <Search className="w-5 h-5" />
                寻找队伍
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPanel;
