import React, { useRef, useEffect, useCallback } from 'react';
import { PendulumSimulation, DEFAULT_PARAMS } from '../utils/physics';
import { PendulumState } from '../types';

interface Props {
  simulation: PendulumSimulation;
}

const RealSpaceVisualizer: React.FC<Props> = ({ simulation }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);

  const clearTrail = useCallback(() => {
    if (!trailCanvasRef.current) return;
    const ctx = trailCanvasRef.current.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, trailCanvasRef.current.width, trailCanvasRef.current.height);
  }, []);

  const handleRandomReset = () => {
    simulation.reset();
  };
  
  const handleZeroVelocity = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Reset velocity to 0, keep current angles (undefined args)
      simulation.reset(undefined, undefined, 0, 0);
  };
  
  const handleRandomPosition = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Standard reset (random angles, 0 velocity)
      simulation.reset();
  };

  useEffect(() => {
    const removeResetListener = simulation.addResetListener(clearTrail);

    const handleResize = () => {
      if (!containerRef.current || !trailCanvasRef.current || !activeCanvasRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      trailCanvasRef.current.width = width;
      trailCanvasRef.current.height = height;
      activeCanvasRef.current.width = width;
      activeCanvasRef.current.height = height;
      
      clearTrail();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const draw = (history: PendulumState[]) => {
      if (!trailCanvasRef.current || !activeCanvasRef.current || history.length === 0) return;
      
      const trailCtx = trailCanvasRef.current.getContext('2d');
      const activeCtx = activeCanvasRef.current.getContext('2d');
      const width = activeCanvasRef.current.width;
      const height = activeCanvasRef.current.height;

      if (!trailCtx || !activeCtx) return;

      const { l1, l2 } = DEFAULT_PARAMS;
      const cx = width / 2;
      const cy = height / 3;

      // Helper to compute coordinates
      const getCoords = (state: PendulumState) => {
        const x1 = cx + l1 * Math.sin(state.theta1);
        const y1 = cy + l1 * Math.cos(state.theta1);
        const x2 = x1 + l2 * Math.sin(state.theta2);
        const y2 = y1 + l2 * Math.cos(state.theta2);
        return { x1, y1, x2, y2 };
      };

      // 1. Draw Trail (Iterate through history to create smooth curve)
      trailCtx.beginPath();
      trailCtx.strokeStyle = '#22d3ee'; // cyan-400
      trailCtx.lineWidth = 1;

      // Start from the first point in history
      const startCoords = getCoords(history[0]);
      trailCtx.moveTo(startCoords.x2, startCoords.y2);

      // Draw lines through all intermediate points
      for (let i = 1; i < history.length; i++) {
        const coords = getCoords(history[i]);
        trailCtx.lineTo(coords.x2, coords.y2);
      }
      trailCtx.stroke();

      // 2. Draw Active Pendulum (Using only the final state)
      const finalState = history[history.length - 1];
      const { x1, y1, x2, y2 } = getCoords(finalState);

      activeCtx.clearRect(0, 0, width, height);
      
      activeCtx.strokeStyle = '#94a3b8'; // slate-400
      activeCtx.lineWidth = 2;
      activeCtx.lineCap = 'round';
      
      // Arms
      activeCtx.beginPath();
      activeCtx.moveTo(cx, cy);
      activeCtx.lineTo(x1, y1);
      activeCtx.lineTo(x2, y2);
      activeCtx.stroke();

      // Masses
      activeCtx.fillStyle = '#f8fafc'; // slate-50 (pivot)
      activeCtx.beginPath();
      activeCtx.arc(cx, cy, 4, 0, 2 * Math.PI);
      activeCtx.fill();

      activeCtx.fillStyle = '#e2e8f0'; // slate-200 (m1)
      activeCtx.beginPath();
      activeCtx.arc(x1, y1, 8, 0, 2 * Math.PI);
      activeCtx.fill();

      activeCtx.fillStyle = '#ffffff'; // white (m2)
      activeCtx.beginPath();
      activeCtx.arc(x2, y2, 8, 0, 2 * Math.PI);
      activeCtx.fill();
    };

    const unsubscribe = simulation.subscribe(draw);

    return () => {
      unsubscribe();
      removeResetListener();
      window.removeEventListener('resize', handleResize);
    };
  }, [simulation, clearTrail]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full border-r border-slate-800 cursor-pointer group"
      onClick={handleRandomReset}
      title="Click for random start"
    >
      <canvas 
        ref={trailCanvasRef} 
        className="absolute inset-0 w-full h-full"
      />
      <canvas 
        ref={activeCanvasRef} 
        className="absolute inset-0 w-full h-full"
      />
      <div className="absolute top-4 left-4 text-slate-500 text-xs font-mono pointer-events-none select-none">
        REAL SPACE (X, Y)
      </div>

      <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleRandomPosition}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-2 py-1 rounded border border-slate-700 font-mono shadow-lg"
          >
            RANDOM POS
          </button>
          <button 
            onClick={handleZeroVelocity}
            className="bg-red-900/50 hover:bg-red-800/80 text-red-100 text-xs px-2 py-1 rounded border border-red-800 font-mono shadow-lg"
          >
            ZERO VEL
          </button>
      </div>
    </div>
  );
};

export default RealSpaceVisualizer;