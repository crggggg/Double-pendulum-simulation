import React, { useRef, useEffect, useCallback } from 'react';
import { PendulumSimulation } from '../utils/physics';
import { PendulumState } from '../types';

interface Props {
  simulation: PendulumSimulation;
}

const VelocityPhaseSpaceVisualizer: React.FC<Props> = ({ simulation }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Dynamic scale for velocity since it's unbounded
  // Fixed at 160 (x8 zoom) as requested, no longer auto-scaling
  const scaleRef = useRef(160); 

  const clearTrail = useCallback(() => {
    if (!trailCanvasRef.current) return;
    const ctx = trailCanvasRef.current.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, trailCanvasRef.current.width, trailCanvasRef.current.height);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    
    // Reverse map pixels to velocities
    const omega1 = (clickX - cx) / scaleRef.current;
    const omega2 = (clickY - cy) / scaleRef.current;
    
    // Reset velocities, but keep existing initial angles
    const currentInitial = simulation.getInitialState();
    simulation.reset(currentInitial.theta1, currentInitial.theta2, omega1, omega2);
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

      const cx = width / 2;
      const cy = height / 2;
      const scale = scaleRef.current;

      // 1. Draw Trail
      trailCtx.beginPath();
      trailCtx.strokeStyle = '#ef4444'; // Red-500
      trailCtx.lineWidth = 1;

      // Draw segments
      for (let i = 0; i < history.length - 1; i++) {
        const curr = history[i];
        const next = history[i+1];

        const x = cx + curr.omega1 * scale;
        const y = cy + curr.omega2 * scale;
        const nx = cx + next.omega1 * scale;
        const ny = cy + next.omega2 * scale;

        trailCtx.moveTo(x, y);
        trailCtx.lineTo(nx, ny);
      }
      trailCtx.stroke();

      // 2. Draw Active & Start
      activeCtx.clearRect(0, 0, width, height);
      
      // Axes
      activeCtx.strokeStyle = '#1e293b'; 
      activeCtx.lineWidth = 1;
      activeCtx.beginPath();
      activeCtx.moveTo(0, cy);
      activeCtx.lineTo(width, cy);
      activeCtx.moveTo(cx, 0);
      activeCtx.lineTo(cx, height);
      activeCtx.stroke();
      
      // Start Position (Red Dot)
      const initialState = simulation.getInitialState();
      const startX = cx + initialState.omega1 * scale;
      const startY = cy + initialState.omega2 * scale;
      activeCtx.fillStyle = '#ef4444'; // Red
      activeCtx.beginPath();
      activeCtx.arc(startX, startY, 4, 0, 2 * Math.PI);
      activeCtx.fill();

      // Current Position (White Dot)
      const finalState = history[history.length - 1];
      const markerX = cx + finalState.omega1 * scale;
      const markerY = cy + finalState.omega2 * scale;
      activeCtx.fillStyle = '#ffffff';
      activeCtx.beginPath();
      activeCtx.arc(markerX, markerY, 3, 0, 2 * Math.PI);
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
      className="relative w-full h-full cursor-crosshair"
      onClick={handleClick}
      title="Click to set start velocities (ω1, ω2)"
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
        VELOCITY PHASE SPACE (ω1, ω2) <span className="text-red-500">● START</span>
      </div>
    </div>
  );
};

export default VelocityPhaseSpaceVisualizer;