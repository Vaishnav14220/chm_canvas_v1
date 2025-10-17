import React, { useState } from 'react';
import { 
  Atom, 
  Beaker, 
  FlaskConical, 
  TestTube, 
  Droplets, 
  Zap, 
  ArrowRight, 
  Plus,
  Minus,
  Equal,
  Type,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Calculator,
  Grid3X3,
  Move,
  RotateCw
} from 'lucide-react';

interface ChemistryToolbarProps {
  onToolSelect: (tool: string) => void;
  currentTool: string;
  onColorChange: (color: string) => void;
  currentColor: string;
  onSizeChange: (size: number) => void;
  currentSize: number;
  onOpenCalculator?: () => void;
  onOpenMolView?: () => void;
  onOpenPeriodicTable?: () => void;
}

const ChemistryToolbar: React.FC<ChemistryToolbarProps> = ({
  onToolSelect,
  currentTool,
  onColorChange,
  currentColor,
  onSizeChange,
  currentSize,
  onOpenCalculator,
  onOpenMolView,
  onOpenPeriodicTable
}) => {
  const [showShapes, setShowShapes] = useState(false);

  // MolView icon component
  const MolViewIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M12 2L2 7L12 12L22 7L12 2Z" />
      <path d="M2 17L12 22L22 17" />
      <path d="M2 12L12 17L22 12" />
    </svg>
  );

  const chemistryTools = [
    { id: 'draw', name: 'Draw', icon: Type, description: 'Free drawing tool' },
    { id: 'atom', name: 'Atom', icon: Atom, description: 'Draw atoms and molecules' },
    { id: 'bond', name: 'Bond', icon: Minus, description: 'Draw chemical bonds' },
    { id: 'arrow', name: 'Arrow', icon: ArrowRight, description: 'Reaction arrows' },
    { id: 'plus', name: 'Plus', icon: Plus, description: 'Plus sign for ions' },
    { id: 'minus', name: 'Minus', icon: Minus, description: 'Minus sign for ions' },
    { id: 'equal', name: 'Equal', icon: Equal, description: 'Equilibrium arrows' },
    { id: 'calculator', name: 'Calculator', icon: Calculator, description: 'Quick calculations', isSpecial: true },
    { id: 'molview', name: '3D Molecules', icon: MolViewIcon, description: '3D molecular viewer', isSpecial: true },
    { id: 'periodic', name: 'Periodic Table', icon: Grid3X3, description: 'Interactive periodic table', isSpecial: true },
    { id: 'move', name: 'Move', icon: Move, description: 'Move elements' },
    { id: 'rotate', name: 'Rotate', icon: RotateCw, description: 'Rotate elements' },
  ];

  const shapes = [
    { id: 'circle', name: 'Circle', icon: Circle, description: 'Circular shapes' },
    { id: 'square', name: 'Square', icon: Square, description: 'Square shapes' },
    { id: 'triangle', name: 'Triangle', icon: Triangle, description: 'Triangular shapes' },
    { id: 'hexagon', name: 'Hexagon', icon: Hexagon, description: 'Hexagonal shapes' },
  ];

  const colors = [
    '#1e293b', // Dark slate - Professional
    '#3b82f6', // Professional blue
    '#0ea5e9', // Sky blue
    '#06b6d4', // Cyan (professional)
    '#14b8a6', // Teal
    '#64748b', // Slate gray
    '#94a3b8', // Light gray
    '#ffffff', // White
    '#000000', // Black
    '#475569', // Dark gray
    '#cbd5e1', // Light slate
    '#e2e8f0', // Very light gray
  ];


  return (
    <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 shadow-lg">
      {/* Chemistry Tools */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Beaker size={16} className="text-blue-400" />
          Chemistry Tools
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {chemistryTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                if (tool.isSpecial && tool.id === 'calculator' && onOpenCalculator) {
                  onOpenCalculator();
                } else if (tool.isSpecial && tool.id === 'molview' && onOpenMolView) {
                  onOpenMolView();
                } else if (tool.isSpecial && tool.id === 'periodic' && onOpenPeriodicTable) {
                  onOpenPeriodicTable();
                } else {
                  onToolSelect(tool.id);
                }
              }}
              className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 ${
                tool.isSpecial
                  ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
                  : currentTool === tool.id
                        ? 'bg-primary/90 text-primary-foreground'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
              title={tool.description}
            >
              <tool.icon size={18} />
              {tool.isSpecial && (
                <span className="text-xs font-medium">{tool.name}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Shapes Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowShapes(!showShapes)}
          className="w-full p-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-600/50 transition-all flex items-center justify-center gap-2"
        >
          <Square size={16} />
          {showShapes ? 'Hide' : 'Show'} Shapes
        </button>
        
        {showShapes && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => onToolSelect(shape.id)}
                className={`p-2 rounded-lg transition-all ${
                  currentTool === shape.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
                title={shape.description}
              >
                <shape.icon size={18} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color Palette */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Colors</h3>
        <div className="grid grid-cols-6 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                currentColor === color ? 'border-white' : 'border-slate-600'
              }`}
              style={{ backgroundColor: color }}
              title={`Color: ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Brush Size */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Brush Size</h3>
        <input
          type="range"
          min="1"
          max="20"
          value={currentSize}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <div className="text-xs text-slate-400 mt-1 text-center">{currentSize}px</div>
      </div>


      {/* Quick Actions */}
      <div className="border-t border-slate-700/50 pt-3">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onToolSelect('text')}
            className={`p-2 rounded-lg transition-all text-xs ${
              currentTool === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
            }`}
          >
            <Type size={14} className="mx-auto mb-1" />
            Text
          </button>
          <button
            onClick={() => onToolSelect('eraser')}
            className={`p-2 rounded-lg transition-all text-xs ${
              currentTool === 'eraser'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
            }`}
          >
            <Square size={14} className="mx-auto mb-1" />
            Eraser
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChemistryToolbar;
