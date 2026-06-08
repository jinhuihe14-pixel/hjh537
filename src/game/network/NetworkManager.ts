
import { io, Socket } from 'socket.io-client';
import {
  PlayerState,
  Vector3,
  ChatMessage,
  AuctionOrder,
  TeamData,
  WorldBossState,
  RankEntry,
  RankType,
  ItemSlot,
} from '../../types/game';
import { useGameStore } from '../../store/useGameStore';

class NetworkManager {
  private socket: Socket | null = null;
  private serverUrl: string = '';
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  private messageHandlers: Map<string, Array<(data: any) => void>> = new Map();
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();
  private requestId: number = 0;
  
  constructor() {}
  
  connect(url: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serverUrl = url;
      
      this.socket = io(url, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ['websocket', 'polling'],
      });
      
      this.socket.on('connect', () => {
        console.log('[Network] Connected to game server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('[Network] Disconnected:', reason);
        this.isConnected = false;
        useGameStore.getState().clearOtherPlayers();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('[Network] Connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });
      
      this.setupDefaultHandlers();
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  private setupDefaultHandlers(): void {
    if (!this.socket) return;
    
    this.socket.on('player_joined', (data: PlayerState) => {
      console.log('[Network] Player joined:', data.name);
      if (data.id !== useGameStore.getState().playerId) {
        useGameStore.getState().addOtherPlayer(data);
      }
    });
    
    this.socket.on('player_left', (playerId: string) => {
      console.log('[Network] Player left:', playerId);
      useGameStore.getState().removeOtherPlayer(playerId);
    });
    
    this.socket.on('entity_move', (data: { id: string; position: Vector3; rotation: Vector3; animation: string }) => {
      const state = useGameStore.getState();
      if (data.id === state.playerId) return;
      
      if (state.otherPlayers.has(data.id)) {
        state.updateOtherPlayer(data.id, {
          position: data.position,
          rotation: data.rotation,
          animation: data.animation,
        });
      }
    });
    
    this.socket.on('chat_message', (message: ChatMessage) => {
      useGameStore.getState().addChatMessage(message);
    });
    
    this.socket.on('entity_health', (data: { id: string; health: number }) => {
      const state = useGameStore.getState();
      if (data.id === state.playerId) {
        state.updatePlayerHealth(data.health);
      } else if (state.otherPlayers.has(data.id)) {
        state.updateOtherPlayer(data.id, { health: data.health });
      }
    });
    
    this.socket.on('team_update', (team: TeamData) => {
      useGameStore.getState().setTeam(team);
    });
    
    this.socket.on('world_boss_update', (boss: WorldBossState) => {
      console.log('[Network] World boss update:', boss.name, boss.health);
    });
    
    this.socket.on('reward_item', (data: { itemId: number; quantity: number }) => {
      useGameStore.getState().addItem(data.itemId, data.quantity, false);
    });
    
    this.socket.on('reward_gold', (amount: number) => {
      useGameStore.getState().addGold(amount);
    });
    
    this.socket.on('reward_exp', (amount: number) => {
      useGameStore.getState().addExp(amount);
    });
  }
  
  send<T = any>(cmd: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to server'));
        return;
      }
      
      const seq = ++this.requestId;
      this.pendingRequests.set(seq, { resolve, reject });
      
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(seq);
        reject(new Error(`Request ${cmd} timeout`));
      }, 10000);
      
      this.socket.emit(cmd, { seq, data }, (response: { seq: number; success: boolean; data?: T; error?: string }) => {
        clearTimeout(timeout);
        const pending = this.pendingRequests.get(response.seq);
        if (pending) {
          this.pendingRequests.delete(response.seq);
          if (response.success) {
            pending.resolve(response.data);
          } else {
            pending.reject(new Error(response.error || 'Unknown error'));
          }
        }
      });
    });
  }
  
  on(event: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }
  
  off(event: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  async login(username: string, password: string): Promise<{ token: string; player: PlayerState }> {
    return this.send<{ token: string; player: PlayerState }>('login', { username, password });
  }
  
  async register(username: string, password: string, playerClass: string): Promise<{ player: PlayerState }> {
    return this.send<{ player: PlayerState }>('register', { username, password, playerClass });
  }
  
  async enterScene(): Promise<{
    player: PlayerState;
    players: PlayerState[];
    worldBoss: WorldBossState | null;
  }> {
    return this.send('enter_scene');
  }
  
  sendMove(position: Vector3, rotation: Vector3, animation: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('move', { position, rotation, animation });
    }
  }
  
  sendAttack(targetId: string, skillId: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('attack', { targetId, skillId });
    }
  }
  
  sendChat(channel: string, content: string, targetId?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat', { channel, content, targetId });
    }
  }
  
  async useSkill(skillId: number, targetId?: string): Promise<any> {
    return this.send('use_skill', { skillId, targetId });
  }
  
  async getAuctionList(page?: number, pageSize?: number): Promise<{ orders: AuctionOrder[]; total: number }> {
    return this.send('auction_list', { page, pageSize });
  }
  
  async createAuctionOrder(itemId: number, quantity: number, price: number): Promise<AuctionOrder> {
    return this.send('auction_create', { itemId, quantity, price });
  }
  
  async buyAuctionItem(orderId: string): Promise<void> {
    return this.send('auction_buy', { orderId });
  }
  
  async createTeam(): Promise<TeamData> {
    return this.send('team_create');
  }
  
  async joinTeam(teamId: string): Promise<TeamData> {
    return this.send('team_join', { teamId });
  }
  
  async leaveTeam(): Promise<void> {
    return this.send('team_leave');
  }
  
  async inviteToTeam(playerId: string): Promise<void> {
    return this.send('team_invite', { playerId });
  }
  
  async getRank(type: RankType): Promise<RankEntry[]> {
    return this.send('rank_get', { type });
  }
  
  get isConnectedToServer(): boolean {
    return this.isConnected;
  }
  
  get socketId(): string | null {
    return this.socket?.id || null;
  }
}

export const networkManager = new NetworkManager();
export default networkManager;
