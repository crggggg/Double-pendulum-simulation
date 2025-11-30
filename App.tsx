import React, { useEffect, useRef, useState } from 'react';
import RealSpaceVisualizer from './components/RealSpaceVisualizer';
import PhaseSpaceVisualizer from './components/PhaseSpaceVisualizer';
import VelocityPhaseSpaceVisualizer from './components/VelocityPhaseSpaceVisualizer';
import ChaosFractalVisualizer from './components/ChaosFractalVisualizer';
import VelocityChaosFractalVisualizer from './components/VelocityChaosFractalVisualizer';
import TutorialModal from './components/TutorialModal';
import { PendulumSimulation } from './utils/physics';

const App: React.FC = () => {
  const simulationRef = useRef<PendulumSimulation>(new PendulumSimulation());
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const sim = simulationRef.current;
    sim.start();
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'm') {
            sim.multiplySpeed(2);
        }
        if (e.key === 'n') {
            sim.multiplySpeed(0.5);
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      sim.stop();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div 
      className="w-screen h-screen bg-black text-white overflow-hidden relative"
      style={{
        display: 'grid',
        gridTemplateColumns: '40% 30% 30%',
        gridTemplateRows: '50% 50%',
      }}
    >
      {/* Tutorial Overlay */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {/* Tutorial Button - Fixed on right side */}
      <button 
        onClick={() => setShowTutorial(true)}
        className="fixed top-1/2 right-0 transform -translate-y-1/2 z-40 bg-slate-800/80 hover:bg-cyan-600 text-white py-3 pl-3 pr-2 backdrop-blur-md border-y border-l border-slate-600 shadow-xl transition-all font-bold tracking-widest writing-vertical-lr flex items-center justify-center gap-2 group"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <span className="bg-cyan-500 text-black w-6 h-6 flex items-center justify-center text-xs font-bold group-hover:bg-white group-hover:text-cyan-600 mb-2 rotate-90">?</span>
        TUTORIAL
      </button>

      {/* 1. Real Space (Left Column, Spans 2 Rows) */}
      <div className="relative border-r border-slate-800" style={{ gridColumn: '1', gridRow: '1 / span 2' }}>
        <RealSpaceVisualizer simulation={simulationRef.current} />
      </div>

      {/* 2. Angle Phase Space (Top Middle) */}
      <div className="relative border-r border-slate-800" style={{ gridColumn: '2', gridRow: '1' }}>
        <PhaseSpaceVisualizer simulation={simulationRef.current} />
      </div>

      {/* 3. Velocity Phase Space (Top Right) */}
      <div className="relative" style={{ gridColumn: '3', gridRow: '1' }}>
        <VelocityPhaseSpaceVisualizer simulation={simulationRef.current} />
      </div>

      {/* 4. Angle Fractal (Bottom Middle) */}
      <div className="relative border-r border-slate-800" style={{ gridColumn: '2', gridRow: '2' }}>
        <ChaosFractalVisualizer simulation={simulationRef.current} />
      </div>

      {/* 5. Velocity Fractal (Bottom Right) */}
      <div className="relative" style={{ gridColumn: '3', gridRow: '2' }}>
        <VelocityChaosFractalVisualizer simulation={simulationRef.current} />
      </div>
    </div>
  );
};

export default App;