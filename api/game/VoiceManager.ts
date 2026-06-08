
import {
  VoiceChannel,
  VoiceMember,
  VoiceChannelType,
  VoiceAuditLog,
  VoiceFilterResult,
} from '../../shared/types/game.js';
import { Player } from './PlayerManager.js';

const FILTER_KEYWORDS = ['外挂', '代练', '刷金', '赌博', '诈骗', '色情', '暴力', '反动'];

enum VoiceQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

const QUALITY_BITRATE = {
  [VoiceQuality.LOW]: 16000,
  [VoiceQuality.MEDIUM]: 32000,
  [VoiceQuality.HIGH]: 64000,
};

const QUALITY_SAMPLE_RATE = {
  [VoiceQuality.LOW]: 16000,
  [VoiceQuality.MEDIUM]: 32000,
  [VoiceQuality.HIGH]: 48000,
};

interface VoiceSession {
  playerId: string;
  channelId: string;
  quality: VoiceQuality;
  bitrate: number;
  sampleRate: number;
  lastPacketTime: number;
  packetLossRate: number;
  jitter: number;
  roundTripTime: number;
}

interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'hangup';
  from: string;
  to: string;
  data: any;
  timestamp: number;
}

export class VoiceManager {
  private channels: Map<string, VoiceChannel> = new Map();
  private playerToChannel: Map<string, string> = new Map();
  private auditLogs: VoiceAuditLog[] = [];
  private maxAuditLogs: number = 5000;
  private voiceSessions: Map<string, VoiceSession> = new Map();
  private pendingSignals: Map<string, WebRTCSignal[]> = new Map();
  private violationCounts: Map<string, number> = new Map();
  private mutedPlayers: Set<string> = new Set();
  private maxViolations: number = 3;
  private muteDuration: number = 600000;

  constructor() {}

  createChannel(
    type: VoiceChannelType,
    owner: Player,
    maxMembers: number = 5
  ): VoiceChannel {
    const channelId = `voice_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const member: VoiceMember = {
      playerId: owner.id,
      playerName: owner.data.name,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
      isLeader: true,
      joinTime: Date.now(),
    };

    const channel: VoiceChannel = {
      id: channelId,
      name: `语音频道`,
      type,
      ownerId: owner.id,
      members: [member],
      maxMembers,
      createdAt: Date.now(),
      allowAllSpeak: true,
    };

    this.channels.set(channelId, channel);
    this.playerToChannel.set(owner.id, channelId);

    this.addAuditLog(channelId, owner.id, owner.data.name, 'join', '创建频道');

    return channel;
  }

  joinChannel(channelId: string, player: Player): { success: boolean; channel?: VoiceChannel; message?: string; session?: { bitrate: number; sampleRate: number } } {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return { success: false, message: '语音频道不存在' };
    }

    if (channel.members.length >= channel.maxMembers) {
      return { success: false, message: '频道已满' };
    }

    if (this.playerToChannel.has(player.id)) {
      this.leaveChannel(player.id);
    }

    const isMuted = this.mutedPlayers.has(player.id);

    const member: VoiceMember = {
      playerId: player.id,
      playerName: player.data.name,
      isMuted,
      isDeafened: false,
      isSpeaking: false,
      isLeader: player.id === channel.ownerId,
      joinTime: Date.now(),
    };

    channel.members.push(member);
    this.playerToChannel.set(player.id, channelId);

    this.initVoiceSession(player.id, channelId);

    this.addAuditLog(channelId, player.id, player.data.name, 'join', '加入频道');

    const session = this.voiceSessions.get(player.id);

    return {
      success: true,
      channel,
      session: session ? { bitrate: session.bitrate, sampleRate: session.sampleRate } : undefined,
    };
  }

  leaveChannel(playerId: string): boolean {
    const channelId = this.playerToChannel.get(playerId);
    if (!channelId) return false;

    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const member = channel.members.find((m) => m.playerId === playerId);
    if (member) {
      this.addAuditLog(channelId, playerId, member.playerName, 'leave', '离开频道');
    }

    channel.members = channel.members.filter((m) => m.playerId !== playerId);
    this.playerToChannel.delete(playerId);

    this.destroyVoiceSession(playerId);

    if (channel.members.length === 0) {
      this.channels.delete(channelId);
    } else if (channel.ownerId === playerId) {
      channel.ownerId = channel.members[0].playerId;
      channel.members[0].isLeader = true;
    }

    return true;
  }

  getPlayerChannel(playerId: string): VoiceChannel | null {
    const channelId = this.playerToChannel.get(playerId);
    return channelId ? this.channels.get(channelId) || null : null;
  }

  getChannel(channelId: string): VoiceChannel | undefined {
    return this.channels.get(channelId);
  }

  setMute(
    playerId: string,
    muted: boolean,
    operatorId?: string
  ): { success: boolean; message?: string } {
    const channelId = this.playerToChannel.get(playerId);
    if (!channelId) {
      return { success: false, message: '玩家不在语音频道中' };
    }

    const channel = this.channels.get(channelId);
    if (!channel) {
      return { success: false, message: '频道不存在' };
    }

    const member = channel.members.find((m) => m.playerId === playerId);
    if (!member) {
      return { success: false, message: '成员不存在' };
    }

    if (operatorId && operatorId !== playerId && operatorId !== channel.ownerId) {
      return { success: false, message: '无权限操作' };
    }

    member.isMuted = muted;

    this.addAuditLog(
      channelId,
      playerId,
      member.playerName,
      muted ? 'mute' : 'unmute',
      operatorId ? `由${operatorId}操作` : '自行操作'
    );

    return { success: true };
  }

  setDeafen(playerId: string, deafened: boolean): { success: boolean; message?: string } {
    const channelId = this.playerToChannel.get(playerId);
    if (!channelId) {
      return { success: false, message: '玩家不在语音频道中' };
    }

    const channel = this.channels.get(channelId);
    if (!channel) {
      return { success: false, message: '频道不存在' };
    }

    const member = channel.members.find((m) => m.playerId === playerId);
    if (!member) {
      return { success: false, message: '成员不存在' };
    }

    member.isDeafened = deafened;
    return { success: true };
  }

  setSpeaking(playerId: string, speaking: boolean): void {
    const channelId = this.playerToChannel.get(playerId);
    if (!channelId) return;

    const channel = this.channels.get(channelId);
    if (!channel) return;

    const member = channel.members.find((m) => m.playerId === playerId);
    if (member) {
      member.isSpeaking = speaking && !member.isMuted;
    }
  }

  setAllowAllSpeak(
    channelId: string,
    ownerId: string,
    allow: boolean
  ): { success: boolean; message?: string } {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return { success: false, message: '频道不存在' };
    }

    if (channel.ownerId !== ownerId) {
      return { success: false, message: '仅队长可设置' };
    }

    channel.allowAllSpeak = allow;

    if (!allow) {
      channel.members.forEach((m) => {
        if (m.playerId !== channel.ownerId) {
          m.isMuted = true;
        }
      });
    }

    return { success: true };
  }

  kickMember(
    channelId: string,
    ownerId: string,
    targetPlayerId: string
  ): { success: boolean; message?: string } {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return { success: false, message: '频道不存在' };
    }

    if (channel.ownerId !== ownerId) {
      return { success: false, message: '仅队长可操作' };
    }

    if (targetPlayerId === ownerId) {
      return { success: false, message: '不能踢出自己' };
    }

    const member = channel.members.find((m) => m.playerId === targetPlayerId);
    if (!member) {
      return { success: false, message: '目标玩家不在频道中' };
    }

    this.leaveChannel(targetPlayerId);

    return { success: true };
  }

  private addAuditLog(
    channelId: string,
    playerId: string,
    playerName: string,
    action: VoiceAuditLog['action'],
    detail?: string
  ): void {
    const log: VoiceAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelId,
      playerId,
      playerName,
      action,
      timestamp: Date.now(),
      detail,
    };

    this.auditLogs.push(log);
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxAuditLogs);
    }
  }

  createTeamVoice(teamId: string, leader: Player): VoiceChannel {
    const existingChannel = this.channels.get(`voice_team_${teamId}`);
    if (existingChannel) {
      return existingChannel;
    }

    const member: VoiceMember = {
      playerId: leader.id,
      playerName: leader.data.name,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
      isLeader: true,
      joinTime: Date.now(),
    };

    const channel: VoiceChannel = {
      id: `voice_team_${teamId}`,
      name: '队伍语音',
      type: VoiceChannelType.TEAM,
      ownerId: leader.id,
      members: [member],
      maxMembers: 5,
      createdAt: Date.now(),
      allowAllSpeak: true,
    };

    this.channels.set(channel.id, channel);
    this.playerToChannel.set(leader.id, channel.id);

    this.addAuditLog(channel.id, leader.id, leader.data.name, 'join', '创建队伍语音');

    return channel;
  }

  joinTeamVoice(teamId: string, player: Player): { success: boolean; channel?: VoiceChannel; message?: string } {
    return this.joinChannel(`voice_team_${teamId}`, player);
  }

  getChannelCount(): number {
    return this.channels.size;
  }

  getTotalMembers(): number {
    return this.playerToChannel.size;
  }

  setPlayerQuality(playerId: string, quality: VoiceQuality): { success: boolean; bitrate?: number; sampleRate?: number; message?: string } {
    const session = this.voiceSessions.get(playerId);
    if (!session) {
      return { success: false, message: '语音会话不存在' };
    }

    session.quality = quality;
    session.bitrate = QUALITY_BITRATE[quality];
    session.sampleRate = QUALITY_SAMPLE_RATE[quality];

    return {
      success: true,
      bitrate: session.bitrate,
      sampleRate: session.sampleRate,
    };
  }

  getPlayerQuality(playerId: string): { quality: VoiceQuality; bitrate: number; sampleRate: number } | null {
    const session = this.voiceSessions.get(playerId);
    if (!session) return null;
    return {
      quality: session.quality,
      bitrate: session.bitrate,
      sampleRate: session.sampleRate,
    };
  }

  updateNetworkStats(playerId: string, stats: { packetLossRate: number; jitter: number; roundTripTime: number }): { success: boolean; qualityAdjusted?: boolean; newQuality?: VoiceQuality } {
    const session = this.voiceSessions.get(playerId);
    if (!session) {
      return { success: false };
    }

    session.lastPacketTime = Date.now();
    session.packetLossRate = stats.packetLossRate;
    session.jitter = stats.jitter;
    session.roundTripTime = stats.roundTripTime;

    let qualityAdjusted = false;
    let newQuality: VoiceQuality | undefined;

    if (stats.packetLossRate > 0.1 || stats.jitter > 200 || stats.roundTripTime > 500) {
      if (session.quality !== VoiceQuality.LOW) {
        session.quality = VoiceQuality.LOW;
        session.bitrate = QUALITY_BITRATE[VoiceQuality.LOW];
        session.sampleRate = QUALITY_SAMPLE_RATE[VoiceQuality.LOW];
        qualityAdjusted = true;
        newQuality = VoiceQuality.LOW;
      }
    } else if (stats.packetLossRate > 0.05 || stats.jitter > 100 || stats.roundTripTime > 300) {
      if (session.quality === VoiceQuality.HIGH) {
        session.quality = VoiceQuality.MEDIUM;
        session.bitrate = QUALITY_BITRATE[VoiceQuality.MEDIUM];
        session.sampleRate = QUALITY_SAMPLE_RATE[VoiceQuality.MEDIUM];
        qualityAdjusted = true;
        newQuality = VoiceQuality.MEDIUM;
      }
    } else if (stats.packetLossRate < 0.01 && stats.jitter < 30 && stats.roundTripTime < 100) {
      if (session.quality === VoiceQuality.LOW) {
        session.quality = VoiceQuality.MEDIUM;
        session.bitrate = QUALITY_BITRATE[VoiceQuality.MEDIUM];
        session.sampleRate = QUALITY_SAMPLE_RATE[VoiceQuality.MEDIUM];
        qualityAdjusted = true;
        newQuality = VoiceQuality.MEDIUM;
      }
    }

    return {
      success: true,
      qualityAdjusted,
      newQuality,
    };
  }

  handleWebRTCSignal(
    fromPlayerId: string,
    toPlayerId: string,
    signalType: string,
    signalData: any
  ): { success: boolean; message?: string; signal?: WebRTCSignal } {
    const fromChannel = this.playerToChannel.get(fromPlayerId);
    const toChannel = this.playerToChannel.get(toPlayerId);

    if (!fromChannel || !toChannel || fromChannel !== toChannel) {
      return { success: false, message: '玩家不在同一语音频道' };
    }

    const signal: WebRTCSignal = {
      type: signalType as any,
      from: fromPlayerId,
      to: toPlayerId,
      data: signalData,
      timestamp: Date.now(),
    };

    const pending = this.pendingSignals.get(toPlayerId) || [];
    pending.push(signal);
    if (pending.length > 50) {
      pending.shift();
    }
    this.pendingSignals.set(toPlayerId, pending);

    return { success: true, signal };
  }

  getPendingSignals(playerId: string): WebRTCSignal[] {
    const signals = this.pendingSignals.get(playerId) || [];
    this.pendingSignals.delete(playerId);
    return signals;
  }

  hasPendingSignals(playerId: string): boolean {
    const signals = this.pendingSignals.get(playerId);
    return signals ? signals.length > 0 : false;
  }

  reportViolation(playerId: string, channelId: string, detail: string, severity: 'low' | 'medium' | 'high' = 'medium'): { success: boolean; muted?: boolean; muteDuration?: number } {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return { success: false };
    }

    const member = channel.members.find((m) => m.playerId === playerId);
    if (!member) {
      return { success: false };
    }

    this.addAuditLog(channelId, playerId, member.playerName, 'speak_violation', `${severity}: ${detail}`);

    const count = (this.violationCounts.get(playerId) || 0) + 1;
    this.violationCounts.set(playerId, count);

    let muted = false;
    let muteDuration = 0;

    if (severity === 'high' || count >= this.maxViolations) {
      this.setMute(playerId, true);
      this.mutedPlayers.add(playerId);
      muted = true;
      muteDuration = this.muteDuration;

      setTimeout(() => {
        this.mutedPlayers.delete(playerId);
        this.setMute(playerId, false);
      }, this.muteDuration);
    }

    return { success: true, muted, muteDuration };
  }

  getViolationCount(playerId: string): number {
    return this.violationCounts.get(playerId) || 0;
  }

  isPlayerMuted(playerId: string): boolean {
    return this.mutedPlayers.has(playerId);
  }

  filterVoiceText(text: string): VoiceFilterResult {
    const flaggedKeywords: string[] = [];
    const lowerText = text.toLowerCase();

    for (const keyword of FILTER_KEYWORDS) {
      if (lowerText.includes(keyword.toLowerCase())) {
        flaggedKeywords.push(keyword);
      }
    }

    return {
      safe: flaggedKeywords.length === 0,
      flaggedKeywords,
    };
  }

  getAuditLogs(
    filters?: {
      channelId?: string;
      playerId?: string;
      action?: string;
      startTime?: number;
      endTime?: number;
    },
    limit: number = 50
  ): VoiceAuditLog[] {
    let logs = this.auditLogs;

    if (filters) {
      if (filters.channelId) {
        logs = logs.filter((l) => l.channelId === filters.channelId);
      }
      if (filters.playerId) {
        logs = logs.filter((l) => l.playerId === filters.playerId);
      }
      if (filters.action) {
        logs = logs.filter((l) => l.action === filters.action);
      }
      if (filters.startTime) {
        logs = logs.filter((l) => l.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        logs = logs.filter((l) => l.timestamp <= filters.endTime!);
      }
    }

    return logs.slice(-limit).reverse();
  }

  getVoiceSession(playerId: string): VoiceSession | undefined {
    return this.voiceSessions.get(playerId);
  }

  private initVoiceSession(playerId: string, channelId: string): void {
    const session: VoiceSession = {
      playerId,
      channelId,
      quality: VoiceQuality.MEDIUM,
      bitrate: QUALITY_BITRATE[VoiceQuality.MEDIUM],
      sampleRate: QUALITY_SAMPLE_RATE[VoiceQuality.MEDIUM],
      lastPacketTime: Date.now(),
      packetLossRate: 0,
      jitter: 0,
      roundTripTime: 0,
    };
    this.voiceSessions.set(playerId, session);
  }

  private destroyVoiceSession(playerId: string): void {
    this.voiceSessions.delete(playerId);
    this.pendingSignals.delete(playerId);
  }
}

export default VoiceManager;
