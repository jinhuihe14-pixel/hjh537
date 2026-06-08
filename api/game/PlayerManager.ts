
import { PlayerState, PlayerClass, EntityType, Vector3 } from '../../shared/types/game.js';

export class Player {
  public id: string;
  public socketId: string;
  public data: PlayerState;
  public lastMoveTime: number = 0;
  public isOnline: boolean = true;
  
  constructor(id: string, socketId: string, name: string, playerClass: PlayerClass) {
    this.id = id;
    this.socketId = socketId;
    
    this.data = {
      id,
      type: EntityType.PLAYER,
      name,
      level: 1,
      playerClass,
      position: { x: 32, y: 10, z: 32 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      animation: 'idle',
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      exp: 0,
      attack: 10,
      defense: 5,
      speed: 15,
      gold: 1000,
      diamond: 100,
    };
  }
  
  updatePosition(position: Vector3, rotation: Vector3, animation: string): void {
    this.data.position = { ...position };
    this.data.rotation = { ...rotation };
    this.data.animation = animation;
    this.lastMoveTime = Date.now();
  }
  
  takeDamage(damage: number): number {
    const actualDamage = Math.max(1, damage - this.data.defense);
    this.data.health = Math.max(0, this.data.health - actualDamage);
    return actualDamage;
  }
  
  heal(amount: number): number {
    const actualHeal = Math.min(amount, this.data.maxHealth - this.data.health);
    this.data.health += actualHeal;
    return actualHeal;
  }
  
  addExp(amount: number): void {
    this.data.exp += amount;
    
    let expToNext = this.data.level * 100;
    while (this.data.exp >= expToNext && this.data.level < 100) {
      this.data.exp -= expToNext;
      this.data.level++;
      this.data.maxHealth = 100 + this.data.level * 20;
      this.data.health = this.data.maxHealth;
      this.data.maxMana = 50 + this.data.level * 10;
      this.data.mana = this.data.maxMana;
      this.data.attack = 10 + this.data.level * 5;
      this.data.defense = 5 + this.data.level * 3;
      expToNext = this.data.level * 100;
    }
  }
  
  addGold(amount: number): void {
    this.data.gold = Math.max(0, this.data.gold + amount);
  }
  
  toPublicState(): PlayerState {
    return { ...this.data };
  }
}

export class PlayerManager {
  private players: Map<string, Player> = new Map();
  private socketToPlayer: Map<string, string> = new Map();
  
  addPlayer(id: string, socketId: string, name: string, playerClass: PlayerClass): Player {
    const player = new Player(id, socketId, name, playerClass);
    this.players.set(id, player);
    this.socketToPlayer.set(socketId, id);
    return player;
  }
  
  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      this.socketToPlayer.delete(player.socketId);
      this.players.delete(playerId);
    }
  }
  
  getPlayerById(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }
  
  getPlayerBySocketId(socketId: string): Player | undefined {
    const playerId = this.socketToPlayer.get(socketId);
    return playerId ? this.players.get(playerId) : undefined;
  }
  
  updateSocketId(playerId: string, socketId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      this.socketToPlayer.delete(player.socketId);
      player.socketId = socketId;
      this.socketToPlayer.set(socketId, playerId);
    }
  }
  
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }
  
  getOnlinePlayers(): Player[] {
    return this.getAllPlayers().filter(p => p.isOnline);
  }
  
  getPlayerCount(): number {
    return this.players.size;
  }
  
  getNearbyPlayers(position: Vector3, radius: number): Player[] {
    return this.getOnlinePlayers().filter(p => {
      const dx = p.data.position.x - position.x;
      const dz = p.data.position.z - position.z;
      return Math.sqrt(dx * dx + dz * dz) <= radius;
    });
  }
}
