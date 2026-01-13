
import React from 'react';
import { COLORS, CHUNK_SIZE } from '../constants';

const PathChunk: React.FC<{ z: number; isIntro?: boolean }> = ({ z, isIntro }) => {
  return (
    <group position={[0, -0.5, z]}>
      {/* Floor - Concrete Tiles */}
      <mesh receiveShadow>
        <boxGeometry args={[10, 1, CHUNK_SIZE]} />
        <meshStandardMaterial color={COLORS.PRISON_FLOOR} roughness={0.7} />
      </mesh>
      
      {/* Side Walls */}
      <mesh position={[-5.2, 2.5, 0]}>
        <boxGeometry args={[0.4, 6, CHUNK_SIZE]} />
        <meshStandardMaterial color={COLORS.PRISON_WALL} />
      </mesh>
      <mesh position={[5.2, 2.5, 0]}>
        <boxGeometry args={[0.4, 6, CHUNK_SIZE]} />
        <meshStandardMaterial color={COLORS.PRISON_WALL} />
      </mesh>

      {/* Spaced Wall Lights (Every 10 units) */}
      {[...Array(5)].map((_, i) => (
        <group key={`lights-${i}`} position={[0, 3.5, -CHUNK_SIZE/2 + i * 10]}>
          {/* Left Wall Lamp */}
          <mesh position={[-4.9, 0, 0]}>
            <boxGeometry args={[0.2, 0.4, 0.8]} />
            <meshStandardMaterial color="#fff" emissive="#f39c12" emissiveIntensity={3} />
          </mesh>
          <pointLight position={[-4.5, 0, 0]} color="#f39c12" intensity={8} distance={15} />
          
          {/* Right Wall Lamp */}
          <mesh position={[4.9, 0, 0]}>
            <boxGeometry args={[0.2, 0.4, 0.8]} />
            <meshStandardMaterial color="#fff" emissive="#f39c12" emissiveIntensity={3} />
          </mesh>
          <pointLight position={[4.5, 0, 0]} color="#f39c12" intensity={8} distance={15} />
        </group>
      ))}

      {/* Ceiling Panels (Extra illumination) */}
      {[...Array(2)].map((_, i) => (
        <mesh key={`ceiling-${i}`} position={[0, 5.5, -CHUNK_SIZE/4 + i * (CHUNK_SIZE/2)]}>
          <boxGeometry args={[4, 0.1, 2]} />
          <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
      ))}

      {/* Intro Wall Fragments */}
      {isIntro && (
        <group position={[0, 2, 0]}>
          {[...Array(15)].map((_, i) => (
             <mesh key={i} position={[Math.random() * 6 - 3, Math.random() * 2, -2]} rotation={[Math.random(), Math.random(), 0]}>
                <boxGeometry args={[Math.random() * 1.5, Math.random() * 1.5, 0.5]} />
                <meshStandardMaterial color={COLORS.PRISON_WALL} />
             </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export const Environment: React.FC<{ playerZ: number; showIntro?: boolean }> = ({ playerZ, showIntro }) => {
  const currentChunkIndex = Math.floor(playerZ / CHUNK_SIZE);
  
  return (
    <>
      <PathChunk z={currentChunkIndex * CHUNK_SIZE} isIntro={showIntro && Math.abs(playerZ) < 5} />
      <PathChunk z={(currentChunkIndex + 1) * CHUNK_SIZE} />
      <PathChunk z={(currentChunkIndex + 2) * CHUNK_SIZE} />
      <PathChunk z={(currentChunkIndex - 1) * CHUNK_SIZE} />

      {/* Signficantly increased base brightness */}
      <ambientLight intensity={0.9} />
      
      {/* Follow light that moves with player but stays slightly above */}
      <pointLight position={[0, 8, playerZ + 5]} intensity={2.5} distance={60} castShadow shadow-mapSize={[1024, 1024]} />
      
      {/* Lighten the fog for better visibility of distant objects */}
      <fog attach="fog" args={['#2c3e50', 20, 110]} />
    </>
  );
};
