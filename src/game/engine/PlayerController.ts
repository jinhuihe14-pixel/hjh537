
import * as THREE from 'three';
import { Vector3 } from '../../types/game';
import { WorldManager } from './WorldManager';

export class PlayerController {
  private mesh: THREE.Group;
  private worldManager: WorldManager;
  private keys: Set<string> = new Set();
  private velocity: Vector3 = { x: 0, y: 0, z: 0 };
  private speed: number = 15;
  private jumpForce: number = 10;
  private gravity: number = 25;
  private isGrounded: boolean = true;
  private isMoving: boolean = false;
  private yaw: number = 0;
  private pitch: number = 0.3;
  private cameraDistance: number = 12;
  private cameraHeight: number = 5;
  private targetPosition: Vector3;
  
  private moveDirection: Vector3 = { x: 0, y: 0, z: 0 };
  private lastMoveTime: number = 0;
  private moveSendInterval: number = 100;
  
  private onMoveCallback?: (position: Vector3, rotation: Vector3, animation: string) => void;
  
  constructor(worldManager: WorldManager, startPosition: Vector3 = { x: 0, y: 10, z: 0 }) {
    this.worldManager = worldManager;
    this.targetPosition = { ...startPosition };
    
    this.mesh = this.createPlayerMesh();
    this.mesh.position.set(startPosition.x, startPosition.y, startPosition.z);
    
    this.setupControls();
  }
  
  private createPlayerMesh(): THREE.Group {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90d9 });
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
    
    const hairGeometry = new THREE.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 2.5;
    hair.castShadow = true;
    group.add(hair);
    
    const swordGroup = new THREE.Group();
    const swordHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c3d2e })
    );
    swordHandle.position.y = 0.2;
    swordGroup.add(swordHandle);
    
    const swordBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 })
    );
    swordBlade.position.y = 1;
    swordGroup.add(swordBlade);
    
    swordGroup.position.set(0.7, 1.5, 0);
    swordGroup.rotation.z = -0.3;
    group.add(swordGroup);
    
    return group;
  }
  
  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      
      if (e.code === 'Space' && this.isGrounded) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this.yaw -= e.movementX * 0.002;
        this.pitch -= e.movementY * 0.002;
        this.pitch = Math.max(-0.5, Math.min(1.2, this.pitch));
      }
    });
    
    document.addEventListener('click', () => {
      const canvas = document.querySelector('canvas');
      if (canvas && !document.pointerLockElement) {
        canvas.requestPointerLock?.();
      }
    });
  }
  
  update(deltaTime: number, camera: THREE.PerspectiveCamera): void {
    this.updateMovement(deltaTime);
    this.updateCamera(camera);
    this.updateAnimation();
  }
  
  private updateMovement(deltaTime: number): void {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    let moveX = 0;
    let moveZ = 0;
    
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      moveX += forward.x;
      moveZ += forward.z;
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      moveX -= forward.x;
      moveZ -= forward.z;
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      moveX -= right.x;
      moveZ -= right.z;
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      moveX += right.x;
      moveZ += right.z;
    }
    
    const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
    this.isMoving = moveLength > 0.1;
    
    if (this.isMoving) {
      moveX /= moveLength;
      moveZ /= moveLength;
      
      this.moveDirection.x = moveX;
      this.moveDirection.z = moveZ;
      
      const targetRotation = Math.atan2(moveX, moveZ);
      this.mesh.rotation.y = this.smoothAngle(this.mesh.rotation.y, targetRotation, 0.15);
    }
    
    this.velocity.x = moveX * this.speed;
    this.velocity.z = moveZ * this.speed;
    
    this.velocity.y -= this.gravity * deltaTime;
    
    this.mesh.position.x += this.velocity.x * deltaTime;
    this.mesh.position.y += this.velocity.y * deltaTime;
    this.mesh.position.z += this.velocity.z * deltaTime;
    
    const groundHeight = this.worldManager.getHeightAt(this.mesh.position.x, this.mesh.position.z);
    if (this.mesh.position.y <= groundHeight + 0.1) {
      this.mesh.position.y = groundHeight + 0.1;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
    
    const now = Date.now();
    if (now - this.lastMoveTime > this.moveSendInterval) {
      this.lastMoveTime = now;
      if (this.onMoveCallback) {
        this.onMoveCallback(
          { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z },
          { x: 0, y: this.mesh.rotation.y, z: 0 },
          this.isMoving ? 'run' : 'idle'
        );
      }
    }
  }
  
  private smoothAngle(from: number, to: number, factor: number): number {
    let diff = to - from;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return from + diff * factor;
  }
  
  private updateCamera(camera: THREE.PerspectiveCamera): void {
    const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * this.cameraDistance;
    const offsetY = Math.sin(this.pitch) * this.cameraDistance + this.cameraHeight;
    const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * this.cameraDistance;
    
    camera.position.set(
      this.mesh.position.x + offsetX,
      this.mesh.position.y + offsetY,
      this.mesh.position.z + offsetZ
    );
    
    camera.lookAt(this.mesh.position.x, this.mesh.position.y + 1.5, this.mesh.position.z);
  }
  
  private updateAnimation(): void {
    // Animation state is sent via move callback
  }
  
  getPosition(): Vector3 {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z,
    };
  }
  
  getRotation(): Vector3 {
    return {
      x: 0,
      y: this.mesh.rotation.y,
      z: 0,
    };
  }
  
  getMesh(): THREE.Group {
    return this.mesh;
  }
  
  setPosition(position: Vector3): void {
    this.mesh.position.set(position.x, position.y, position.z);
    this.lastMoveTime = Date.now();
  }
  
  setOnMoveCallback(callback: (position: Vector3, rotation: Vector3, animation: string) => void): void {
    this.onMoveCallback = callback;
  }
  
  getYaw(): number {
    return this.yaw;
  }
  
  setYaw(yaw: number): void {
    this.yaw = yaw;
  }
  
  dispose(): void {
    this.keys.clear();
    // Clean up event listeners if needed
  }
}
