
import * as THREE from 'three';
import { PlayerState, Vector3 } from '../../types/game';
import { PlayerClass } from '../../types/game';

enum PlayerLODLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  OFF = 'off',
}

const LOD_DISTANCES = {
  high: 30,
  medium: 60,
  low: 100,
  off: Infinity,
};

const MAX_PLAYERS_HIGH = 20;
const MAX_PLAYERS_MEDIUM = 40;
const MAX_PLAYERS_TOTAL = 80;

interface PlayerEntityState {
  entity: OtherPlayerEntity;
  lastUpdateTime: number;
  lodLevel: PlayerLODLevel;
  distance: number;
  isVisible: boolean;
  priority: number;
}

export class OtherPlayerEntity {
  public id: string;
  public mesh: THREE.Group;
  private currentPosition: Vector3;
  private targetPosition: Vector3;
  private currentRotation: number = 0;
  private targetRotation: number = 0;
  private animation: string = 'idle';
  private nameTag: THREE.Sprite | null = null;
  private lodLevel: PlayerLODLevel = PlayerLODLevel.HIGH;
  private playerClass: PlayerClass;
  private highDetailMesh: THREE.Group | null = null;
  private lowDetailMesh: THREE.Group | null = null;
  
  constructor(playerData: PlayerState) {
    this.id = playerData.id;
    this.currentPosition = { ...playerData.position };
    this.targetPosition = { ...playerData.position };
    this.playerClass = playerData.playerClass;
    
    this.mesh = new THREE.Group();
    this.createHighDetailMesh();
    this.createLowDetailMesh();
    this.mesh.position.set(playerData.position.x, playerData.position.y, playerData.position.z);
    
    this.createNameTag(playerData.name);
    this.setLODLevel(PlayerLODLevel.HIGH);
  }
  
  private createHighDetailMesh(): void {
    this.highDetailMesh = new THREE.Group();
    
    let bodyColor = 0x4a90d9;
    if (this.playerClass === PlayerClass.MAGE) bodyColor = 0x9b59b6;
    if (this.playerClass === PlayerClass.ARCHER) bodyColor = 0x2ecc71;
    if (this.playerClass === PlayerClass.PRIEST) bodyColor = 0xf1c40f;
    
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    this.highDetailMesh.add(body);
    
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;
    head.castShadow = true;
    this.highDetailMesh.add(head);
    
    this.highDetailMesh.visible = false;
    this.mesh.add(this.highDetailMesh);
  }
  
  private createLowDetailMesh(): void {
    this.lowDetailMesh = new THREE.Group();
    
    let bodyColor = 0x4a90d9;
    if (this.playerClass === PlayerClass.MAGE) bodyColor = 0x9b59b6;
    if (this.playerClass === PlayerClass.ARCHER) bodyColor = 0x2ecc71;
    if (this.playerClass === PlayerClass.PRIEST) bodyColor = 0xf1c40f;
    
    const bodyGeometry = new THREE.BoxGeometry(0.8, 2, 0.5);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: bodyColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    this.lowDetailMesh.add(body);
    
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.25;
    this.lowDetailMesh.add(head);
    
    this.lowDetailMesh.visible = false;
    this.mesh.add(this.lowDetailMesh);
  }
  
  private createNameTag(name: string): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    context.font = 'bold 28px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    context.lineWidth = 4;
    context.strokeText(name, 128, 32);
    
    context.fillStyle = '#ffffff';
    context.fillText(name, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    this.nameTag = new THREE.Sprite(material);
    
    this.nameTag.position.y = 3.5;
    this.nameTag.scale.set(4, 1, 1);
    
    this.mesh.add(this.nameTag);
  }
  
  setLODLevel(level: PlayerLODLevel): void {
    if (this.lodLevel === level) return;
    
    this.lodLevel = level;
    
    if (this.highDetailMesh && this.lowDetailMesh) {
      switch (level) {
        case PlayerLODLevel.HIGH:
          this.highDetailMesh.visible = true;
          this.lowDetailMesh.visible = false;
          if (this.nameTag) this.nameTag.visible = true;
          break;
        case PlayerLODLevel.MEDIUM:
          this.highDetailMesh.visible = true;
          this.lowDetailMesh.visible = false;
          if (this.nameTag) this.nameTag.visible = true;
          break;
        case PlayerLODLevel.LOW:
          this.highDetailMesh.visible = false;
          this.lowDetailMesh.visible = true;
          if (this.nameTag) this.nameTag.visible = false;
          break;
        case PlayerLODLevel.OFF:
          this.highDetailMesh.visible = false;
          this.lowDetailMesh.visible = false;
          if (this.nameTag) this.nameTag.visible = false;
          break;
      }
    }
  }
  
  getLODLevel(): PlayerLODLevel {
    return this.lodLevel;
  }
  
  update(deltaTime: number): void {
    if (this.lodLevel === PlayerLODLevel.OFF) return;
    
    const lerpFactor = this.lodLevel === PlayerLODLevel.HIGH 
      ? Math.min(1, deltaTime * 10)
      : Math.min(1, deltaTime * 5);
    
    this.mesh.position.x += (this.targetPosition.x - this.mesh.position.x) * lerpFactor;
    this.mesh.position.y += (this.targetPosition.y - this.mesh.position.y) * lerpFactor;
    this.mesh.position.z += (this.targetPosition.z - this.mesh.position.z) * lerpFactor;
    
    let rotDiff = this.targetRotation - this.currentRotation;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    this.currentRotation += rotDiff * lerpFactor;
    this.mesh.rotation.y = this.currentRotation;
  }
  
  updateState(playerData: Partial<PlayerState>): void {
    if (playerData.position) {
      this.targetPosition = { ...playerData.position };
    }
    if (playerData.rotation) {
      this.targetRotation = playerData.rotation.y;
    }
    if (playerData.animation) {
      this.animation = playerData.animation;
    }
  }
  
  getPosition(): Vector3 {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z,
    };
  }
  
  setVisible(visible: boolean): void {
    this.mesh.visible = visible;
  }
  
  dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    if (this.nameTag) {
      if (this.nameTag.material instanceof THREE.SpriteMaterial) {
        if (this.nameTag.material.map) {
          this.nameTag.material.map.dispose();
        }
        this.nameTag.material.dispose();
      }
    }
  }
}

export class EntityManager {
  private scene: THREE.Scene;
  private players: Map<string, PlayerEntityState> = new Map();
  private cameraPosition: Vector3 = { x: 0, y: 0, z: 0 };
  private isLowEndDevice: boolean = false;
  private updateInterval: number = 0;
  private updateTimer: number = 0;
  private lodUpdateInterval: number = 0.5;
  private lodUpdateTimer: number = 0;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.detectDeviceCapability();
    this.updateInterval = this.isLowEndDevice ? 0.1 : 0.05;
  }
  
  private detectDeviceCapability(): void {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    
    if (!gl) {
      this.isLowEndDevice = true;
      return;
    }
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const lowEndKeywords = ['Mali', 'Adreno 3', 'PowerVR SGX', 'Intel HD Graphics 3000'];
      this.isLowEndDevice = lowEndKeywords.some(keyword => renderer.includes(keyword));
    }
    
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    
    if (cores <= 2 || memory <= 2) {
      this.isLowEndDevice = true;
    }
  }
  
  setCameraPosition(position: Vector3): void {
    this.cameraPosition = { ...position };
  }
  
  addPlayer(playerData: PlayerState): void {
    if (this.players.has(playerData.id)) return;
    
    if (this.players.size >= MAX_PLAYERS_TOTAL) {
      this.removeLowestPriorityPlayer();
    }
    
    const entity = new OtherPlayerEntity(playerData);
    const state: PlayerEntityState = {
      entity,
      lastUpdateTime: Date.now(),
      lodLevel: PlayerLODLevel.MEDIUM,
      distance: 0,
      isVisible: true,
      priority: 0,
    };
    
    this.players.set(playerData.id, state);
    this.scene.add(entity.mesh);
  }
  
  private removeLowestPriorityPlayer(): void {
    let lowestPriority = Infinity;
    let lowestId: string | null = null;
    
    for (const [id, state] of this.players) {
      if (state.priority < lowestPriority) {
        lowestPriority = state.priority;
        lowestId = id;
      }
    }
    
    if (lowestId) {
      this.removePlayer(lowestId);
    }
  }
  
  removePlayer(playerId: string): void {
    const state = this.players.get(playerId);
    if (state) {
      this.scene.remove(state.entity.mesh);
      state.entity.dispose();
      this.players.delete(playerId);
    }
  }
  
  updatePlayer(playerId: string, data: Partial<PlayerState>): void {
    const state = this.players.get(playerId);
    if (state) {
      state.entity.updateState(data);
      state.lastUpdateTime = Date.now();
    }
  }
  
  private updateLODLevels(): void {
    const playerEntries = Array.from(this.players.entries());
    
    for (const [id, state] of playerEntries) {
      const pos = state.entity.getPosition();
      const dx = pos.x - this.cameraPosition.x;
      const dy = pos.y - this.cameraPosition.y;
      const dz = pos.z - this.cameraPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      state.distance = distance;
      
      let lodLevel: PlayerLODLevel;
      if (distance < LOD_DISTANCES.high) {
        lodLevel = PlayerLODLevel.HIGH;
      } else if (distance < LOD_DISTANCES.medium) {
        lodLevel = PlayerLODLevel.MEDIUM;
      } else if (distance < LOD_DISTANCES.low) {
        lodLevel = PlayerLODLevel.LOW;
      } else {
        lodLevel = PlayerLODLevel.OFF;
      }
      
      if (this.isLowEndDevice) {
        if (lodLevel === PlayerLODLevel.HIGH && distance > LOD_DISTANCES.high * 0.7) {
          lodLevel = PlayerLODLevel.MEDIUM;
        }
        if (lodLevel === PlayerLODLevel.LOW && distance > LOD_DISTANCES.low * 0.6) {
          lodLevel = PlayerLODLevel.OFF;
        }
      }
      
      state.lodLevel = lodLevel;
      state.entity.setLODLevel(lodLevel);
      
      const isTeamMember = false;
      const isFriend = false;
      state.priority = 1000 - distance + (isTeamMember ? 500 : 0) + (isFriend ? 300 : 0);
    }
    
    playerEntries.sort((a, b) => b[1].priority - a[1].priority);
    
    let highCount = 0;
    let mediumCount = 0;
    
    for (const [, state] of playerEntries) {
      if (state.lodLevel === PlayerLODLevel.HIGH) {
        if (highCount >= MAX_PLAYERS_HIGH) {
          state.lodLevel = PlayerLODLevel.MEDIUM;
          state.entity.setLODLevel(PlayerLODLevel.MEDIUM);
        } else {
          highCount++;
        }
      }
      if (state.lodLevel === PlayerLODLevel.MEDIUM) {
        mediumCount++;
      }
    }
    
    if (mediumCount > MAX_PLAYERS_MEDIUM - highCount) {
      let demoted = 0;
      const toDemote = mediumCount - (MAX_PLAYERS_MEDIUM - highCount);
      for (let i = playerEntries.length - 1; i >= 0 && demoted < toDemote; i--) {
        const state = playerEntries[i][1];
        if (state.lodLevel === PlayerLODLevel.MEDIUM) {
          state.lodLevel = PlayerLODLevel.LOW;
          state.entity.setLODLevel(PlayerLODLevel.LOW);
          demoted++;
        }
      }
    }
  }
  
  update(deltaTime: number): void {
    this.updateTimer += deltaTime;
    this.lodUpdateTimer += deltaTime;
    
    if (this.lodUpdateTimer >= this.lodUpdateInterval) {
      this.lodUpdateTimer = 0;
      this.updateLODLevels();
    }
    
    if (this.updateTimer >= this.updateInterval) {
      this.updateTimer = 0;
      
      for (const state of this.players.values()) {
        if (state.lodLevel !== PlayerLODLevel.OFF) {
          state.entity.update(deltaTime);
        }
      }
    }
  }
  
  getPlayerCount(): number {
    return this.players.size;
  }
  
  getVisiblePlayerCount(): number {
    let count = 0;
    for (const state of this.players.values()) {
      if (state.lodLevel !== PlayerLODLevel.OFF) {
        count++;
      }
    }
    return count;
  }
  
  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }
  
  isLowEnd(): boolean {
    return this.isLowEndDevice;
  }
  
  clear(): void {
    for (const state of this.players.values()) {
      this.scene.remove(state.entity.mesh);
      state.entity.dispose();
    }
    this.players.clear();
  }
  
  dispose(): void {
    this.clear();
  }
}
