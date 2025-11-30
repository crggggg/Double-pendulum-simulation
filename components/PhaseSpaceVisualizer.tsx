import React, { useRef, useEffect, useCallback } from 'react';
import { PendulumSimulation } from '../utils/physics';
import { PendulumState } from '../types';

interface Props {
  simulation: PendulumSimulation;
}

const PhaseSpaceVisualizer: React.FC<Props> = ({ simulation }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useRef<number>(50); // 50px per radian

  const normalizeAngle = (angle: number): number => {
    const twoPi = 2 * Math.PI;
    let res = ((angle % twoPi) + twoPi) % twoPi;
    if (res > Math.PI) res -= twoPi;
    return res;
  };

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
    
    // Reverse map pixels to angles
    const theta1 = (clickX - cx) / scaleRef.current;
    const theta2 = (clickY - cy) / scaleRef.current;
    
    // Reset angles, but keep existing initial velocities to allow "composing" state
    const currentInitial = simulation.getInitialState();
    simulation.reset(theta1, theta2, currentInitial.omega1, currentInitial.omega2);
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

      // 1. Draw Trail (Iterate through history)
      trailCtx.beginPath();
      trailCtx.strokeStyle = '#3b82f6'; // Blue-500
      trailCtx.lineWidth = 1;

      // Draw segments between consecutive points in history
      for (let i = 0; i < history.length - 1; i++) {
        const curr = history[i];
        const next = history[i+1];

        const t1 = normalizeAngle(curr.theta1);
        const t2 = normalizeAngle(curr.theta2);
        const nt1 = normalizeAngle(next.theta1);
        const nt2 = normalizeAngle(next.theta2);

        const x = cx + t1 * scale;
        const y = cy + t2 * scale;
        const nx = cx + nt1 * scale;
        const ny = cy + nt2 * scale;

        const jump1 = Math.abs(t1 - nt1);
        const jump2 = Math.abs(t2 - nt2);

        // Only draw if we didn't wrap around boundaries
        if (jump1 < Math.PI && jump2 < Math.PI) {
          trailCtx.moveTo(x, y);
          trailCtx.lineTo(nx, ny);
        }
      }
      trailCtx.stroke();

      // 2. Draw Active Position and Start Position
      activeCtx.clearRect(0, 0, width, height);
      
      // Draw Axes
      activeCtx.strokeStyle = '#1e293b'; // slate-800
      activeCtx.lineWidth = 1;
      
      activeCtx.beginPath();
      activeCtx.moveTo(0, cy);
      activeCtx.lineTo(width, cy);
      activeCtx.moveTo(cx, 0);
      activeCtx.lineTo(cx, height);
      activeCtx.stroke();
      
      // Draw Boundary box
      activeCtx.strokeStyle = '#0f172a'; // slate-900
      activeCtx.strokeRect(cx - Math.PI * scale, cy - Math.PI * scale, 2 * Math.PI * scale, 2 * Math.PI * scale);

      // Draw Start Position Dot (Blue)
      const initialState = simulation.getInitialState();
      const it1 = normalizeAngle(initialState.theta1);
      const it2 = normalizeAngle(initialState.theta2);
      const startX = cx + it1 * scale;
      const startY = cy + it2 * scale;
      
      activeCtx.fillStyle = '#3b82f6'; // Blue
      activeCtx.beginPath();
      activeCtx.arc(startX, startY, 4, 0, 2 * Math.PI);
      activeCtx.fill();

      // Draw Current Position Marker (White)
      const finalState = history[history.length - 1];
      const ft1 = normalizeAngle(finalState.theta1);
      const ft2 = normalizeAngle(finalState.theta2);
      
      const markerX = cx + ft1 * scale;
      const markerY = cy + ft2 * scale;

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
      title="Click to set start angles (θ1, θ2)"
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
        ANGLE PHASE SPACE (θ1, θ2) <span className="text-blue-500">● START</span>
      </div>
    </div>
  );
};

export default PhaseSpaceVisualizer;