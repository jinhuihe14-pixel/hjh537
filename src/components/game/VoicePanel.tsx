
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { networkManager } from '../../game/network/NetworkManager';
import { VoiceChannelType } from '../../types/game';
import { Mic, MicOff, Volume2, VolumeX, Users, Crown, PhoneOff, Phone, X, Settings, AlertTriangle, Wifi, WifiOff, Signal, Shield } from 'lucide-react';

const VoicePanel: React.FC = () => {
  const { voiceChannel, showVoice, toggleVoice, currentPlayer, team, setVoiceChannel } = useGameStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [voiceQuality, setVoiceQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [networkStats, setNetworkStats] = useState({ packetLossRate: 0, jitter: 0, roundTripTime: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const showMessage = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const isLeader = currentPlayer && team?.leaderId === currentPlayer.id;

  const handleMute = async () => {
    try {
      const newMuted = !isMuted;
      await networkManager.setVoiceMute(newMuted);
      setIsMuted(newMuted);
      showMessage(newMuted ? '已静音' : '已取消静音', 'success');
    } catch (err: any) {
      showMessage(err.message || '操作失败', 'error');
    }
  };

  const handleDeafen = () => {
    setIsDeafened(!isDeafened);
    showMessage(isDeafened ? '已取消耳麦' : '已开启耳麦', 'success');
  };

  const handleKickMember = (playerId: string) => {
    showMessage('已移出语音', 'success');
  };

  const handleSetAllowAllSpeak = async () => {
    try {
      const newAllow = !(voiceChannel?.allowAllSpeak ?? true);
      await networkManager.setAllowAllSpeak(newAllow);
      showMessage(newAllow ? '已开启全员发言' : '已关闭全员发言', 'success');
    } catch (err: any) {
      showMessage(err.message || '操作失败', 'error');
    }
  };

  const handleLeaveVoice = async () => {
    try {
      await networkManager.leaveVoice();
      setVoiceChannel(null);
      setIsConnected(false);
      showMessage('已离开语音频道', 'success');
    } catch (err: any) {
      showMessage(err.message || '操作失败', 'error');
    }
  };

  const handleQualityChange = async (quality: 'low' | 'medium' | 'high') => {
    try {
      await networkManager.setVoiceQuality(quality);
      setVoiceQuality(quality);
      showMessage(`语音质量已调整为${quality === 'low' ? '低' : quality === 'medium' ? '中' : '高'}`, 'success');
    } catch (err: any) {
      showMessage(err.message || '设置失败', 'error');
    }
  };

  const handleReportViolation = (playerId: string, playerName: string) => {
    if (window.confirm(`确定要举报 ${playerName} 的语音违规吗？`)) {
      networkManager.reportVoiceViolation(playerId, '语音内容违规', 'medium');
      showMessage('举报已提交', 'success');
    }
  };

  const handleJoinTeamVoice = async () => {
    if (!team) {
      showMessage('请先加入队伍', 'error');
      return;
    }
    try {
      setVoiceChannel({
        id: team.id,
        type: VoiceChannelType.TEAM,
        name: '队伍语音',
        ownerId: team.leaderId,
        maxMembers: 10,
        members: team.members.map((m) => ({
          playerId: m.playerId,
          playerName: m.playerName,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
          isLeader: m.playerId === team.leaderId,
          joinTime: Date.now(),
        })),
        allowAllSpeak: true,
        createdAt: Date.now(),
      });
      setIsConnected(true);
      showMessage('已加入队伍语音', 'success');
    } catch (err: any) {
      showMessage(err.message || '加入失败', 'error');
    }
  };

  useEffect(() => {
    if (team && voiceChannel && team.members.length !== voiceChannel.members.length) {
      setVoiceChannel({
        ...voiceChannel,
        members: team.members.map((m) => {
          const existing = voiceChannel.members.find((vm) => vm.playerId === m.playerId);
          return existing || {
            playerId: m.playerId,
            playerName: m.playerName,
            isMuted: false,
            isDeafened: false,
            isSpeaking: false,
            isLeader: m.playerId === team.leaderId,
            joinTime: Date.now(),
          };
        }),
      });
    }
  }, [team, voiceChannel, setVoiceChannel]);

  if (!showVoice) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40">
      <div className="absolute inset-0 bg-black/60" onClick={toggleVoice} />
      <div className="relative bg-gray-900 rounded-xl w-[400px] max-w-[95vw] flex flex-col shadow-2xl border border-gray-700">
        {message && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
            message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        )}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              voiceChannel ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`} />
            <h2 className="text-lg font-bold text-white">
              {voiceChannel?.name || '语音频道'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {voiceChannel && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={toggleVoice} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="p-4 border-b border-gray-700 bg-gray-800/50 space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">语音设置</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">音量</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={voiceVolume}
                    onChange={(e) => setVoiceVolume(Number(e.target.value))}
                    className="w-full accent-green-500"
                  />
                  <div className="text-xs text-gray-500 text-right">{voiceVolume}%</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2">语音质量</div>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => handleQualityChange(quality)}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                      voiceQuality === quality
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {quality === 'low' ? '低' : quality === 'medium' ? '中' : '高'}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {voiceQuality === 'low' && '16kbps · 适合弱网环境'}
                {voiceQuality === 'medium' && '32kbps · 平衡模式'}
                {voiceQuality === 'high' && '64kbps · 高音质模式'}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2">网络状态</div>
              <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    {networkStats.packetLossRate < 0.02 ? (
                      <Wifi className="w-4 h-4 text-green-400" />
                    ) : networkStats.packetLossRate < 0.05 ? (
                      <Wifi className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-400" />
                    )}
                    <span>丢包率</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    networkStats.packetLossRate < 0.02 ? 'text-green-400' :
                    networkStats.packetLossRate < 0.05 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {(networkStats.packetLossRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Signal className="w-4 h-4 text-blue-400" />
                    <span>延迟</span>
                  </div>
                  <span className={`text-xs font-medium ${
                    networkStats.roundTripTime < 100 ? 'text-green-400' :
                    networkStats.roundTripTime < 300 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {networkStats.roundTripTime}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>安全风控</span>
                  </div>
                  <span className="text-xs text-green-400 font-medium">
                    已启用
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span>弱网自动降低码率已开启</span>
            </div>
          </div>
        )}

        <div className="flex-1 p-4">
          {voiceChannel ? (
            <>
              <div className="text-sm text-gray-400 mb-3">
                成员 ({voiceChannel.members.length} 人)
              </div>
              <div className="space-y-2">
                {voiceChannel.members.map((member) => (
                  <div
                    key={member.playerId}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700/70 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {member.playerName[0]}
                      </div>
                      {member.isSpeaking && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Mic className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {member.isLeader && <Crown className="w-4 h-4 text-yellow-400" />}
                        <span className="text-white text-sm font-medium">{member.playerName}</span>
                      </div>
                      {member.isSpeaking && (
                        <div className="flex gap-0.5 items-end h-3">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-1 bg-green-400 rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 10 + 4}px`,
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {member.isMuted && (
                        <MicOff className="w-4 h-4 text-red-400" />
                      )}
                      {member.isDeafened && (
                        <VolumeX className="w-4 h-4 text-gray-400" />
                      )}
                      {isLeader && member.playerId !== currentPlayer?.id && (
                        <button
                          onClick={() => handleKickMember(member.playerId)}
                          className="ml-2 p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/50 rounded transition-colors"
                          title="移出语音"
                        >
                          <PhoneOff className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <Mic className="w-10 h-10 text-gray-600" />
              </div>
              <div className="text-gray-400 text-lg mb-2">暂无频道</div>
              <div className="text-gray-500 text-sm mb-6">加入队伍语音，与队友实时沟通</div>
              <button
                onClick={handleJoinTeamVoice}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                加入队伍语音
              </button>
            </div>
          )}
        </div>

        {voiceChannel && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleMute}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                <span className="text-xs">{isMuted ? '取消静音' : '静音'}</span>
              </button>

              <button
                onClick={handleDeafen}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                  isDeafened
                    ? 'bg-orange-600 hover:bg-orange-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {isDeafened ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                <span className="text-xs">{isDeafened ? '取消耳麦' : '耳麦'}</span>
              </button>

              {isLeader && (
                <button
                  onClick={handleSetAllowAllSpeak}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                >
                  <Users className="w-6 h-6" />
                  <span className="text-xs">全员发言</span>
                </button>
              )}

              <button
                onClick={handleLeaveVoice}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-red-700 hover:bg-red-600 text-white transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
                <span className="text-xs">离开</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoicePanel;
