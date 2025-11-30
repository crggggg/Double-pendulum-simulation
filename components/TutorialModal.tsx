import React from 'react';

interface Props {
  onClose: () => void;
}

const TutorialModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-2xl font-bold text-cyan-400 tracking-wider">SIMULATION GUIDE</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto space-y-8 text-slate-300 leading-relaxed font-sans">
          
          {/* Section 1 */}
          <section>
            <h3 className="text-white text-lg font-bold mb-4 border-b border-slate-700 pb-2">WHAT ARE THOSE GRAPHS???</h3>
            <div className="space-y-4">
              <div>
                <strong className="text-cyan-400 block text-sm font-mono mb-1">REAL SPACE</strong>
                <p className="text-sm">Shows the double pendulum swinging and traces the path of its tip.</p>
              </div>
              
              <div>
                <strong className="text-cyan-400 block text-sm font-mono mb-1">ANGLE PHASE SPACE</strong>
                <p className="text-sm">A more abstracted visualization of the motion, traces the path of the pendulum in the phase space where the axies represent the angles of the arms. The dot represents the current starting position, you can change it by clicking on the space or reset it to zero by pressing reset.</p>
              </div>

              <div>
                <strong className="text-cyan-400 block text-sm font-mono mb-1">VELOCITY PHASE SPACE</strong>
                <p className="text-sm">Another abstracted visualization, traces the path of the pendulum in the phase space where the axies represent the rotational velocities of the arms. The dot represents the current starting position, you can change it by clicking on the space or reset it to zero by pressing reset.</p>
              </div>

              <div>
                <strong className="text-cyan-400 block text-sm font-mono mb-1">ANGLE FRACTAL</strong>
                <p className="text-sm">Its the angle state space but pixels are colored based on how chaotic these starting point are, darkness means the pixel is stable, light means its chaotic. You can click on it to run the simulation with the position clicked on. You can zoom in.</p>
              </div>

              <div>
                <strong className="text-cyan-400 block text-sm font-mono mb-1">VELOCITY FRACTAL</strong>
                <p className="text-sm">Its the velocity state space but pixels are colored based on how chaotic these starting point are, darkness means the pixel is stable, light means its chaotic. You can click on it to run the simulation with the position clicked on. You can zoom in.</p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-white text-lg font-bold mb-4 border-b border-slate-700 pb-2">LITTERALLY TWO SMALL NOTES</h3>
            <div className="space-y-2 text-sm">
              <p>
                Note that angle fractals for velocity other than zero and vice versa is not supported.
              </p>
              <p>
                Use <kbd className="bg-slate-700 px-1 py-0.5 text-white font-mono">m</kbd> and <kbd className="bg-slate-700 px-1 py-0.5 text-white font-mono">n</kbd> to double and half the simulation speed respectively, this will not affect precision.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-white text-lg font-bold mb-4 border-b border-slate-700 pb-2">HOW DO I FIND NICE STUFF???</h3>
            <p className="text-sm">
              Use the angle fractal tool and click on dark region which are not in the center. observe and try to see the pattern, if you dont see it try another area. even if you do it will most likely diverge after some time, try to find a spot where it doesnt.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;