
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { PlayerManager } from './PlayerManager.js';
import { SceneManager } from './SceneManager.js';
import { AuctionManager } from './AuctionManager.js';
import { TeamManager } from './TeamManager.js';
import { ChatManager } from './ChatManager.js';
import { HomelandManager } from './HomelandManager.js';
import { VoiceManager } from './VoiceManager.js';
import { FeatureManager } from './FeatureManager.js';
import {
  PlayerClass,
  ChatMessage,
  RankType,
  FeatureType,
  VoiceChannelType,
} from '../../shared/types/game.js';

export class GameServer {
  private io: Server;
  private playerManager: PlayerManager;
  private sceneManager: SceneManager;
  private auctionManager: AuctionManager;
  private teamManager: TeamManager;
  private chatManager: ChatManager;
  private homelandManager: HomelandManager;
  private voiceManager: VoiceManager;
  private featureManager: FeatureManager;
  private tickInterval: NodeJS.Timeout | null = null;
  private tickRate: number = 20;
  
  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });
    
    this.playerManager = new PlayerManager();
    this.sceneManager = new SceneManager();
    this.auctionManager = new AuctionManager();
    this.teamManager = new TeamManager();
    this.chatManager = new ChatManager();
    this.homelandManager = new HomelandManager();
    this.voiceManager = new VoiceManager();
    this.featureManager = new FeatureManager();
    
    this.setupSocketHandlers();
    this.startGameLoop();
  }
  
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[GameServer] Client connected: ${socket.id}`);
      
      socket.on('login', async (data: { seq: number; data: { username: string; password: string } }, callback: (response: any) => void) => {
        try {
          const { username, password } = data.data;
          const playerId = `player_${username}_${Date.now()}`;
          
          const player = this.playerManager.addPlayer(
            playerId,
            socket.id,
            username,
            PlayerClass.WARRIOR
          );
          
          socket.data.playerId = playerId;
          
          console.log(`[GameServer] Player logged in: ${username} (${playerId})`);
          
          callback({
            seq: data.seq,
            success: true,
            data: {
              token: `token_${playerId}`,
              player: player.toPublicState(),
            },
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '登录失败',
          });
        }
      });
      
      socket.on('register', async (data: { seq: number; data: { username: string; password: string; playerClass: string } }, callback: (response: any) => void) => {
        try {
          const { username, password, playerClass } = data.data;
          const playerId = `player_${username}_${Date.now()}`;
          const pClass = (playerClass as PlayerClass) || PlayerClass.WARRIOR;
          
          const player = this.playerManager.addPlayer(
            playerId,
            socket.id,
            username,
            pClass
          );
          
          socket.data.playerId = playerId;
          
          callback({
            seq: data.seq,
            success: true,
            data: {
              player: player.toPublicState(),
            },
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '注册失败',
          });
        }
      });
      
      socket.on('enter_scene', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }
          
          player.isOnline = true;
          
          const otherPlayers = this.playerManager.getOnlinePlayers()
            .filter(p => p.id !== player.id)
            .map(p => p.toPublicState());
          
          const worldBoss = this.sceneManager.getWorldBoss();
          
          this.io.emit('player_joined', player.toPublicState());
          
          callback({
            seq: data.seq,
            success: true,
            data: {
              player: player.toPublicState(),
              players: otherPlayers,
              worldBoss,
            },
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '进入场景失败',
          });
        }
      });
      
      socket.on('move', (data: { position: any; rotation: any; animation: string }) => {
        const player = this.playerManager.getPlayerBySocketId(socket.id);
        if (!player) return;
        
        player.updatePosition(data.position, data.rotation, data.animation);
        
        socket.broadcast.emit('entity_move', {
          id: player.id,
          position: data.position,
          rotation: data.rotation,
          animation: data.animation,
        });
      });
      
      socket.on('chat', (data: { channel: string; content: string; targetId?: string }) => {
        const player = this.playerManager.getPlayerBySocketId(socket.id);
        if (!player) return;
        
        const message: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          senderId: player.id,
          senderName: player.data.name,
          channel: data.channel,
          content: data.content,
          timestamp: Date.now(),
        };
        
        this.chatManager.addMessage(message);
        
        if (data.channel === 'world') {
          this.io.emit('chat_message', message);
        } else if (data.channel === 'team') {
          const team = this.teamManager.getPlayerTeam(player.id);
          if (team) {
            team.members.forEach(member => {
              const memberPlayer = this.playerManager.getPlayerById(member.playerId);
              if (memberPlayer && memberPlayer.isOnline) {
                this.io.to(memberPlayer.socketId).emit('chat_message', message);
              }
            });
          }
        }
      });
      
      socket.on('use_skill', async (data: { seq: number; data: { skillId: number; targetId?: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }
          
          const { skillId, targetId } = data.data;
          let result: any = { success: true };
          
          if (targetId && targetId.startsWith('monster_')) {
            const attackResult = this.sceneManager.attackMonster(
              player,
              targetId,
              player.data.attack
            );
            
            result = {
              ...attackResult,
              targetId,
              damage: attackResult.actualDamage,
            };
            
            this.io.emit('skill_effect', {
              casterId: player.id,
              targetId,
              skillId,
              damage: attackResult.actualDamage,
              targetDied: attackResult.died,
            });
            
            if (attackResult.died) {
              this.io.emit('reward_exp', attackResult.rewards.exp);
              this.io.emit('reward_gold', attackResult.rewards.gold);
            }
          } else if (targetId === 'world_boss') {
            const bossResult = this.sceneManager.attackWorldBoss(
              player,
              player.data.attack
            );
            
            result = {
              ...bossResult,
              damage: bossResult.actualDamage,
            };
            
            this.io.emit('world_boss_update', this.sceneManager.getWorldBoss());
          }
          
          callback({
            seq: data.seq,
            success: true,
            data: result,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '技能释放失败',
          });
        }
      });
      
      socket.on('auction_list', async (data: { seq: number; data: { page?: number; pageSize?: number } }, callback: (response: any) => void) => {
        try {
          const { page = 1, pageSize = 20 } = data.data || {};
          const result = this.auctionManager.getOrders(page, pageSize);
          
          callback({
            seq: data.seq,
            success: true,
            data: result,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取拍卖列表失败',
          });
        }
      });
      
      socket.on('auction_create', async (data: { seq: number; data: { itemId: number; quantity: number; price: number } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }
          
          const { itemId, quantity, price } = data.data;
          const order = this.auctionManager.createOrder(
            player.id,
            player.data.name,
            itemId,
            quantity,
            price
          );
          
          callback({
            seq: data.seq,
            success: true,
            data: order,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '上架失败',
          });
        }
      });
      
      socket.on('auction_buy', async (data: { seq: number; data: { orderId: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }
          
          const success = this.auctionManager.buyOrder(data.data.orderId, player);
          
          callback({
            seq: data.seq,
            success,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '购买失败',
          });
        }
      });
      
      socket.on('team_create', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }
          
          const team = this.teamManager.createTeam(player);
          
          callback({
            seq: data.seq,
            success: true,
            data: team,
          });
          
          socket.emit('team_update', team);
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '创建队伍失败',
          });
        }
      });
      
      socket.on('team_join', async (data: { seq: number; data: { teamId: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }
          
          const team = this.teamManager.joinTeam(data.data.teamId, player);
          
          callback({
            seq: data.seq,
            success: true,
            data: team,
          });
          
          this.io.emit('team_update', team);
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '加入队伍失败',
          });
        }
      });
      
      socket.on('team_leave', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }
          
          const success = this.teamManager.leaveTeam(player.id);
          
          callback({
            seq: data.seq,
            success,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '离开队伍失败',
          });
        }
      });
      
      socket.on('rank_get', async (data: { seq: number; data: { type: RankType } }, callback: (response: any) => void) => {
        try {
          const rankList = this.sceneManager.getRank(data.data.type, 20);
          
          callback({
            seq: data.seq,
            success: true,
            data: rankList,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取排行榜失败',
          });
        }
      });

      socket.on('feature_state', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const state = this.featureManager.getFeatureState();
          callback({
            seq: data.seq,
            success: true,
            data: state,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取功能状态失败',
          });
        }
      });

      socket.on('teleport_list', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          const points = this.featureManager.getAllTeleportPoints(player || undefined);
          
          callback({
            seq: data.seq,
            success: true,
            data: points,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取传送点列表失败',
          });
        }
      });

      socket.on('teleport_unlock', async (data: { seq: number; data: { pointId: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.featureManager.unlockTeleportPoint(player, data.data.pointId);
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.point,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '解锁传送点失败',
          });
        }
      });

      socket.on('teleport_to', async (data: { seq: number; data: { pointId: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.featureManager.teleportTo(player, data.data.pointId);
          
          if (result.success && result.position) {
            player.updatePosition(result.position, player.data.rotation, 'idle');
            this.io.emit('entity_move', {
              id: player.id,
              position: result.position,
              rotation: player.data.rotation,
              animation: 'idle',
            });
          }
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.position,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '传送失败',
          });
        }
      });

      socket.on('homeland_get', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const featureCheck = this.featureManager.isFeatureEnabled(FeatureType.HOMELAND, player);
          if (!featureCheck.enabled) {
            callback({
              seq: data.seq,
              success: false,
              error: featureCheck.message || '家园功能不可用',
            });
            return;
          }

          const homeland = this.homelandManager.getOrCreateHomeland(player);
          
          callback({
            seq: data.seq,
            success: true,
            data: homeland,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取家园数据失败',
          });
        }
      });

      socket.on('homeland_building_configs', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const configs = this.homelandManager.getAllBuildingConfigs();
          
          callback({
            seq: data.seq,
            success: true,
            data: configs,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取建筑配置失败',
          });
        }
      });

      socket.on('homeland_unlock_plot', async (data: { seq: number; data: { plotId: number } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.homelandManager.unlockPlot(player, data.data.plotId);
          
          callback({
            seq: data.seq,
            success: result.success,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '解锁地块失败',
          });
        }
      });

      socket.on('homeland_build', async (data: { seq: number; data: { plotId: number; buildingId: number } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.homelandManager.buildBuilding(
            player,
            data.data.plotId,
            data.data.buildingId
          );
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.building,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '建造失败',
          });
        }
      });

      socket.on('homeland_collect', async (data: { seq: number; data: { plotId: number } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.homelandManager.collectProduction(player, data.data.plotId);
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.rewards,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '收取产出失败',
          });
        }
      });

      socket.on('homeland_collect_all', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.homelandManager.collectAllProduction(player);
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.totalRewards,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '一键收取失败',
          });
        }
      });

      socket.on('homeland_visit', async (data: { seq: number; data: { ownerId: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.homelandManager.visitHomeland(player, data.data.ownerId);
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.homeland,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '拜访失败',
          });
        }
      });

      socket.on('homeland_like', async (data: { seq: number; data: { ownerId: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.homelandManager.likeHomeland(player, data.data.ownerId);
          
          callback({
            seq: data.seq,
            success: result.success,
            data: { likes: result.likes },
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '点赞失败',
          });
        }
      });

      socket.on('homeland_visit_records', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const records = this.homelandManager.getVisitRecords(player.id);
          
          callback({
            seq: data.seq,
            success: true,
            data: records,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取拜访记录失败',
          });
        }
      });

      socket.on('homeland_crop_configs', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const configs = this.homelandManager.getCropConfigs();
          
          callback({
            seq: data.seq,
            success: true,
            data: configs,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取作物配置失败',
          });
        }
      });

      socket.on('homeland_plant', async (data: { seq: number; data: { plotId: number; cropId: number } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const featureCheck = this.featureManager.isFeatureEnabled(FeatureType.HOMELAND, player);
          if (!featureCheck.enabled) {
            callback({
              seq: data.seq,
              success: false,
              error: featureCheck.message || '家园功能不可用',
            });
            return;
          }

          const result = this.homelandManager.plantCrop(
            player,
            data.data.plotId,
            data.data.cropId
          );
          
          callback({
            seq: data.seq,
            success: result.success,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '种植失败',
          });
        }
      });

      socket.on('homeland_harvest', async (data: { seq: number; data: { plotId: number } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const featureCheck = this.featureManager.isFeatureEnabled(FeatureType.HOMELAND, player);
          if (!featureCheck.enabled) {
            callback({
              seq: data.seq,
              success: false,
              error: featureCheck.message || '家园功能不可用',
            });
            return;
          }

          const result = this.homelandManager.harvestCrop(player, data.data.plotId);
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.reward,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '收获失败',
          });
        }
      });

      socket.on('homeland_remove_building', async (data: { seq: number; data: { plotId: number } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const featureCheck = this.featureManager.isFeatureEnabled(FeatureType.HOMELAND, player);
          if (!featureCheck.enabled) {
            callback({
              seq: data.seq,
              success: false,
              error: featureCheck.message || '家园功能不可用',
            });
            return;
          }

          const result = this.homelandManager.removeBuilding(player, data.data.plotId);
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.refund,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '移除建筑失败',
          });
        }
      });

      socket.on('homeland_ranking', async (data: { seq: number; data: { type: string; limit?: number } }, callback: (response: any) => void) => {
        try {
          const { type = 'level', limit = 20 } = data.data || {};
          const ranking = this.homelandManager.getRanking(type as any, limit);
          
          callback({
            seq: data.seq,
            success: true,
            data: ranking,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取排行榜失败',
          });
        }
      });

      socket.on('homeland_config_version', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          callback({
            seq: data.seq,
            success: true,
            data: {
              version: this.homelandManager.getConfigVersion(),
              lastUpdate: this.homelandManager.getLastConfigUpdate(),
            },
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取配置版本失败',
          });
        }
      });

      socket.on('inventory_get', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          callback({
            seq: data.seq,
            success: true,
            data: {
              inventory: player.getInventory(),
              inventorySize: player.inventorySize,
            },
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取背包失败',
          });
        }
      });

      socket.on('voice_join_team', async (data: { seq: number; data: { teamId: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const featureCheck = this.featureManager.isFeatureEnabled(FeatureType.VOICE, player);
          if (!featureCheck.enabled) {
            callback({
              seq: data.seq,
              success: false,
              error: featureCheck.message || '语音功能不可用',
            });
            return;
          }

          const result = this.voiceManager.joinTeamVoice(data.data.teamId, player);
          
          if (result.success && result.channel) {
            result.channel.members.forEach((member) => {
              const memberPlayer = this.playerManager.getPlayerById(member.playerId);
              if (memberPlayer && memberPlayer.isOnline) {
                this.io.to(memberPlayer.socketId).emit('voice_member_joined', {
                  channelId: result.channel!.id,
                  member: result.channel!.members.find((m) => m.playerId === player.id),
                });
              }
            });
          }
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.channel,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '加入语音频道失败',
          });
        }
      });

      socket.on('voice_leave', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const channel = this.voiceManager.getPlayerChannel(player.id);
          const success = this.voiceManager.leaveChannel(player.id);
          
          if (success && channel) {
            channel.members.forEach((member) => {
              const memberPlayer = this.playerManager.getPlayerById(member.playerId);
              if (memberPlayer && memberPlayer.isOnline) {
                this.io.to(memberPlayer.socketId).emit('voice_member_left', {
                  channelId: channel.id,
                  playerId: player.id,
                });
              }
            });
          }
          
          callback({
            seq: data.seq,
            success,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '离开语音频道失败',
          });
        }
      });

      socket.on('voice_mute', async (data: { seq: number; data: { muted: boolean; targetPlayerId?: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const targetId = data.data.targetPlayerId || player.id;
          const result = this.voiceManager.setMute(targetId, data.data.muted, player.id);
          
          if (result.success) {
            const channel = this.voiceManager.getPlayerChannel(targetId);
            if (channel) {
              channel.members.forEach((member) => {
                const memberPlayer = this.playerManager.getPlayerById(member.playerId);
                if (memberPlayer && memberPlayer.isOnline) {
                  this.io.to(memberPlayer.socketId).emit('voice_mute_changed', {
                    channelId: channel.id,
                    playerId: targetId,
                    muted: data.data.muted,
                  });
                }
              });
            }
          }
          
          callback({
            seq: data.seq,
            success: result.success,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '操作失败',
          });
        }
      });

      socket.on('voice_speaking', (data: { speaking: boolean }) => {
        const player = this.playerManager.getPlayerBySocketId(socket.id);
        if (!player) return;

        this.voiceManager.setSpeaking(player.id, data.speaking);

        const channel = this.voiceManager.getPlayerChannel(player.id);
        if (channel) {
          channel.members.forEach((member) => {
            if (member.playerId !== player.id) {
              const memberPlayer = this.playerManager.getPlayerById(member.playerId);
              if (memberPlayer && memberPlayer.isOnline) {
                this.io.to(memberPlayer.socketId).emit('voice_speaking_update', {
                  playerId: player.id,
                  speaking: data.speaking,
                });
              }
            }
          });
        }
      });

      socket.on('voice_set_allow_all_speak', async (data: { seq: number; data: { channelId: string; allow: boolean } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.voiceManager.setAllowAllSpeak(
            data.data.channelId,
            player.id,
            data.data.allow
          );
          
          callback({
            seq: data.seq,
            success: result.success,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '操作失败',
          });
        }
      });

      socket.on('auction_price_history', async (data: { seq: number; data: { itemId: number } }, callback: (response: any) => void) => {
        try {
          const history = this.auctionManager.getPriceHistory(data.data.itemId);
          
          callback({
            seq: data.seq,
            success: true,
            data: history,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取价格历史失败',
          });
        }
      });

      socket.on('auction_trade_stats', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const stats = this.auctionManager.getPlayerTradeStats(player.id);
          
          callback({
            seq: data.seq,
            success: true,
            data: stats,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取交易统计失败',
          });
        }
      });

      socket.on('auction_limit_config', async (data: { seq: number }, callback: (response: any) => void) => {
        try {
          const config = this.auctionManager.getTradeLimitConfig();
          
          callback({
            seq: data.seq,
            success: true,
            data: config,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取交易限制配置失败',
          });
        }
      });

      socket.on('auction_trade_records', async (data: { seq: number; data?: { limit?: number } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const { limit = 50 } = data.data || {};
          const records = this.auctionManager.getTradeRecords({ playerId: player.id }, limit);
          
          callback({
            seq: data.seq,
            success: true,
            data: records,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取交易记录失败',
          });
        }
      });

      socket.on('voice_signal', async (data: { seq: number; data: { targetPlayerId: string; signalType: string; signalData: any } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const { targetPlayerId, signalType, signalData } = data.data;
          
          const result = this.voiceManager.handleWebRTCSignal(
            player.id,
            targetPlayerId,
            signalType,
            signalData
          );

          if (result.success) {
            const targetPlayer = this.playerManager.getPlayerById(targetPlayerId);
            if (targetPlayer && targetPlayer.isOnline) {
              this.io.to(targetPlayer.socketId).emit('voice_signal_received', {
                fromPlayerId: player.id,
                fromPlayerName: player.data.name,
                signalType,
                signalData,
              });
            }
          }
          
          callback({
            seq: data.seq,
            success: result.success,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '信令发送失败',
          });
        }
      });

      socket.on('voice_network_stats', async (data: { seq: number; data: { packetLossRate: number; jitter: number; roundTripTime: number } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const { packetLossRate, jitter, roundTripTime } = data.data;
          const result = this.voiceManager.updateNetworkStats(player.id, {
            packetLossRate,
            jitter,
            roundTripTime,
          });

          if (result.qualityAdjusted && result.newQuality) {
            callback({
              seq: data.seq,
              success: true,
              data: {
                qualityAdjusted: true,
                newQuality: result.newQuality,
              },
            });
          } else {
            callback({
              seq: data.seq,
              success: true,
              data: { qualityAdjusted: false },
            });
          }
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '网络状态上报失败',
          });
        }
      });

      socket.on('voice_quality', async (data: { seq: number; data: { quality: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const result = this.voiceManager.setPlayerQuality(player.id, data.data.quality as any);
          
          callback({
            seq: data.seq,
            success: result.success,
            data: result.success ? {
              bitrate: result.bitrate,
              sampleRate: result.sampleRate,
            } : undefined,
            error: result.message,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '设置语音质量失败',
          });
        }
      });

      socket.on('voice_violation_report', async (data: { seq: number; data: { targetPlayerId: string; detail: string; severity?: string } }, callback: (response: any) => void) => {
        try {
          const player = this.playerManager.getPlayerBySocketId(socket.id);
          if (!player) {
            callback({ seq: data.seq, success: false, error: '玩家不存在' });
            return;
          }

          const channel = this.voiceManager.getPlayerChannel(player.id);
          if (!channel) {
            callback({ seq: data.seq, success: false, error: '不在语音频道中' });
            return;
          }

          const { targetPlayerId, detail, severity = 'medium' } = data.data;
          const result = this.voiceManager.reportViolation(
            targetPlayerId,
            channel.id,
            detail,
            severity as any
          );
          
          callback({
            seq: data.seq,
            success: result.success,
            data: {
              muted: result.muted,
              muteDuration: result.muteDuration,
            },
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '举报失败',
          });
        }
      });

      socket.on('voice_audit_logs', async (data: { seq: number; data?: { limit?: number } }, callback: (response: any) => void) => {
        try {
          const { limit = 50 } = data.data || {};
          const logs = this.voiceManager.getAuditLogs(undefined, limit);
          
          callback({
            seq: data.seq,
            success: true,
            data: logs,
          });
        } catch (error) {
          callback({
            seq: data.seq,
            success: false,
            error: '获取审计日志失败',
          });
        }
      });
      
      socket.on('disconnect', () => {
        console.log(`[GameServer] Client disconnected: ${socket.id}`);
        
        const player = this.playerManager.getPlayerBySocketId(socket.id);
        if (player) {
          player.isOnline = false;
          this.voiceManager.leaveChannel(player.id);
          this.io.emit('player_left', player.id);
        }
      });
    });
  }
  
  private startGameLoop(): void {
    let lastTime = Date.now();
    
    this.tickInterval = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      
      this.sceneManager.update();
      this.homelandManager.updateHomelandTick();
      
    }, 1000 / this.tickRate);
  }
  
  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.io.close();
  }
  
  getPlayerCount(): number {
    return this.playerManager.getPlayerCount();
  }
  
  getOnlinePlayerCount(): number {
    return this.playerManager.getOnlinePlayers().length;
  }
}

export default GameServer;
