
import * as THREE from 'three';
import { Chunk, CHUNK_SIZE, VIEW_DISTANCE, getChunkKey, worldToChunk } from './Chunk';
import { Vector3 } from '../../types/game';

export class WorldManager {
  private scene: THREE.Scene;
  private chunks: Map<string, Chunk> = new Map();
  private playerChunkPos: { x: number; z: number } = { x: 0, z: 0 };
  private lastPlayerPos: Vector3 = { x: 0, y: 0, z: 0 };
  private chunkUpdateThreshold: number = CHUNK_SIZE * 0.3;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  update(playerPosition: Vector3): void {
    const dx = playerPosition.x - this.lastPlayerPos.x;
    const dz = playerPosition.z - this.lastPlayerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < this.chunkUpdateThreshold) return;
    
    this.lastPlayerPos = { ...playerPosition };
    
    const chunkPos = worldToChunk(playerPosition.x, playerPosition.z);
    
    if (chunkPos.x !== this.playerChunkPos.x || chunkPos.z !== this.playerChunkPos.z) {
      this.playerChunkPos = chunkPos;
      this.updateChunks();
    }
  }
  
  private updateChunks(): void {
    const { x: px, z: pz } = this.playerChunkPos;
    const neededChunks = new Set<string>();
    
    for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
      for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
        const cx = px + dx;
        const cz = pz + dz;
        const key = getChunkKey(cx, cz);
        neededChunks.add(key);
        
        if (!this.chunks.has(key)) {
          const chunk = new Chunk(cx, cz);
          this.chunks.set(key, chunk);
          chunk.generateMesh(this.scene);
        }
      }
    }
    
    for (const [key, chunk] of this.chunks) {
      if (!neededChunks.has(key)) {
        chunk.dispose(this.scene);
        this.chunks.delete(key);
      }
    }
  }
  
  getHeightAt(worldX: number, worldZ: number): number {
    const { x, z } = worldToChunk(worldX, worldZ);
    const key = getChunkKey(x, z);
    const chunk = this.chunks.get(key);
    
    if (chunk) {
      return chunk.getHeightAt(worldX, worldZ);
    }
    
    return 0;
  }
  
  getLoadedChunkCount(): number {
    return this.chunks.size;
  }
  
  getChunkKeys(): string[] {
    return Array.from(this.chunks.keys());
  }
  
  dispose(): void {
    for (const chunk of this.chunks.values()) {
      chunk.dispose(this.scene);
    }
    this.chunks.clear();
  }
}
