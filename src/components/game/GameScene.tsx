
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { WorldManager } from '../../game/engine/WorldManager';
import { PlayerController } from '../../game/engine/PlayerController';
import { EntityManager } from '../../game/engine/EntityManager';
import { useGameStore } from '../../store/useGameStore';
import { PlayerClass, Vector3, PlayerState, EntityType } from '../../types/game';

interface GameSceneProps {
  onLoaded?: () => void;
}

const GameScene: React.FC<GameSceneProps> = ({ onLoaded }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldManagerRef = useRef<WorldManager | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);
  const entityManagerRef = useRef<EntityManager | null>(null);
  const animationFrameRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const [isReady, setIsReady] = useState(false);
  
  const {
    setCurrentPlayer,
    setInGame,
    setLoadingProgress,
    otherPlayers,
    playerId,
    currentPlayer,
    showInventory,
    showCharacter,
    showAuction,
    showTeam,
    showActivities,
    showSettings,
    showHomeland,
    showVoice,
    showTeleport,
    showHomelandVisit,
  } = useGameStore();
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 80, 200);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 300;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7c3f, 0.4);
    scene.add(hemisphereLight);
    
    const worldManager = new WorldManager(scene);
    worldManagerRef.current = worldManager;
    
    const startPosition: Vector3 = { x: 32, y: 20, z: 32 };
    worldManager.update(startPosition);
    
    const playerController = new PlayerController(worldManager, startPosition);
    playerControllerRef.current = playerController;
    scene.add(playerController.getMesh());
    
    const entityManager = new EntityManager(scene);
    entityManagerRef.current = entityManager;
    
    setTimeout(() => {
      setIsReady(true);
      setInGame(true);
      setLoadingProgress(100);
      
      const playerState: PlayerState = {
        id: playerId || 'player_001',
        type: EntityType.PLAYER,
        name: '冒险者',
        level: 1,
        playerClass: PlayerClass.WARRIOR,
        position: playerController.getPosition(),
        rotation: playerController.getRotation(),
        velocity: { x: 0, y: 0, z: 0 },
        animation: 'idle',
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        exp: 0,
        attack: 15,
        defense: 8,
        speed: 15,
        gold: 1000,
        diamond: 100,
      };
      setCurrentPlayer(playerState);
      
      onLoaded?.();
    }, 500);
    
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      const deltaTime = Math.min(clockRef.current.getDelta(), 0.1);
      
      if (playerController && camera && worldManager && isReady) {
        playerController.update(deltaTime, camera);
        
        const pos = playerController.getPosition();
        worldManager.update(pos);
        entityManager.update(deltaTime);
        
        const state = useGameStore.getState();
        if (state.currentPlayer) {
          state.updatePlayerPosition(pos);
        }
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      
      if (playerController) {
        playerController.dispose();
      }
      if (worldManager) {
        worldManager.dispose();
      }
      if (entityManager) {
        entityManager.dispose();
      }
      
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);
  
  useEffect(() => {
    if (!entityManagerRef.current) return;
    
    for (const [id, player] of otherPlayers) {
      if (!entityManagerRef.current.hasPlayer(id)) {
        entityManagerRef.current.addPlayer(player);
      }
    }
  }, [otherPlayers]);
  
  useEffect(() => {
    if (!playerControllerRef.current) return;
    
    const anyPanelOpen =
      showInventory ||
      showCharacter ||
      showAuction ||
      showTeam ||
      showActivities ||
      showSettings ||
      showHomeland ||
      showVoice ||
      showTeleport ||
      showHomelandVisit;
    
    playerControllerRef.current.setPointerLockEnabled(!anyPanelOpen);
  }, [
    showInventory,
    showCharacter,
    showAuction,
    showTeam,
    showActivities,
    showSettings,
    showHomeland,
    showVoice,
    showTeleport,
    showHomelandVisit,
  ]);
  
  useEffect(() => {
    if (!playerControllerRef.current || !currentPlayer) return;
    
    playerControllerRef.current.setOnMoveCallback((position, rotation, animation) => {
      // In a real game, this would send data to the server
    });
  }, [currentPlayer]);
  
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full cursor-crosshair"
    />
  );
};

export default GameScene;
