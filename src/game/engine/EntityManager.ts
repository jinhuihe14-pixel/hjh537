
import * as THREE from 'three';
import { PlayerState, Vector3 } from '../../types/game';
import { PlayerClass } from '../../types/game';

export class OtherPlayerEntity {
  public id: string;
  public mesh: THREE.Group;
  private currentPosition: Vector3;
  private targetPosition: Vector3;
  private currentRotation: number = 0;
  private targetRotation: number = 0;
  private animation: string = 'idle';
  private nameTag: THREE.Mesh | null = null;
  
  constructor(playerData: PlayerState) {
    this.id = playerData.id;
    this.currentPosition = { ...playerData.position };
    this.targetPosition = { ...playerData.position };
    
    this.mesh = this.createPlayerMesh(playerData.playerClass);
    this.mesh.position.set(playerData.position.x, playerData.position.y, playerData.position.z);
    
    this.createNameTag(playerData.name);
  }
  
  private createPlayerMesh(playerClass: PlayerClass): THREE.Group {
    const group = new THREE.Group();
    
    let bodyColor = 0x4a90d9;
    if (playerClass === PlayerClass.MAGE) bodyColor = 0x9b59b6;
    if (playerClass === PlayerClass.ARCHER) bodyColor = 0x2ecc71;
    if (playerClass === PlayerClass.PRIEST) bodyColor = 0xf1c40f;
    
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    group.add(body);
    
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;
    head.castShadow = true;
    group.add(head);
    
    return group;
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
    const sprite = new THREE.Sprite(material);
    
    sprite.position.y = 3.5;
    sprite.scale.set(4, 1, 1);
    
    this.mesh.add(sprite);
  }
  
  update(deltaTime: number): void {
    const lerpFactor = Math.min(1, deltaTime * 10);
    
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
  }
}

export class EntityManager {
  private scene: THREE.Scene;
  private players: Map<string, OtherPlayerEntity> = new Map();
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  addPlayer(playerData: PlayerState): void {
    if (this.players.has(playerData.id)) return;
    
    const entity = new OtherPlayerEntity(playerData);
    this.players.set(playerData.id, entity);
    this.scene.add(entity.mesh);
  }
  
  removePlayer(playerId: string): void {
    const entity = this.players.get(playerId);
    if (entity) {
      this.scene.remove(entity.mesh);
      entity.dispose();
      this.players.delete(playerId);
    }
  }
  
  updatePlayer(playerId: string, data: Partial<PlayerState>): void {
    const entity = this.players.get(playerId);
    if (entity) {
      entity.updateState(data);
    }
  }
  
  update(deltaTime: number): void {
    for (const entity of this.players.values()) {
      entity.update(deltaTime);
    }
  }
  
  getPlayerCount(): number {
    return this.players.size;
  }
  
  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }
  
  clear(): void {
    for (const entity of this.players.values()) {
      this.scene.remove(entity.mesh);
      entity.dispose();
    }
    this.players.clear();
  }
  
  dispose(): void {
    this.clear();
  }
}
