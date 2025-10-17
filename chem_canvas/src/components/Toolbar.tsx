import { Pencil, Eraser, Circle, Square, Type, Palette, Calculator } from 'lucide-react';

interface ToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  onOpenCalculator?: () => void;
}

export default function Toolbar({
  currentTool,
  onToolChange,
  strokeWidth,
  onStrokeWidthChange,
  strokeColor,
  onStrokeColorChange,
  onOpenCalculator,
}: ToolbarProps) {
  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'square', icon: Square, label: 'Square' },
    { id: 'text', icon: Type, label: 'Text' },
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
    '#000000', // Black (for contrast)
  ];

  return (
    <div className="flex items-center gap-6">
      {/* Tools */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 ${
                currentTool === tool.id
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
              title={tool.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border"></div>

      {/* Colors */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Color</span>
        </div>
        <div className="flex items-center gap-1">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onStrokeColorChange(color)}
              className={`h-7 w-7 rounded-md border-2 transition-all duration-200 ${
                strokeColor === color
                  ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                  : 'border-border hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border"></div>

      {/* Stroke Width */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
          Size
        </span>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          className="w-24 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <span className="text-sm font-medium w-6 text-center">
          {strokeWidth}
        </span>
      </div>

      {/* Stroke Width Preview */}
      <div className="flex items-center">
        <div
          className="rounded-full border border-border"
          style={{
            width: `${Math.max(strokeWidth, 4)}px`,
            height: `${Math.max(strokeWidth, 4)}px`,
            backgroundColor: strokeColor,
          }}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border"></div>

      {/* Calculator Button */}
      {onOpenCalculator && (
        <button
          onClick={onOpenCalculator}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          title="Calculator"
        >
          <Calculator className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}