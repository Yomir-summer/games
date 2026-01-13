
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, LANE_WIDTH } from '../constants.tsx';

interface PlayerProps {
  lane: number;
  y: number;
  z: number;
  isSliding: boolean;
  hasShield: boolean;
  hasSpeed: boolean;
}

export const Player: React.FC<PlayerProps> = ({ lane, y, z, isSliding, hasShield, hasSpeed }) => {
  const meshRef = useRef<THREE.Group>(null);
  const targetX = lane * LANE_WIDTH;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * 15);
      meshRef.current.position.y = y;
      meshRef.current.position.z = z;

      const tilt = (meshRef.current.position.x - targetX) * 0.1;
      meshRef.current.rotation.z = -tilt;
      
      if (y <= 0 && !isSliding) {
        const bounceSpeed = hasSpeed ? 25 : 15;
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime * bounceSpeed) * 0.15;
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* Shield Effect */}
      {hasShield && (
        <mesh>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color={COLORS.SHIELD} transparent opacity={0.2} wireframe />
        </mesh>
      )}

      {/* Body - Orange Prison Suit */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={isSliding ? [0.6, 0.4, 1.2] : [0.7, 1.2, 0.5]} />
        <meshStandardMaterial color={COLORS.PLAYER_ORANGE} />
      </mesh>
      
      {/* Head - Low Poly with mask */}
      {!isSliding && (
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[0.45, 0.45, 0.45]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      )}

      {/* Legs */}
      {!isSliding && (
        <>
          <mesh position={[0.2, 0.4, 0]} castShadow>
            <boxGeometry args={[0.25, 0.8, 0.25]} />
            <meshStandardMaterial color={COLORS.PLAYER_ORANGE} />
          </mesh>
          <mesh position={[-0.2, 0.4, 0]} castShadow>
            <boxGeometry args={[0.25, 0.8, 0.25]} />
            <meshStandardMaterial color={COLORS.PLAYER_ORANGE} />
          </mesh>
        </>
      )}
    </group>
  );
};
