
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { PlayerManager } from './PlayerManager.js';
import { SceneManager } from './SceneManager.js';
import { AuctionManager } from './AuctionManager.js';
import { TeamManager } from './TeamManager.js';
import { ChatManager } from './ChatManager.js';
import { PlayerClass, ChatMessage, RankType } from '../../shared/types/game.js';

export class GameServer {
  private io: Server;
  private playerManager: PlayerManager;
  private sceneManager: SceneManager;
  private auctionManager: AuctionManager;
  private teamManager: TeamManager;
  private chatManager: ChatManager;
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
      
      socket.on('disconnect', () => {
        console.log(`[GameServer] Client disconnected: ${socket.id}`);
        
        const player = this.playerManager.getPlayerBySocketId(socket.id);
        if (player) {
          player.isOnline = false;
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
