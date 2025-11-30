export interface Point {
  x: number;
  y: number;
}

export interface PendulumState {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
}

export interface PhysicsParams {
  l1: number;
  l2: number;
  m1: number;
  m2: number;
  g: number;
}

// Callback now receives the full history of the simulation frame
// history[0] is the state at the start of the frame
// history[length-1] is the state at the end of the frame
export type SimulationCallback = (history: PendulumState[]) => void;
export type ResetCallback = () => void;
