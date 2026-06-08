
import * as THREE from 'three';
import { Vector3, ChunkData, ChunkObject } from '../../types/game';

export const CHUNK_SIZE = 64;
export const CHUNK_SEGMENTS = 16;
export const VIEW_DISTANCE = 3;

export class Chunk {
  public x: number;
  public z: number;
  public data: ChunkData;
  public mesh: THREE.Mesh | null = null;
  public objects: THREE.Group | null = null;
  public isLoaded: boolean = false;
  public lodLevel: number = 0;
  
  constructor(x: number, z: number) {
    this.x = x;
    this.z = z;
    this.data = this.generateChunkData();
  }
  
  private noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  
  private smoothNoise(x: number, y: number): number {
    const corners = (this.noise2D(x - 1, y - 1) + this.noise2D(x + 1, y - 1) + 
                     this.noise2D(x - 1, y + 1) + this.noise2D(x + 1, y + 1)) / 16;
    const sides = (this.noise2D(x - 1, y) + this.noise2D(x + 1, y) + 
                   this.noise2D(x, y - 1) + this.noise2D(x, y + 1)) / 8;
    const center = this.noise2D(x, y) / 4;
    return corners + sides + center;
  }
  
  private interpolatedNoise(x: number, y: number): number {
    const intX = Math.floor(x);
    const fracX = x - intX;
    const intY = Math.floor(y);
    const fracY = y - intY;
    
    const v1 = this.smoothNoise(intX, intY);
    const v2 = this.smoothNoise(intX + 1, intY);
    const v3 = this.smoothNoise(intX, intY + 1);
    const v4 = this.smoothNoise(intX + 1, intY + 1);
    
    const i1 = v1 * (1 - fracX) + v2 * fracX;
    const i2 = v3 * (1 - fracX) + v4 * fracX;
    
    return i1 * (1 - fracY) + i2 * fracY;
  }
  
  private generateChunkData(): ChunkData {
    const terrain: number[][] = [];
    const objects: ChunkObject[] = [];
    
    const baseX = this.x * CHUNK_SIZE;
    const baseZ = this.z * CHUNK_SIZE;
    
    for (let x = 0; x <= CHUNK_SEGMENTS; x++) {
      terrain[x] = [];
      for (let z = 0; z <= CHUNK_SEGMENTS; z++) {
        const worldX = baseX + (x / CHUNK_SEGMENTS) * CHUNK_SIZE;
        const worldZ = baseZ + (z / CHUNK_SEGMENTS) * CHUNK_SIZE;
        
        let height = 0;
        height += this.interpolatedNoise(worldX * 0.01, worldZ * 0.01) * 15;
        height += this.interpolatedNoise(worldX * 0.03, worldZ * 0.03) * 5;
        height -= 5;
        
        terrain[x][z] = height;
      }
    }
    
    const numTrees = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < numTrees; i++) {
      const tx = Math.random() * CHUNK_SIZE;
      const tz = Math.random() * CHUNK_SIZE;
      const gx = Math.min(Math.floor((tx / CHUNK_SIZE) * CHUNK_SEGMENTS), CHUNK_SEGMENTS);
      const gz = Math.min(Math.floor((tz / CHUNK_SIZE) * CHUNK_SEGMENTS), CHUNK_SEGMENTS);
      const height = terrain[gx][gz];
      
      if (height > 0) {
        objects.push({
          id: `tree_${this.x}_${this.z}_${i}`,
          type: 'tree',
          position: { x: baseX + tx, y: height, z: baseZ + tz },
          rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
          scale: { x: 0.8 + Math.random() * 0.4, y: 0.8 + Math.random() * 0.4, z: 0.8 + Math.random() * 0.4 },
        });
      }
    }
    
    const numRocks = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numRocks; i++) {
      const rx = Math.random() * CHUNK_SIZE;
      const rz = Math.random() * CHUNK_SIZE;
      const gx = Math.min(Math.floor((rx / CHUNK_SIZE) * CHUNK_SEGMENTS), CHUNK_SEGMENTS);
      const gz = Math.min(Math.floor((rz / CHUNK_SIZE) * CHUNK_SEGMENTS), CHUNK_SEGMENTS);
      const height = terrain[gx][gz];
      
      objects.push({
        id: `rock_${this.x}_${this.z}_${i}`,
        type: 'rock',
        position: { x: baseX + rx, y: height, z: baseZ + rz },
        rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
        scale: { x: 0.5 + Math.random() * 1, y: 0.5 + Math.random() * 1, z: 0.5 + Math.random() * 1 },
      });
    }
    
    return {
      x: this.x,
      z: this.z,
      terrain,
      objects,
    };
  }
  
  generateMesh(scene: THREE.Scene): void {
    if (this.mesh) return;
    
    const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SEGMENTS, CHUNK_SEGMENTS);
    geometry.rotateX(-Math.PI / 2);
    
    const positions = geometry.attributes.position;
    
    for (let x = 0; x <= CHUNK_SEGMENTS; x++) {
      for (let z = 0; z <= CHUNK_SEGMENTS; z++) {
        const index = x * (CHUNK_SEGMENTS + 1) + z;
        positions.setY(index, this.data.terrain[x][z]);
      }
    }
    
    geometry.computeVertexNormals();
    
    const colors: number[] = [];
    const colorGrass = new THREE.Color(0x4a7c3f);
    const colorDirt = new THREE.Color(0x8b7355);
    const colorSand = new THREE.Color(0xc4a35a);
    const colorSnow = new THREE.Color(0xffffff);
    
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      let color: THREE.Color;
      if (y < -2) {
        color = colorSand;
      } else if (y < 2) {
        color = colorGrass;
      } else if (y < 8) {
        color = colorGrass.clone().lerp(colorDirt, (y - 2) / 6);
      } else {
        color = colorSnow;
      }
      colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(
      this.x * CHUNK_SIZE + CHUNK_SIZE / 2,
      0,
      this.z * CHUNK_SIZE + CHUNK_SIZE / 2
    );
    this.mesh.receiveShadow = true;
    
    scene.add(this.mesh);
    
    this.generateObjects(scene);
    this.isLoaded = true;
  }
  
  private generateObjects(scene: THREE.Scene): void {
    this.objects = new THREE.Group();
    
    for (const objData of this.data.objects) {
      let mesh: THREE.Object3D | null = null;
      
      if (objData.type === 'tree') {
        mesh = this.createTree(objData);
      } else if (objData.type === 'rock') {
        mesh = this.createRock(objData);
      }
      
      if (mesh) {
        mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
        mesh.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
        if (objData.scale) {
          mesh.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
        }
        this.objects.add(mesh);
      }
    }
    
    scene.add(this.objects);
  }
  
  private createTree(_data: ChunkObject): THREE.Group {
    const group = new THREE.Group();
    
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5c3d2e });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    group.add(trunk);
    
    const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 3;
    leaves.castShadow = true;
    group.add(leaves);
    
    const leaves2Geometry = new THREE.ConeGeometry(1.2, 2.5, 8);
    const leaves2 = new THREE.Mesh(leaves2Geometry, leavesMaterial);
    leaves2.position.y = 4.5;
    leaves2.castShadow = true;
    group.add(leaves2);
    
    return group;
  }
  
  private createRock(_data: ChunkObject): THREE.Mesh {
    const geometry = new THREE.DodecahedronGeometry(0.5, 0);
    const material = new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.9 });
    const rock = new THREE.Mesh(geometry, material);
    rock.castShadow = true;
    return rock;
  }
  
  dispose(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
    
    if (this.objects) {
      scene.remove(this.objects);
      this.objects.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.objects = null;
    }
    
    this.isLoaded = false;
  }
  
  getHeightAt(worldX: number, worldZ: number): number {
    const localX = worldX - this.x * CHUNK_SIZE;
    const localZ = worldZ - this.z * CHUNK_SIZE;
    
    const gridX = (localX / CHUNK_SIZE) * CHUNK_SEGMENTS;
    const gridZ = (localZ / CHUNK_SIZE) * CHUNK_SEGMENTS;
    
    const x0 = Math.floor(gridX);
    const z0 = Math.floor(gridZ);
    const x1 = Math.min(x0 + 1, CHUNK_SEGMENTS);
    const z1 = Math.min(z0 + 1, CHUNK_SEGMENTS);
    
    const fx = gridX - x0;
    const fz = gridZ - z0;
    
    const h00 = this.data.terrain[x0]?.[z0] || 0;
    const h10 = this.data.terrain[x1]?.[z0] || 0;
    const h01 = this.data.terrain[x0]?.[z1] || 0;
    const h11 = this.data.terrain[x1]?.[z1] || 0;
    
    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;
    
    return h0 * (1 - fz) + h1 * fz;
  }
}

export function getChunkKey(x: number, z: number): string {
  return `${x}_${z}`;
}

export function worldToChunk(worldX: number, worldZ: number): { x: number; z: number } {
  return {
    x: Math.floor(worldX / CHUNK_SIZE),
    z: Math.floor(worldZ / CHUNK_SIZE),
  };
}
