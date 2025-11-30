import React, { useRef, useEffect, useCallback } from 'react';
import { Point, PendulumState, PhysicsParams } from '../types';

// Initial constants for the physics engine
const PARAMS: PhysicsParams = {
  l1: 150,
  l2: 150,
  m1: 20,
  m2: 20,
  g: 1,
};

const INITIAL_STATE: PendulumState = {
  theta1: Math.PI / 2,
  theta2: Math.PI / 2 + 1, // Slight offset to create interesting initial motion
  omega1: 0,
  omega2: 0,
};

const MAX_TRACE_LENGTH = 2000; // Increased slightly for better tracing visualization

const DoublePendulum: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PendulumState>({ ...INITIAL_STATE });
  const traceRef = useRef<Point[]>([]);
  const animationFrameRef = useRef<number>(0);

  // Function to calculate derivatives for Runge-Kutta integration
  // Equations of motion for double pendulum
  const getDerivatives = (state: PendulumState, params: PhysicsParams) => {
    const { theta1, theta2, omega1, omega2 } = state;
    const { l1, l2, m1, m2, g } = params;

    const delta = theta1 - theta2;
    const den1 = (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2));
    
    // Angular acceleration 1
    const num1 = -g * (2 * m1 + m2) * Math.sin(theta1) 
               - m2 * g * Math.sin(theta1 - 2 * theta2) 
               - 2 * Math.sin(delta) * m2 * (omega2 * omega2 * l2 + omega1 * omega1 * l1 * Math.cos(delta));
    
    const alpha1 = num1 / (l1 * den1);

    // Angular acceleration 2
    const num2 = 2 * Math.sin(delta) * (omega1 * omega1 * l1 * (m1 + m2) 
               + g * (m1 + m2) * Math.cos(theta1) 
               + omega2 * omega2 * l2 * m2 * Math.cos(delta));
    
    const den2 = (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2));
    
    const alpha2 = num2 / (l2 * den2);

    return {
      dTheta1: omega1,
      dTheta2: omega2,
      dOmega1: alpha1,
      dOmega2: alpha2,
    };
  };

  // Runge-Kutta 4th Order Integration for stability
  const integrateRK4 = (state: PendulumState, dt: number) => {
    const k1 = getDerivatives(state, PARAMS);

    const s2: PendulumState = {
      theta1: state.theta1 + k1.dTheta1 * dt * 0.5,
      theta2: state.theta2 + k1.dTheta2 * dt * 0.5,
      omega1: state.omega1 + k1.dOmega1 * dt * 0.5,
      omega2: state.omega2 + k1.dOmega2 * dt * 0.5,
    };
    const k2 = getDerivatives(s2, PARAMS);

    const s3: PendulumState = {
      theta1: state.theta1 + k2.dTheta1 * dt * 0.5,
      theta2: state.theta2 + k2.dTheta2 * dt * 0.5,
      omega1: state.omega1 + k2.dOmega1 * dt * 0.5,
      omega2: state.omega2 + k2.dOmega2 * dt * 0.5,
    };
    const k3 = getDerivatives(s3, PARAMS);

    const s4: PendulumState = {
      theta1: state.theta1 + k3.dTheta1 * dt,
      theta2: state.theta2 + k3.dTheta2 * dt,
      omega1: state.omega1 + k3.dOmega1 * dt,
      omega2: state.omega2 + k3.dOmega2 * dt,
    };
    const k4 = getDerivatives(s4, PARAMS);

    state.theta1 += (dt / 6) * (k1.dTheta1 + 2 * k2.dTheta1 + 2 * k3.dTheta1 + k4.dTheta1);
    state.theta2 += (dt / 6) * (k1.dTheta2 + 2 * k2.dTheta2 + 2 * k3.dTheta2 + k4.dTheta2);
    state.omega1 += (dt / 6) * (k1.dOmega1 + 2 * k2.dOmega1 + 2 * k3.dOmega1 + k4.dOmega1);
    state.omega2 += (dt / 6) * (k1.dOmega2 + 2 * k2.dOmega2 + 2 * k3.dOmega2 + k4.dOmega2);
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { theta1, theta2 } = stateRef.current;
    const { l1, l2 } = PARAMS;
    
    // Center of canvas
    const cx = width / 2;
    const cy = height / 3; // Shift up slightly so pendulum hangs nicely

    // Calculate positions
    const x1 = cx + l1 * Math.sin(theta1);
    const y1 = cy + l1 * Math.cos(theta1);
    const x2 = x1 + l2 * Math.sin(theta2);
    const y2 = y1 + l2 * Math.cos(theta2);

    // Add to trace
    traceRef.current.push({ x: x2, y: y2 });
    if (traceRef.current.length > MAX_TRACE_LENGTH) {
      traceRef.current.shift();
    }

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Draw Trace (Solid line, no fade)
    if (traceRef.current.length > 1) {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22d3ee'; // Solid cyan-400
      
      // Draw the entire path as a single stroke for performance and solidity
      ctx.moveTo(traceRef.current[0].x, traceRef.current[0].y);
      for (let i = 1; i < traceRef.current.length; i++) {
        ctx.lineTo(traceRef.current[i].x, traceRef.current[i].y);
      }
      ctx.stroke();
    }

    // Draw Arms
    ctx.strokeStyle = '#94a3b8'; // slate-400
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw Joints/Masses
    // Pivot
    ctx.fillStyle = '#f8fafc'; // slate-50
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Mass 1
    ctx.fillStyle = '#e2e8f0'; // slate-200
    ctx.beginPath();
    ctx.arc(x1, y1, 10, 0, 2 * Math.PI);
    ctx.fill();

    // Mass 2 (Removed glow effect)
    ctx.fillStyle = '#ffffff'; // white
    ctx.beginPath();
    ctx.arc(x2, y2, 10, 0, 2 * Math.PI);
    ctx.fill();
    
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Physics Update
    // Higher steps per frame = more precision/speed
    const stepsPerFrame = 10;
    const dt = 0.4 / stepsPerFrame; 

    for (let i = 0; i < stepsPerFrame; i++) {
        integrateRK4(stateRef.current, dt);
    }

    draw(ctx, canvas.width, canvas.height);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();
    
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // Restart on click
  const handleRestart = () => {
    stateRef.current = { 
        ...INITIAL_STATE,
        theta1: Math.PI / 2 + (Math.random() * 0.5 - 0.25), // Add slight random variation on reset
        theta2: Math.PI / 2 + 1 + (Math.random() * 0.5 - 0.25)
    };
    traceRef.current = [];
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full cursor-pointer touch-none"
      onClick={handleRestart}
      title="Click to restart simulation"
    />
  );
};

export default DoublePendulum;