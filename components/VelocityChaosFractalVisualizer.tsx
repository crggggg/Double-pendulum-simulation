import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PendulumSimulation, integrateRK4Step } from '../utils/physics';
import { PendulumState, PhysicsParams } from '../types';

interface Props {
  simulation: PendulumSimulation;
}

const FRACTAL_PARAMS: PhysicsParams = {
  l1: 1.0,
  l2: 1.0,
  m1: 1.0,
  m2: 1.0,
  g: 9.81,
};

const RESOLUTION = 250; 
const SIM_STEPS = 3000; // Reduced from 9000
const DT = 0.01; 
const EPSILON = 0.001;

const VelocityChaosFractalVisualizer: React.FC<Props> = ({ simulation }) => {
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  // Range for velocity map (e.g., -10 to +10 rad/s)
  const BOUNDS = {
    minOmega: -10,
    maxOmega: 10,
    range: 20
  };

  useEffect(() => {
    if (!bufferCanvasRef.current) {
        bufferCanvasRef.current = document.createElement('canvas');
        bufferCanvasRef.current.width = RESOLUTION;
        bufferCanvasRef.current.height = RESOLUTION;
    }
    const bufferCtx = bufferCanvasRef.current.getContext('2d');
    if (!bufferCtx) return;

    bufferCtx.fillStyle = '#000000';
    bufferCtx.fillRect(0, 0, RESOLUTION, RESOLUTION);
    
    const imageData = bufferCtx.getImageData(0, 0, RESOLUTION, RESOLUTION);
    const data = imageData.data;
    
    setIsProcessing(true);
    setProgress(0);

    let pixelIndex = 0;
    const totalPixels = RESOLUTION * RESOLUTION;
    let animationFrameId: number;
    let isCancelled = false;

    const processBatch = () => {
      if (isCancelled) return;
      
      if (pixelIndex >= totalPixels) {
        bufferCtx.putImageData(imageData, 0, 0); 
        setIsProcessing(false);
        renderDisplay(); 
        return;
      }

      const startTime = performance.now();
      const MAX_TIME_PER_FRAME = 12; 
      
      while (pixelIndex < totalPixels && (performance.now() - startTime) < MAX_TIME_PER_FRAME) {
        const x = pixelIndex % RESOLUTION;
        const y = Math.floor(pixelIndex / RESOLUTION);

        const omega1 = BOUNDS.minOmega + (x / RESOLUTION) * BOUNDS.range;
        const omega2 = BOUNDS.minOmega + (y / RESOLUTION) * BOUNDS.range;

        // Start with 0 angles (theta = 0)
        let s1: PendulumState = { theta1: 0, theta2: 0, omega1, omega2 };
        let s2: PendulumState = { theta1: 0, theta2: 0, omega1: omega1 + EPSILON, omega2: omega2 + EPSILON };
        
        let totalDiff = 0;

        for (let i = 0; i < SIM_STEPS; i++) {
          s1 = integrateRK4Step(s1, FRACTAL_PARAMS, DT);
          s2 = integrateRK4Step(s2, FRACTAL_PARAMS, DT);

          const dTheta1 = s1.theta1 - s2.theta1;
          const dTheta2 = s1.theta2 - s2.theta2;
          const dOmega1 = s1.omega1 - s2.omega1;
          const dOmega2 = s1.omega2 - s2.omega2;
          
          let dist = Math.sqrt(dTheta1*dTheta1 + dTheta2*dTheta2 + dOmega1*dOmega1 + dOmega2*dOmega2);
          dist = Math.min(dist, 2.0); 
          totalDiff += dist;
        }

        const avgDist = totalDiff / SIM_STEPS; 

        // Non-linear mapping
        const normalized = Math.min(1, Math.pow(avgDist / 1.5, 0.4)); 
        
        const intensity = normalized;
        const idx = pixelIndex * 4;
        
        let r, g, b;

        if (intensity < 0.2) {
            const t = intensity / 0.2;
            r = 0; g = 0; b = Math.floor(t * 160);
        } else if (intensity < 0.4) {
            const t = (intensity - 0.2) / 0.2;
            r = Math.floor(t * 100); g = 0; b = 160 + Math.floor(t * 95);
        } else if (intensity < 0.6) {
            const t = (intensity - 0.4) / 0.2;
            r = 100 + Math.floor(t * 155); g = 0; b = 255 - Math.floor(t * 255);
        } else if (intensity < 0.8) {
            const t = (intensity - 0.6) / 0.2;
            r = 255; g = Math.floor(t * 200); b = 0;
        } else {
            const t = (intensity - 0.8) / 0.2;
            r = 255; g = 200 + Math.floor(t * 55); b = Math.floor(t * 255);
        }

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255; 

        pixelIndex++;
      }

      bufferCtx.putImageData(imageData, 0, 0);
      setProgress(Math.round((pixelIndex / totalPixels) * 100));
      renderDisplay();
      
      animationFrameId = requestAnimationFrame(processBatch);
    };

    animationFrameId = requestAnimationFrame(processBatch);

    return () => {
        isCancelled = true;
        cancelAnimationFrame(animationFrameId);
    };
  }, []); 

  const renderDisplay = useCallback(() => {
    const canvas = displayCanvasRef.current;
    const buffer = bufferCanvasRef.current;
    if (!canvas || !buffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const size = Math.min(canvas.width, canvas.height);
    const offsetX = (canvas.width - size) / 2;
    const offsetY = (canvas.height - size) / 2;

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(buffer, offsetX, offsetY, size, size);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1 / transform.scale;
    ctx.strokeRect(offsetX, offsetY, size, size);
    ctx.restore();
    
  }, [transform]);

  useEffect(() => {
    renderDisplay();
  }, [renderDisplay]);

  useEffect(() => {
    const canvas = displayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resizeObserver = new ResizeObserver(() => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        renderDisplay();
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [renderDisplay]);


  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const zoomSpeed = 0.1;
    const factor = e.deltaY > 0 ? (1 - zoomSpeed) : (1 + zoomSpeed);
    const newScale = Math.max(1, Math.min(transform.scale * factor, 50)); 
    const worldX = (mx - transform.x) / transform.scale;
    const worldY = (my - transform.y) / transform.scale;
    const newX = mx - worldX * newScale;
    const newY = my - worldY * newScale;
    setTransform({ x: newX, y: newY, scale: newScale });
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      setTransform(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if (!containerRef.current || !displayCanvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    
    const width = displayCanvasRef.current.width;
    const height = displayCanvasRef.current.height;
    const size = Math.min(width, height);
    const offsetX = (width - size) / 2;

    const transformedX = (mx - transform.x) / transform.scale;
    const transformedY = (e.clientY - rect.top - transform.y) / transform.scale;

    const imageX = transformedX - offsetX;
    const imageY = transformedY - ((height - size) / 2);
    
    if (imageX < 0 || imageX > size || imageY < 0 || imageY > size) return; 

    const pctX = imageX / size;
    const pctY = imageY / size;
    
    const omega1 = BOUNDS.minOmega + pctX * BOUNDS.range;
    const omega2 = BOUNDS.minOmega + pctY * BOUNDS.range;

    // Reset with 0 angles (theta = 0)
    simulation.reset(0, 0, omega1, omega2);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bufferCanvasRef.current) {
        const link = document.createElement('a');
        link.download = `velocity-fractal.png`;
        link.href = bufferCanvasRef.current.toDataURL();
        link.click();
    }
  };

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full cursor-crosshair border-l border-t border-slate-800 bg-black overflow-hidden"
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      title="Velocity Fractal: Click to Simulate (θ=0)"
    >
      <canvas ref={displayCanvasRef} className="block" style={{ imageRendering: 'pixelated' }} />
      <div className="absolute top-4 left-4 text-slate-500 text-xs font-mono pointer-events-none select-none bg-black/50 p-1 rounded backdrop-blur-md">
        VELOCITY FRACTAL (θ=0)
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2">
        <button onClick={handleResetView} className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-2 py-1 rounded border border-slate-700 font-mono">
            RESET VIEW
        </button>
        <button onClick={handleDownload} className="bg-red-900/50 hover:bg-red-800/80 text-red-100 text-xs px-2 py-1 rounded border border-red-800 font-mono">
            SAVE PNG
        </button>
      </div>
      
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 pointer-events-none">
          <div className="text-red-400 font-mono text-sm mb-2">GENERATING VELOCITY MAP...</div>
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-75 ease-linear" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-slate-400 font-mono text-xs mt-1">{progress}%</div>
        </div>
      )}
    </div>
  );
};

export default VelocityChaosFractalVisualizer;