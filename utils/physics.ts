import { PendulumState, PhysicsParams, SimulationCallback, ResetCallback } from '../types';

export const DEFAULT_PARAMS: PhysicsParams = {
  l1: 150,
  l2: 150,
  m1: 20,
  m2: 20,
  g: 1,
};

export const INITIAL_STATE: PendulumState = {
  theta1: Math.PI / 2,
  theta2: Math.PI / 2 + 1,
  omega1: 0,
  omega2: 0,
};

// Pure function to calculate derivatives
export function getDerivatives(state: PendulumState, params: PhysicsParams) {
  const { theta1, theta2, omega1, omega2 } = state;
  const { l1, l2, m1, m2, g } = params;

  const delta = theta1 - theta2;
  const den1 = (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2));
  
  const num1 = -g * (2 * m1 + m2) * Math.sin(theta1) 
             - m2 * g * Math.sin(theta1 - 2 * theta2) 
             - 2 * Math.sin(delta) * m2 * (omega2 * omega2 * l2 + omega1 * omega1 * l1 * Math.cos(delta));
  
  const alpha1 = num1 / (l1 * den1);

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
}

// Pure function for RK4 step
export function integrateRK4Step(state: PendulumState, params: PhysicsParams, dt: number): PendulumState {
  const k1 = getDerivatives(state, params);

  const s2 = {
    theta1: state.theta1 + k1.dTheta1 * dt * 0.5,
    theta2: state.theta2 + k1.dTheta2 * dt * 0.5,
    omega1: state.omega1 + k1.dOmega1 * dt * 0.5,
    omega2: state.omega2 + k1.dOmega2 * dt * 0.5,
  };
  const k2 = getDerivatives(s2, params);

  const s3 = {
    theta1: state.theta1 + k2.dTheta1 * dt * 0.5,
    theta2: state.theta2 + k2.dTheta2 * dt * 0.5,
    omega1: state.omega1 + k2.dOmega1 * dt * 0.5,
    omega2: state.omega2 + k2.dOmega2 * dt * 0.5,
  };
  const k3 = getDerivatives(s3, params);

  const s4 = {
    theta1: state.theta1 + k3.dTheta1 * dt,
    theta2: state.theta2 + k3.dTheta2 * dt,
    omega1: state.omega1 + k3.dOmega1 * dt,
    omega2: state.omega2 + k3.dOmega2 * dt,
  };
  const k4 = getDerivatives(s4, params);

  return {
    theta1: state.theta1 + (dt / 6) * (k1.dTheta1 + 2 * k2.dTheta1 + 2 * k3.dTheta1 + k4.dTheta1),
    theta2: state.theta2 + (dt / 6) * (k1.dTheta2 + 2 * k2.dTheta2 + 2 * k3.dTheta2 + k4.dTheta2),
    omega1: state.omega1 + (dt / 6) * (k1.dOmega1 + 2 * k2.dOmega1 + 2 * k3.dOmega1 + k4.dOmega1),
    omega2: state.omega2 + (dt / 6) * (k1.dOmega2 + 2 * k2.dOmega2 + 2 * k3.dOmega2 + k4.dOmega2),
  };
}

export class PendulumSimulation {
  private state: PendulumState;
  private initialState: PendulumState;
  private params: PhysicsParams;
  private subscribers: Set<SimulationCallback>;
  private resetListeners: Set<ResetCallback>;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private speedMultiplier: number = 1;
  private baseStepsPerFrame: number = 40; 

  constructor(initialState: PendulumState = INITIAL_STATE, params: PhysicsParams = DEFAULT_PARAMS) {
    this.state = { ...initialState };
    this.initialState = { ...initialState };
    this.params = { ...params };
    this.subscribers = new Set();
    this.resetListeners = new Set();
  }

  public subscribe(callback: SimulationCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public addResetListener(callback: ResetCallback): () => void {
    this.resetListeners.add(callback);
    return () => {
      this.resetListeners.delete(callback);
    };
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Updated reset to accept partial updates, using stored initialState for missing values
  public reset(theta1?: number, theta2?: number, omega1?: number, omega2?: number) {
    this.stop();
    
    // If specific values are provided, use them. 
    // If not, fall back to the PREVIOUS initial state (to allow composing start states).
    // If no previous initial state (shouldn't happen), fallback to defaults.
    
    const nextTheta1 = theta1 !== undefined ? theta1 : this.initialState.theta1;
    const nextTheta2 = theta2 !== undefined ? theta2 : this.initialState.theta2;
    const nextOmega1 = omega1 !== undefined ? omega1 : this.initialState.omega1;
    const nextOmega2 = omega2 !== undefined ? omega2 : this.initialState.omega2;

    // However, if called with NO arguments (random reset from RealSpace), do random
    if (theta1 === undefined && theta2 === undefined && omega1 === undefined && omega2 === undefined) {
         this.state = {
            theta1: Math.PI / 2 + (Math.random() * 0.5 - 0.25),
            theta2: Math.PI / 2 + 1 + (Math.random() * 0.5 - 0.25),
            omega1: 0,
            omega2: 0,
          };
    } else {
        this.state = {
            theta1: nextTheta1,
            theta2: nextTheta2,
            omega1: nextOmega1,
            omega2: nextOmega2,
        };
    }

    // Update initial state to the new start state
    this.initialState = { ...this.state };

    this.resetListeners.forEach(cb => cb());
    this.notify([this.state]);
    this.start();
  }

  public multiplySpeed(factor: number) {
    this.speedMultiplier *= factor;
    console.log(`Speed Multiplier: ${this.speedMultiplier}x`);
  }

  public getState(): PendulumState {
    return { ...this.state };
  }
  
  public getInitialState(): PendulumState {
      return { ...this.initialState };
  }

  private notify(history: PendulumState[]) {
    this.subscribers.forEach((callback) => callback(history));
  }

  private loop = () => {
    if (!this.isRunning) return;

    const dt = 0.01; 
    const steps = Math.max(1, Math.round(this.baseStepsPerFrame * this.speedMultiplier));
    const history: PendulumState[] = [];
    
    history.push({ ...this.state });

    for (let i = 0; i < steps; i++) {
      this.state = integrateRK4Step(this.state, this.params, dt);
      history.push({ ...this.state });
    }

    this.notify(history);
    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}