
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ObstacleData, CoinData, PowerUpData } from '../types';
import { LANE_WIDTH, COLORS } from '../constants';

export const Obstacle: React.FC<{ data: ObstacleData }> = ({ data }) => {
  const x = data.lane * LANE_WIDTH;
  
  if (data.type === 'hound') {
    return (
      <group position={[x, 0.4, data.z]}>
        {/* Low Poly Dog Body */}
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.8, 1.8]} />
          <meshStandardMaterial color={COLORS.HOUND} />
        </mesh>
        {/* Head with glowing eyes */}
        <mesh position={[0, 0.4, 0.8]}>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color={COLORS.HOUND} />
        </mesh>
        <mesh position={[0.2, 0.5, 1.1]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial emissive="#ff0000" emissiveIntensity={5} color="#ff0000" />
        </mesh>
        <mesh position={[-0.2, 0.5, 1.1]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial emissive="#ff0000" emissiveIntensity={5} color="#ff0000" />
        </mesh>
      </group>
    );
  }

  if (data.type === 'low-bar') {
    return (
      <mesh position={[x, 2.2, data.z]} castShadow>
        <boxGeometry args={[3, 0.1, 0.2]} />
        <meshStandardMaterial color={COLORS.LASER} emissive={COLORS.LASER} emissiveIntensity={2} />
      </mesh>
    );
  }

  return (
    <mesh position={[x, 0.75, data.z]} castShadow>
      <boxGeometry args={[2.8, 1.5, 0.8]} />
      <meshStandardMaterial color={COLORS.METAL} />
    </mesh>
  );
};

export const Coin: React.FC<{ data: CoinData }> = ({ data }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 3; });
  return (
    <mesh ref={ref} position={[data.lane * LANE_WIDTH, 0.8, data.z]} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.15, 8]} rotation={[Math.PI / 2, 0, 0]} />
      <meshStandardMaterial color={COLORS.COIN} emissive={COLORS.COIN} emissiveIntensity={0.5} />
    </mesh>
  );
};

export const PowerUp: React.FC<{ data: PowerUpData }> = ({ data }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.05;
      ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
    }
  });

  const color = data.type === 'shield' ? COLORS.SHIELD : data.type === 'speed' ? COLORS.SPEED : COLORS.MAGNET;

  return (
    <group ref={ref} position={[data.lane * LANE_WIDTH, 1, data.z]}>
      <mesh castShadow>
        <octahedronGeometry args={[0.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.8} />
      </mesh>
      <pointLight color={color} intensity={2} distance={5} />
    </group>
  );
};
