
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { GameState, ObstacleData, CoinData, PowerUpData, PowerUpType } from './types';
import { 
  LANE_WIDTH, INITIAL_SPEED, SPEED_INCREMENT, 
  JUMP_STRENGTH, GRAVITY, SPAWN_DISTANCE, DESPAWN_DISTANCE 
} from './constants';
import { Environment } from './components/Environment';
import { Player } from './components/Player';
import { Obstacle, Coin, PowerUp } from './components/GameObjects';
import { getGameOverMessage } from './services/geminiService';
import { Trophy, Coins, Play, RotateCcw, Zap, Shield, Magnet, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('prison_highscore')) || 0);
  const [gameOverMsg, setGameOverMsg] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);

  const [currentLane, setCurrentLane] = useState(0);
  const [playerY, setPlayerY] = useState(0);
  const [playerZ, setPlayerZ] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  
  // Power-ups
  const [activePowerUps, setActivePowerUps] = useState<Record<PowerUpType, number>>({
    magnet: 0, shield: 0, speed: 0
  });

  const velocityY = useRef(0);
  const currentSpeed = useRef(INITIAL_SPEED);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [spawnedCoins, setSpawnedCoins] = useState<CoinData[]>([]);
  const [spawnedPowerUps, setSpawnedPowerUps] = useState<PowerUpData[]>([]);
  const lastSpawnZ = useRef(0);

  // INVERTED CONTROLS: ArrowLeft moves RIGHT, ArrowRight moves LEFT
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== GameState.PLAYING) return;

    if (e.key === 'ArrowLeft') {
      setCurrentLane(prev => Math.min(prev + 1, 1)); // Inverted
    } else if (e.key === 'ArrowRight') {
      setCurrentLane(prev => Math.max(prev - 1, -1)); // Inverted
    } else if (e.key === 'ArrowUp' && playerY <= 0.01) {
      velocityY.current = JUMP_STRENGTH;
    } else if (e.key === 'ArrowDown') {
      setIsSliding(true);
      setTimeout(() => setIsSliding(false), 800);
    }
  }, [gameState, playerY]);

  useEffect(() => {
    const downHandler = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', downHandler);
    return () => window.removeEventListener('keydown', downHandler);
  }, [handleKeyDown]);

  const startGame = () => {
    setScore(0);
    setCoins(0);
    setPlayerZ(0);
    setPlayerY(0);
    setCurrentLane(0);
    setObstacles([]);
    setSpawnedCoins([]);
    setSpawnedPowerUps([]);
    currentSpeed.current = INITIAL_SPEED;
    lastSpawnZ.current = 0;
    velocityY.current = 0;
    setActivePowerUps({ magnet: 0, shield: 0, speed: 0 });
    
    setGameState(GameState.INTRO);
    setTimeout(() => {
      setGameState(GameState.PLAYING);
    }, 1500);
  };

  const endGame = async () => {
    if (activePowerUps.shield > 0) {
      setActivePowerUps(prev => ({ ...prev, shield: 0 }));
      return; 
    }
    setGameState(GameState.GAMEOVER);
    setLoadingMsg(true);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('prison_highscore', score.toString());
    }
    const msg = await getGameOverMessage(score, coins);
    setGameOverMsg(msg);
    setLoadingMsg(false);
  };

  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    let lastTime = performance.now();
    let frameId: number;

    const update = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      setActivePowerUps(prev => {
        const next = { ...prev };
        let changed = false;
        (Object.keys(next) as PowerUpType[]).forEach(k => {
          if (next[k] > 0) {
            next[k] = Math.max(0, next[k] - dt);
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      const speedMultiplier = activePowerUps.speed > 0 ? 1.8 : 1.0;
      const moveSpeed = currentSpeed.current * speedMultiplier;
      const newZ = playerZ + moveSpeed * dt;
      setPlayerZ(newZ);
      setScore(Math.floor(newZ));

      if (playerY > 0 || velocityY.current !== 0) {
        const nextY = playerY + velocityY.current * dt;
        const nextVel = velocityY.current - GRAVITY * dt;
        if (nextY <= 0) { setPlayerY(0); velocityY.current = 0; }
        else { setPlayerY(nextY); velocityY.current = nextVel; }
      }

      currentSpeed.current += SPEED_INCREMENT * dt;

      if (newZ > lastSpawnZ.current - SPAWN_DISTANCE) {
        lastSpawnZ.current += 15;
        const rand = Math.random();
        const lane = Math.floor(Math.random() * 3) - 1;
        const spawnZ = lastSpawnZ.current + SPAWN_DISTANCE;

        if (rand > 0.5) {
          const type = Math.random() > 0.4 ? (Math.random() > 0.5 ? 'pillar' : 'wall') : (Math.random() > 0.5 ? 'low-bar' : 'hound');
          setObstacles(prev => [...prev, { id: Math.random().toString(), z: spawnZ, lane, type }]);
        } else if (rand > 0.15) {
          setSpawnedCoins(prev => [...prev, { id: Math.random().toString(), z: spawnZ, lane }]);
        } else if (rand > 0.05) {
          const pTypes: PowerUpType[] = ['magnet', 'shield', 'speed'];
          const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
          setSpawnedPowerUps(prev => [...prev, { id: Math.random().toString(), z: spawnZ, lane, type: pType }]);
        }
      }

      setObstacles(prev => {
        const filtered = prev.filter(obs => obs.z > newZ - DESPAWN_DISTANCE);
        const collision = filtered.find(obs => {
          const distZ = Math.abs(obs.z - newZ);
          const distLane = obs.lane === currentLane;
          if (distZ < 0.8 && distLane) {
            if (activePowerUps.speed > 0 && (obs.type === 'low-bar' || obs.type === 'hound')) return false;
            if (obs.type === 'low-bar' && isSliding) return false;
            if ((obs.type === 'wall' || obs.type === 'hound') && playerY > 1.2) return false;
            return true;
          }
          return false;
        });
        if (collision) endGame();
        return filtered;
      });

      const magnetActive = activePowerUps.magnet > 0;
      setSpawnedCoins(prev => prev.filter(coin => {
        const distZ = Math.abs(coin.z - newZ);
        const distLane = coin.lane === currentLane;
        const magnetPull = magnetActive && distZ < 10;
        
        if ((distZ < 1 && distLane && Math.abs(playerY - 0.5) < 1.5) || magnetPull) {
          setCoins(c => c + 1);
          return false;
        }
        return coin.z > newZ - DESPAWN_DISTANCE;
      }));

      setSpawnedPowerUps(prev => prev.filter(pu => {
        const distZ = Math.abs(pu.z - newZ);
        const distLane = pu.lane === currentLane;
        if (distZ < 1 && distLane && Math.abs(playerY - 0.5) < 1.5) {
          setActivePowerUps(old => ({ ...old, [pu.type]: 10 })); 
          return false;
        }
        return pu.z > newZ - DESPAWN_DISTANCE;
      }));

      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, playerZ, playerY, currentLane, isSliding, activePowerUps]);

  return (
    <div className="relative w-full h-screen bg-zinc-950 overflow-hidden font-sans text-white">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4.5, playerZ - 8]} fov={70} />
        <OrbitControls target={[0, 1.2, playerZ + 5]} enablePan={false} enableZoom={false} enableRotate={false} />
        <Environment playerZ={playerZ} showIntro={gameState === GameState.INTRO} />
        <Player 
          lane={currentLane} y={playerY} z={playerZ} 
          isSliding={isSliding} 
          hasShield={activePowerUps.shield > 0} 
          hasSpeed={activePowerUps.speed > 0} 
        />
        {obstacles.map(obs => <Obstacle key={obs.id} data={obs} />)}
        {spawnedCoins.map(coin => <Coin key={coin.id} data={coin} />)}
        {spawnedPowerUps.map(pu => <PowerUp key={pu.id} data={pu} />)}
      </Canvas>

      {/* HUD */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-6 flex flex-col gap-4 pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 text-white/50 text-xs font-bold tracking-widest uppercase">
                <Trophy size={14} className="text-orange-500" /> 逃亡路程
              </div>
              <div className="text-3xl font-black tabular-nums">{score}m</div>
            </div>
            <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 text-white/50 text-xs font-bold tracking-widest uppercase">
                <Coins size={14} className="text-yellow-400" /> 搜刮金额
              </div>
              <div className="text-3xl font-black tabular-nums">{coins}</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {activePowerUps.speed > 0 && <div className="bg-green-500/80 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse shadow-md"><Zap size={12}/> 极速中</div>}
            {activePowerUps.shield > 0 && <div className="bg-blue-500/80 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse shadow-md"><Shield size={12}/> 护盾中</div>}
            {activePowerUps.magnet > 0 && <div className="bg-purple-500/80 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse shadow-md"><Magnet size={12}/> 吸金中</div>}
          </div>
        </div>
      )}

      {/* INTRO SCREEN */}
      {gameState === GameState.INTRO && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50">
           <h2 className="text-7xl font-black italic animate-bounce text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]">越狱开始！</h2>
        </div>
      )}

      {/* MENU */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-4">
          <div className="relative mb-8 text-center">
            <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-white drop-shadow-2xl">
              监狱<span className="text-orange-600">逃亡</span>
            </h1>
            <div className="bg-white text-black px-4 py-1 text-sm font-bold mx-auto w-fit mt-2 shadow-lg">PRISON BREAKOUT</div>
          </div>
          
          <button 
            onClick={startGame}
            className="group relative bg-orange-600 hover:bg-orange-500 text-white px-12 py-6 rounded-full text-3xl font-black transition-all transform hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(234,88,12,0.4)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3"><Play fill="currentColor"/> 冲出铁笼</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>

          <div className="mt-12 text-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">最高生还记录</p>
            <p className="text-4xl font-black text-white">{highScore.toLocaleString()} m</p>
          </div>

          <div className="mt-12 bg-white/5 border border-white/10 p-8 rounded-3xl max-w-sm shadow-inner">
             <p className="text-orange-500 text-sm font-bold mb-4 uppercase flex items-center gap-2 justify-center">
               <Zap size={16}/> 核心挑战：神经逆转
             </p>
             <div className="grid grid-cols-2 gap-4 text-sm text-zinc-300">
                <div className="flex items-center gap-2"><ArrowLeft className="text-red-500"/> 左 → 向右</div>
                <div className="flex items-center gap-2"><ArrowRight className="text-red-500"/> 右 → 向左</div>
                <div className="flex items-center gap-2"><ArrowUp/> 跳跃</div>
                <div className="flex items-center gap-2"><ArrowDown/> 滑行</div>
             </div>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-1000 z-50">
          <div className="bg-red-600 text-white px-6 py-2 text-sm font-black mb-6 tracking-[0.2em] shadow-lg">CAPTURED - 被捕</div>
          <h2 className="text-7xl font-black mb-8 text-center leading-none text-white drop-shadow-lg">逃亡终结</h2>
          
          <div className="max-w-md w-full bg-zinc-900/80 border border-white/10 rounded-3xl p-8 mb-10 text-center shadow-2xl backdrop-blur-md">
             {loadingMsg ? <p className="animate-pulse text-zinc-500 italic">正在传输监控录像...</p> : (
               <p className="text-orange-100 text-2xl font-serif italic leading-relaxed mb-8">
                 "{gameOverMsg}"
               </p>
             )}
             <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div>
                  <div className="text-zinc-500 text-xs uppercase mb-1 font-bold">逃亡距离</div>
                  <div className="text-4xl font-black text-white">{score}m</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs uppercase mb-1 font-bold">搜刮金额</div>
                  <div className="text-4xl font-black text-yellow-500">{coins}</div>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-4 w-64">
            <button onClick={startGame} className="bg-white text-black py-5 rounded-full text-xl font-black flex items-center justify-center gap-3 hover:bg-orange-600 hover:text-white transition-all transform hover:scale-105 shadow-xl">
              <RotateCcw size={22}/> 再次破墙
            </button>
            <button onClick={() => setGameState(GameState.MENU)} className="text-zinc-500 hover:text-zinc-100 text-sm font-bold transition-colors">
              返回禁闭室
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
