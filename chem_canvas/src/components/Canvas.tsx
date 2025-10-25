import { useRef, useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { ZoomIn, ZoomOut, Grid3x3, RotateCcw, CheckCircle, AlertCircle, Loader2, Trash2, Brain, Sparkles, Atom, Beaker, Moon, Sun, Lightbulb } from 'lucide-react';
import { analyzeCanvasWithLLM, getStoredAPIKey, type Correction, type CanvasAnalysisResult } from '../services/canvasAnalyzer';
import { convertCanvasToChemistry } from '../services/chemistryConverter';
import MoleculeSearch from './MoleculeSearch';
import { type MoleculeData, parseSDF, drawSDF2DStructure, type ParsedSDF } from '../services/pubchemService';
import ChemistryToolbar from './ChemistryToolbar';
import ChemistryStructureViewer from './ChemistryStructureViewer';
import ChemistryWidgetPanel from './ChemistryWidgetPanel';

const MIN_TOOLBAR_WIDTH = 280;
const MAX_TOOLBAR_WIDTH = 480;

interface CanvasProps {
  currentTool: string;
  strokeWidth: number;
  strokeColor: string;
  onOpenCalculator?: () => void;
  onOpenMolView?: () => void;
  onOpenPeriodicTable?: () => void;
  onMoleculeInserted?: (moleculeData: any) => void;
}

export default function Canvas({
  currentTool,
  strokeWidth,
  strokeColor,
  onOpenCalculator,
  onOpenMolView,
  onOpenPeriodicTable,
  onMoleculeInserted
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showCorrections, setShowCorrections] = useState(false);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CanvasAnalysisResult | null>(null);
  const [showChemistryToolbar, setShowChemistryToolbar] = useState(true);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [toolbarWidth, setToolbarWidth] = useState(360);
  const [isResizingToolbar, setIsResizingToolbar] = useState(false);
  const toolbarResizeStateRef = useRef<{ startX: number; startWidth: number }>({ startX: 0, startWidth: 360 });
  const [chemistryTool, setChemistryTool] = useState('draw');
  const [chemistryColor, setChemistryColor] = useState('#3b82f6');
  const [chemistryStrokeColor, setChemistryStrokeColor] = useState('#3b82f6');
  const [chemistrySize, setChemistrySize] = useState(2);
  const [chemistryFillEnabled, setChemistryFillEnabled] = useState(true);
  const [chemistryFillColor, setChemistryFillColor] = useState('#3b82f6');
  const [showChemistryViewer, setShowChemistryViewer] = useState(false);
  const [chemistryStructure, setChemistryStructure] = useState<any>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState<'dark' | 'white'>('dark');
  const [showMoleculeSearch, setShowMoleculeSearch] = useState(false);
  const [forceRedraw, setForceRedraw] = useState(0); // New state for forcing redraw
  const [showChemistryWidgetPanel, setShowChemistryWidgetPanel] = useState(false);
  const [currentSmiles, setCurrentSmiles] = useState('CCO'); // Default to ethanol

  // Arrow drawing state - single resizable arrow
  const [arrowState, setArrowState] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isDrawing: boolean;
  } | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);

  // Cache for rendered molecule images
  const moleculeImageCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());

  // Cache for parsed SDF structures
  const sdfCacheRef = useRef<Map<number, ParsedSDF>>(new Map());

  // Shape tracking for repositioning
  interface Shape {
    id: string;
    type: 'arrow' | 'circle' | 'square' | 'triangle' | 'hexagon' | 'plus' | 'minus' | 'molecule';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    strokeColor?: string;
    fillColor?: string;
    fillEnabled?: boolean;
    size: number;
    rotation: number;  // Rotation in degrees (0-360)
    // Molecule-specific properties
    moleculeData?: {
      name: string;
      cid: number;
      formula: string;
      weight: number;
      svgUrl: string;
      svgData?: string;
      smiles: string;
    };
  }

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [isRotatingShape, setIsRotatingShape] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasHistoryRef = useRef<Shape[]>([]);

  // Resizing state - Canva-like
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);
  const [areaEraseSelection, setAreaEraseSelection] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isActive: boolean;
  } | null>(null);

  const FILLABLE_SHAPES = new Set(['circle', 'square', 'triangle', 'hexagon']);

  const handleChemistryStrokeColorChange = (color: string) => {
    setChemistryStrokeColor(color);
    setChemistryColor(color);
  };

  // Intelligent color picker based on canvas background
  const getOptimalPenColor = () => {
    return canvasBackground === 'dark' ? '#0ea5e9' : '#000000';
  };

  // Update pen color when canvas background changes
  useEffect(() => {
    const optimalColor = getOptimalPenColor();
    setChemistryColor(optimalColor);
    setChemistryStrokeColor(optimalColor);
    setChemistryFillColor(optimalColor);
  }, [canvasBackground]);

  useEffect(() => {
    if (!isResizingToolbar) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const delta = event.clientX - toolbarResizeStateRef.current.startX;
      const proposedWidth = toolbarResizeStateRef.current.startWidth + delta;
      const clampedWidth = Math.min(Math.max(proposedWidth, MIN_TOOLBAR_WIDTH), MAX_TOOLBAR_WIDTH);
      setToolbarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingToolbar(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingToolbar]);

  useEffect(() => {
    if (!showChemistryToolbar) {
      setIsResizingToolbar(false);
    }
  }, [showChemistryToolbar]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Fill canvas with background color
    ctx.fillStyle = canvasBackground === 'dark' ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Redraw all saved shapes
    redrawAllShapes(ctx);

    if (areaEraseSelection?.isActive) {
      drawAreaEraseOverlay(ctx, areaEraseSelection);
    }
  }, [showGrid, canvasBackground, shapes, forceRedraw, areaEraseSelection]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Adjust grid color based on canvas background
    ctx.strokeStyle = canvasBackground === 'dark' ? '#1e293b' : '#e5e7eb';
    ctx.lineWidth = 0.5;
    
    const gridSize = 20;
    
    for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
        ctx.stroke();
      }
  };

  const getShapeBounds = (shape: Shape) => {
    const minX = Math.min(shape.startX, shape.endX);
    const maxX = Math.max(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxY = Math.max(shape.startY, shape.endY);
    return { minX, minY, maxX, maxY };
  };

  const doesShapeIntersectRect = (
    shape: Shape,
    rect: { minX: number; minY: number; maxX: number; maxY: number }
  ) => {
    const bounds = getShapeBounds(shape);
    return !(
      bounds.maxX < rect.minX ||
      bounds.minX > rect.maxX ||
      bounds.maxY < rect.minY ||
      bounds.minY > rect.maxY
    );
  };

  const isPointWithinShape = (shape: Shape, x: number, y: number) => {
    const bounds = getShapeBounds(shape);
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
  };

  const drawAreaEraseOverlay = (
    ctx: CanvasRenderingContext2D,
    selection: { startX: number; startY: number; currentX: number; currentY: number }
  ) => {
    const minX = Math.min(selection.startX, selection.currentX);
    const minY = Math.min(selection.startY, selection.currentY);
    const width = Math.abs(selection.currentX - selection.startX);
    const height = Math.abs(selection.currentY - selection.startY);

    ctx.save();
    ctx.strokeStyle = '#f87171';
    ctx.fillStyle = 'rgba(248, 113, 113, 0.15)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(minX, minY, width, height);
    ctx.fillRect(minX, minY, width, height);
    ctx.restore();
  };

  // Helper function to detect which resize handle is being clicked
  const detectResizeHandle = (
    x: number,
    y: number,
    shape: Shape
  ): 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | null => {
    const handleSize = 12;
    const startX = shape.startX;
    const startY = shape.startY;
    const endX = shape.endX;
    const endY = shape.endY;

    // Define handle positions
    const handles = {
      tl: { x: startX, y: startY },
      tr: { x: endX, y: startY },
      bl: { x: startX, y: endY },
      br: { x: endX, y: endY },
      t: { x: (startX + endX) / 2, y: startY },
      b: { x: (startX + endX) / 2, y: endY },
      l: { x: startX, y: (startY + endY) / 2 },
      r: { x: endX, y: (startY + endY) / 2 }
    };

    // Check which handle is closest to the click
    for (const [handleName, handlePos] of Object.entries(handles)) {
      const dist = Math.sqrt(
        Math.pow(x - handlePos.x, 2) + Math.pow(y - handlePos.y, 2)
      );
      if (dist < handleSize) {
        return handleName as 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';
      }
    }
    return null;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const activeTool = showChemistryToolbar ? chemistryTool : currentTool;

    if (activeTool === 'eraser' && e.shiftKey) {
      setAreaEraseSelection({
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        isActive: true
      });
      setIsDrawing(false);
      return;
    }

    // Handle Rotate tool - rotate existing shapes (right-click)
    if (activeTool === 'rotate' && (e.button === 2 || e.ctrlKey)) {
      e.preventDefault();
      // Check if clicking on existing shape
      for (let i = canvasHistoryRef.current.length - 1; i >= 0; i--) {
        const shape = canvasHistoryRef.current[i];
        const dx = shape.endX - shape.startX;
        const dy = shape.endY - shape.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const centerX = shape.startX + dx / 2;
        const centerY = shape.startY + dy / 2;

        // Check if click is within shape bounds
        const tolerance = Math.max(distance / 2 + 10, 20);
        const distToShape = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );

        if (distToShape < tolerance) {
          setSelectedShapeId(shape.id);
          setIsRotatingShape(true);
          setDragOffset({ x: x - centerX, y: y - centerY });
          return;
        }
      }
      return;
    }

    // Handle Move/Select tool - move existing shapes
    if (activeTool === 'move') {
      // Check if clicking on existing shape
      for (let i = canvasHistoryRef.current.length - 1; i >= 0; i--) {
        const shape = canvasHistoryRef.current[i];
        const dx = shape.endX - shape.startX;
        const dy = shape.endY - shape.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const centerX = shape.startX + dx / 2;
        const centerY = shape.startY + dy / 2;

        // Check if click is within shape bounds
        const tolerance = Math.max(distance / 2 + 10, 20);
        const distToShape = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );

        if (distToShape < tolerance) {
          setSelectedShapeId(shape.id);
          setIsDraggingShape(true);
          setDragOffset({ x: x - centerX, y: y - centerY });
          return;
        }
      }
      return;
    }

    // Special handling for shape tools - create resizable single shape
    const shapeTools = ['arrow', 'circle', 'square', 'triangle', 'hexagon', 'plus', 'minus'];
    if (shapeTools.includes(activeTool)) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Save current canvas state for redrawing
      imageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      setArrowState({
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        isDrawing: true
      });
      return;
    }

    // Normal drawing for other tools
    setIsDrawing(true);
    setLastX(x);
    setLastY(y);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (areaEraseSelection?.isActive) {
      setAreaEraseSelection(prev =>
        prev ? { ...prev, currentX: x, currentY: y } : prev
      );
      return;
    }

    const activeTool = showChemistryToolbar ? chemistryTool : currentTool;
    const activeStrokeColor = showChemistryToolbar ? chemistryStrokeColor : strokeColor;
    const activeFillColor = showChemistryToolbar ? chemistryFillColor : activeStrokeColor;
    const activeFillEnabled = showChemistryToolbar ? chemistryFillEnabled : true;
    const activeColor = activeStrokeColor;
    const activeSize = showChemistryToolbar ? chemistrySize : strokeWidth;
    const fillConfig = {
      fillColor: activeFillColor,
      fillEnabled: activeFillEnabled && FILLABLE_SHAPES.has(activeTool),
    };

    // Handle moving existing shape
    if (isDraggingShape && selectedShapeId) {
      // Update shape position
      const updatedShapes = canvasHistoryRef.current.map(shape => {
        if (shape.id === selectedShapeId) {
          const newCenterX = x - dragOffset.x;
          const newCenterY = y - dragOffset.y;
          const dx = shape.endX - shape.startX;
          const dy = shape.endY - shape.startY;
          
          return {
            ...shape,
            startX: newCenterX - dx / 2,
            startY: newCenterY - dy / 2,
            endX: newCenterX + dx / 2,
            endY: newCenterY + dy / 2
          };
        }
        return shape;
      });
      
      setShapes(updatedShapes);
      canvasHistoryRef.current = updatedShapes;
      return;
    }

    // Handle rotating existing shape
    if (isRotatingShape && selectedShapeId) {
      // Calculate rotation angle from center
      const shape = canvasHistoryRef.current.find(s => s.id === selectedShapeId);
      if (shape) {
        const dx = shape.endX - shape.startX;
        const dy = shape.endY - shape.startY;
        const centerX = shape.startX + dx / 2;
        const centerY = shape.startY + dy / 2;

        // Calculate angle from center to current mouse position
        const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
        
        // Update shape rotation
        const updatedShapes = canvasHistoryRef.current.map(s => {
          if (s.id === selectedShapeId) {
            return {
              ...s,
              rotation: (angle + 90) % 360  // Adjust angle so 0 is up
            };
          }
          return s;
        });
        
        setShapes(updatedShapes);
        canvasHistoryRef.current = updatedShapes;
      }
      return;
    }

    // Handle resizing existing shape
    if (isResizing && selectedShapeId) {
      const shape = canvasHistoryRef.current.find(s => s.id === selectedShapeId);
      if (shape) {
        const dx = x - resizeStartX;
        const dy = y - resizeStartY;
        const newWidth = resizeStartWidth + dx;
        const newHeight = resizeStartHeight + dy;

        // Ensure new dimensions are positive
        if (newWidth > 0 && newHeight > 0) {
          setShapes(canvasHistoryRef.current.map(s => {
            if (s.id === selectedShapeId) {
              return {
                ...s,
                startX: shape.startX,
                startY: shape.startY,
                endX: shape.startX + newWidth,
                endY: shape.startY + newHeight,
                size: newWidth // Assuming size is width for simplicity
              };
            }
            return s;
          }));
          canvasHistoryRef.current = canvasHistoryRef.current.map(s => {
            if (s.id === selectedShapeId) {
              return {
                ...s,
                startX: shape.startX,
                startY: shape.startY,
                endX: shape.startX + newWidth,
                endY: shape.startY + newHeight,
                size: newWidth // Assuming size is width for simplicity
              };
            }
            return s;
          });
        }
        return;
      }
    }

    // Handle shape preview while dragging (arrow, circle, square, triangle, hexagon, plus, minus)
    const shapeTools = ['arrow', 'circle', 'square', 'triangle', 'hexagon', 'plus', 'minus'];
    if (shapeTools.includes(activeTool) && arrowState && arrowState.isDrawing && imageDataRef.current) {
      // Restore previous canvas state
      ctx.putImageData(imageDataRef.current, 0, 0);
      
      // Redraw grid if needed
      if (showGrid) {
        drawGrid(ctx, canvas.width, canvas.height);
      }
      
      // Update shape end position
      setArrowState({
        ...arrowState,
        endX: x,
        endY: y
      });
      
      // Calculate size based on distance from start to end
      const dx = x - arrowState.startX;
      const dy = y - arrowState.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const centerX = arrowState.startX + dx / 2;
      const centerY = arrowState.startY + dy / 2;
      
      // Draw preview based on active tool
      if (activeTool === 'arrow') {
        drawArrow(ctx, arrowState.startX, arrowState.startY, x, y, activeSize, activeStrokeColor);
      } else if (activeTool === 'circle') {
        drawCircle(ctx, centerX, centerY, distance / 2, activeStrokeColor, fillConfig);
      } else if (activeTool === 'square') {
        drawSquare(ctx, centerX, centerY, distance, activeStrokeColor, fillConfig);
      } else if (activeTool === 'triangle') {
        drawTriangle(ctx, centerX, centerY, distance, activeStrokeColor, fillConfig);
      } else if (activeTool === 'hexagon') {
        drawHexagon(ctx, centerX, centerY, distance / 2, activeStrokeColor, fillConfig);
      } else if (activeTool === 'plus') {
        drawPlus(ctx, centerX, centerY, distance / 2, activeSize, activeStrokeColor);
      } else if (activeTool === 'minus') {
        drawMinus(ctx, centerX, centerY, distance / 2, activeSize, activeStrokeColor);
      }
      return;
    }

    // Normal drawing for other tools
    if (!isDrawing) return;

    // Use chemistry tool settings if chemistry toolbar is active
    const activeColorNormal = activeStrokeColor;
    const activeSizeNormal = showChemistryToolbar ? chemistrySize : strokeWidth;
    const activeToolNormal = showChemistryToolbar ? chemistryTool : currentTool;
    const fillConfigNormal = {
      fillColor: activeFillColor,
      fillEnabled: activeFillEnabled && FILLABLE_SHAPES.has(activeToolNormal),
    };

    if (activeToolNormal === 'pen' || activeToolNormal === 'draw') {
      ctx.strokeStyle = activeColorNormal;
      ctx.lineWidth = activeSizeNormal;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeToolNormal === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = activeSizeNormal * 2;
      ctx.lineCap = 'round';
      
      ctx.lineTo(x, y);
      ctx.stroke();
      
      ctx.globalCompositeOperation = 'source-over';
    } else if (activeToolNormal === 'atom') {
      drawAtom(ctx, x, y, activeSizeNormal, activeColorNormal);
    } else if (activeToolNormal === 'bond') {
      drawBond(ctx, lastX, lastY, x, y, activeSizeNormal, activeColorNormal);
    } else if (activeToolNormal === 'electron') {
      drawElectron(ctx, x, y, activeSizeNormal, activeColorNormal);
    } else if (activeToolNormal === 'circle') {
      drawCircle(ctx, x, y, activeSizeNormal * 3, activeColorNormal, fillConfigNormal);
    } else if (activeToolNormal === 'square') {
      drawSquare(ctx, x, y, activeSizeNormal * 3, activeColorNormal, fillConfigNormal);
    } else if (activeToolNormal === 'triangle') {
      drawTriangle(ctx, x, y, activeSizeNormal * 3, activeColorNormal, fillConfigNormal);
    } else if (activeToolNormal === 'hexagon') {
      drawHexagon(ctx, x, y, activeSizeNormal * 3, activeColorNormal, fillConfigNormal);
    }

    setLastX(x);
    setLastY(y);
  };

  // Chemistry drawing functions
  interface ShapeDrawOptions {
    fillColor?: string;
    fillEnabled?: boolean;
    strokeWidth?: number;
  }

  const drawAtom = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  };

  const drawBond = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, size: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, size: number, color: string) => {
    const headlen = Math.max(size * 8, 15); // Proportional arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw filled arrowhead (triangle)
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const drawElectron = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawCircle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    options?: ShapeDrawOptions
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = options?.strokeWidth ?? 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    if (options?.fillEnabled !== false) {
      ctx.fillStyle = options?.fillColor ?? color;
      ctx.fill();
    }
    ctx.stroke();
  };

  const drawSquare = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    options?: ShapeDrawOptions
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = options?.strokeWidth ?? 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.rect(x - size/2, y - size/2, size, size);
    if (options?.fillEnabled !== false) {
      ctx.fillStyle = options?.fillColor ?? color;
      ctx.fill();
    }
    ctx.stroke();
  };

  const drawTriangle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    options?: ShapeDrawOptions
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = options?.strokeWidth ?? 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - size/2);
    ctx.lineTo(x - size/2, y + size/2);
    ctx.lineTo(x + size/2, y + size/2);
    ctx.closePath();
    if (options?.fillEnabled !== false) {
      ctx.fillStyle = options?.fillColor ?? color;
      ctx.fill();
    }
    ctx.stroke();
  };

  const drawHexagon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    options?: ShapeDrawOptions
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = options?.strokeWidth ?? 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    if (options?.fillEnabled !== false) {
      ctx.fillStyle = options?.fillColor ?? color;
      ctx.fill();
    }
    ctx.stroke();
  };

  const drawPlus = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, strokeWidth: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();
  };

  const drawMinus = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, strokeWidth: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();
  };

  const drawMolecule = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    if (!shape.moleculeData) {
      console.warn('Molecule data not available for shape:', shape);
      return;
    }

    const cid = shape.moleculeData.cid;
    const cache = moleculeImageCacheRef.current;
    const sdfCache = sdfCacheRef.current;
    
    // Calculate position and size
    const centerX = shape.startX + (shape.endX - shape.startX) / 2;
    const centerY = shape.startY + (shape.endY - shape.startY) / 2;
    const width = Math.abs(shape.endX - shape.startX);
    const height = Math.abs(shape.endY - shape.startY);

    // Try to render SDF structure first if available
    if (shape.moleculeData.svgData) {
      // SDF takes priority for 2D structure rendering
      try {
        if (!sdfCache.has(cid) && shape.moleculeData.svgData) {
          const parsed = parseSDF(shape.moleculeData.svgData);
          if (parsed) {
            sdfCache.set(cid, parsed);
          }
        }

        const parsedSDF = sdfCache.get(cid);
        if (parsedSDF) {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate((shape.rotation * Math.PI) / 180);
          drawSDF2DStructure(ctx, parsedSDF, 0, 0, 25);
          ctx.restore();
          return;
        }
      } catch (error) {
        console.warn('Error rendering SDF, falling back to SVG/PNG:', error);
      }
    }

    // Check if we have a cached image
    if (cache.has(cid)) {
      const img = cache.get(cid);
      if (img && img.complete) {
        // Apply rotation and draw
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((shape.rotation * Math.PI) / 180);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
        return;
      }
    }

    // If no cached image, try to load from SVG data or use PNG fallback
    if (shape.moleculeData.svgData) {
      // Convert SVG to image and cache it
      const svg = shape.moleculeData.svgData;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Cache the loaded image
        cache.set(cid, img);
        
        // Apply rotation and draw
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((shape.rotation * Math.PI) / 180);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
        
        // Trigger redraw to ensure canvas updates
        setForceRedraw(prev => prev + 1);
      };
      img.onerror = () => {
        console.warn('Failed to load SVG for molecule:', shape.moleculeData.name);
        // Fallback to PNG
        loadMoleculePNG(ctx, shape, centerX, centerY, width, height);
      };
      img.src = url;
    } else {
      // Use PNG as fallback (like 3D molecules)
      loadMoleculePNG(ctx, shape, centerX, centerY, width, height);
    }
  };

  // Helper function to load molecule as PNG (fallback)
  const loadMoleculePNG = (
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ) => {
    const cid = shape.moleculeData?.cid;
    if (!cid) return;

    const cache = moleculeImageCacheRef.current;
    
    // Check cache first
    if (cache.has(cid)) {
      const img = cache.get(cid);
      if (img && img.complete) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((shape.rotation * Math.PI) / 180);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
        return;
      }
    }

    // Load PNG from PubChem
    const pngUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/CID/${cid}/PNG?image_size=400x400`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cache.set(cid, img);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((shape.rotation * Math.PI) / 180);
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.restore();
      
      // Trigger redraw to ensure canvas updates
      setForceRedraw(prev => prev + 1);
    };
    img.onerror = () => {
      console.warn('Failed to load molecule PNG:', shape.moleculeData?.name);
      // Draw placeholder
      ctx.save();
      ctx.fillStyle = '#3b82f6';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(shape.startX, shape.startY, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1;
      ctx.fillText(shape.moleculeData?.formula || 'Molecule', centerX, centerY);
      ctx.restore();
    };
    img.src = pngUrl;
  };

  const stopDrawing = () => {
    if (areaEraseSelection?.isActive) {
      const { startX, startY, currentX, currentY } = areaEraseSelection;
      const minX = Math.min(startX, currentX);
      const maxX = Math.max(startX, currentX);
      const minY = Math.min(startY, currentY);
      const maxY = Math.max(startY, currentY);
      const width = maxX - minX;
      const height = maxY - minY;

      let updatedShapes = canvasHistoryRef.current;
      if (width < 5 && height < 5) {
        for (let i = canvasHistoryRef.current.length - 1; i >= 0; i--) {
          const shape = canvasHistoryRef.current[i];
          if (isPointWithinShape(shape, startX, startY)) {
            updatedShapes = canvasHistoryRef.current.filter((_, index) => index !== i);
            break;
          }
        }
      } else {
        const selectionRect = { minX, minY, maxX, maxY };
        updatedShapes = canvasHistoryRef.current.filter(
          (shape) => !doesShapeIntersectRect(shape, selectionRect)
        );
      }

      if (updatedShapes.length !== canvasHistoryRef.current.length) {
        setShapes(updatedShapes);
        canvasHistoryRef.current = updatedShapes;
        setSelectedShapeId(null);
      }

      setAreaEraseSelection(null);
      setIsDrawing(false);
      return;
    }

    // Stop rotating shape
    if (isRotatingShape) {
      setIsRotatingShape(false);
      setSelectedShapeId(null);
      return;
    }

    // Stop dragging shape
    if (isDraggingShape) {
      setIsDraggingShape(false);
      setSelectedShapeId(null);
      return;
    }

    // Stop resizing shape
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      // Keep selected for next operation
      return;
    }

    // Save shape if it was being drawn
    if (arrowState && arrowState.isDrawing) {
      const activeTool = showChemistryToolbar ? chemistryTool : currentTool;
      const activeStroke = showChemistryToolbar ? chemistryStrokeColor : strokeColor;
      const activeFill = showChemistryToolbar ? chemistryFillColor : activeStroke;
      const fillEnabled =
        showChemistryToolbar ? chemistryFillEnabled && FILLABLE_SHAPES.has(activeTool) : FILLABLE_SHAPES.has(activeTool);
      const activeSize = showChemistryToolbar ? chemistrySize : strokeWidth;

      // Create shape object
      const newShape: Shape = {
        id: Date.now().toString(),
        type: activeTool as any,
        startX: arrowState.startX,
        startY: arrowState.startY,
        endX: arrowState.endX,
        endY: arrowState.endY,
        color: activeStroke,
        strokeColor: activeStroke,
        fillColor: fillEnabled ? activeFill : undefined,
        fillEnabled,
        size: activeSize,
        rotation: 0 // Default rotation
      };

      // Add to shapes history
      const updatedShapes = [...shapes, newShape];
      setShapes(updatedShapes);
      canvasHistoryRef.current = updatedShapes;

      setArrowState({
        ...arrowState,
        isDrawing: false
      });
      imageDataRef.current = null;
      return;
    }
    
    setIsDrawing(false);
  };

  // Function to redraw all saved shapes
  const redrawAllShapes = (ctx: CanvasRenderingContext2D) => {
    for (const shape of canvasHistoryRef.current) {
      const dx = shape.endX - shape.startX;
      const dy = shape.endY - shape.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const centerX = shape.startX + dx / 2;
      const centerY = shape.startY + dy / 2;

      // Apply rotation if shape has rotation
      if (shape.rotation !== 0) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((shape.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      const strokeColor = shape.strokeColor ?? shape.color;
      const shapeSupportsFill = FILLABLE_SHAPES.has(shape.type);
      const fillEnabled = shapeSupportsFill && shape.fillEnabled !== false;
      const fillOptions: ShapeDrawOptions = {
        fillColor: fillEnabled ? shape.fillColor ?? strokeColor : undefined,
        fillEnabled,
      };

      if (shape.type === 'arrow') {
        drawArrow(ctx, shape.startX, shape.startY, shape.endX, shape.endY, shape.size, strokeColor);
      } else if (shape.type === 'circle') {
        drawCircle(ctx, centerX, centerY, distance / 2, strokeColor, fillOptions);
      } else if (shape.type === 'square') {
        drawSquare(ctx, centerX, centerY, distance, strokeColor, fillOptions);
      } else if (shape.type === 'triangle') {
        drawTriangle(ctx, centerX, centerY, distance, strokeColor, fillOptions);
      } else if (shape.type === 'hexagon') {
        drawHexagon(ctx, centerX, centerY, distance / 2, strokeColor, fillOptions);
      } else if (shape.type === 'plus') {
        drawPlus(ctx, centerX, centerY, distance / 2, shape.size, strokeColor);
      } else if (shape.type === 'minus') {
        drawMinus(ctx, centerX, centerY, distance / 2, shape.size, strokeColor);
      } else if (shape.type === 'molecule') {
        drawMolecule(ctx, shape);
      }

      // Restore context if rotation was applied
      if (shape.rotation !== 0) {
        ctx.restore();
      }

      // Draw selection indicator if shape is selected
      if (selectedShapeId === shape.id) {
        // Draw selection box
        ctx.strokeStyle = '#0ea5e9';  // Cyan selection color
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);  // Dashed line
        ctx.globalAlpha = 0.8;
        
        const tolerance = Math.max(distance / 2 + 15, 25);
        ctx.beginPath();
        ctx.arc(centerX, centerY, tolerance, 0, 2 * Math.PI);
        ctx.stroke();
        
        ctx.setLineDash([]);  // Reset to solid
        
        // Draw resize handles (corners and edges)
        const handleSize = 12;
        const handlePositions = [
          // Corners
          { x: shape.startX, y: shape.startY },
          { x: shape.endX, y: shape.startY },
          { x: shape.endX, y: shape.endY },
          { x: shape.startX, y: shape.endY },
          // Edges
          { x: (shape.startX + shape.endX) / 2, y: shape.startY },
          { x: shape.endX, y: (shape.startY + shape.endY) / 2 },
          { x: (shape.startX + shape.endX) / 2, y: shape.endY },
          { x: shape.startX, y: (shape.startY + shape.endY) / 2 },
        ];
        
        // Draw each handle
        handlePositions.forEach((pos, index) => {
          ctx.fillStyle = '#0ea5e9';  // Cyan handles
          ctx.fillRect(
            pos.x - handleSize / 2,
            pos.y - handleSize / 2,
            handleSize,
            handleSize
          );
          
          // White border for contrast
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            pos.x - handleSize / 2,
            pos.y - handleSize / 2,
            handleSize,
            handleSize
          );
        });
        
        ctx.globalAlpha = 1;
        
        // Draw label
        ctx.fillStyle = '#0ea5e9';
        ctx.font = '12px Arial';
        ctx.fillText('Drag corners to resize', shape.startX, shape.startY - 20);
      }
    }
  };

  // Touch event handlers
  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) / zoom,
      y: (touch.clientY - rect.top) / zoom
    };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getTouchPos(e);

    setIsDrawing(true);
    setLastX(x);
    setLastY(y);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getTouchPos(e);

    // Use chemistry tool settings if chemistry toolbar is active
    const activeStrokeColor = showChemistryToolbar ? chemistryStrokeColor : strokeColor;
    const activeFillColor = showChemistryToolbar ? chemistryFillColor : activeStrokeColor;
    const activeFillEnabled = showChemistryToolbar ? chemistryFillEnabled : true;
    const activeSize = showChemistryToolbar ? chemistrySize : strokeWidth;
    const activeTool = showChemistryToolbar ? chemistryTool : currentTool;
    const fillConfig = {
      fillColor: activeFillColor,
      fillEnabled: activeFillEnabled && FILLABLE_SHAPES.has(activeTool),
    };

    if (activeTool === 'pen' || activeTool === 'draw') {
      ctx.strokeStyle = activeStrokeColor;
      ctx.lineWidth = activeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = activeSize * 2;
      ctx.lineCap = 'round';
      
      ctx.lineTo(x, y);
      ctx.stroke();
      
      ctx.globalCompositeOperation = 'source-over';
    } else if (activeTool === 'atom') {
      drawAtom(ctx, x, y, activeSize, activeStrokeColor);
    } else if (activeTool === 'bond') {
      drawBond(ctx, lastX, lastY, x, y, activeSize, activeStrokeColor);
    } else if (activeTool === 'arrow') {
      drawArrow(ctx, lastX, lastY, x, y, activeSize, activeStrokeColor);
    } else if (activeTool === 'electron') {
      drawElectron(ctx, x, y, activeSize, activeStrokeColor);
    } else if (activeTool === 'circle') {
      drawCircle(ctx, x, y, activeSize * 3, activeStrokeColor, fillConfig);
    } else if (activeTool === 'square') {
      drawSquare(ctx, x, y, activeSize * 3, activeStrokeColor, fillConfig);
    } else if (activeTool === 'triangle') {
      drawTriangle(ctx, x, y, activeSize * 3, activeStrokeColor, fillConfig);
    } else if (activeTool === 'hexagon') {
      drawHexagon(ctx, x, y, activeSize * 3, activeStrokeColor, fillConfig);
    }

    setLastX(x);
    setLastY(y);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    // Ask for confirmation before clearing
    if (!window.confirm('Are you sure you want to clear the canvas? This will remove all drawings and analysis results.')) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Clear any existing corrections and analysis results
    setCorrections([]);
    setShowCorrections(false);
    setAnalysisResult(null);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const analyzeCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const apiKey = getStoredAPIKey();
    if (!apiKey) {
      alert('Please add your Gemini API key in the settings to use the canvas analysis feature.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Convert canvas to base64 image
      const canvasData = canvas.toDataURL('image/png', 0.8);
      
      // Analyze with LLM
      const result = await analyzeCanvasWithLLM(canvasData, apiKey, 'chemistry');
      
      setAnalysisResult(result);
      setCorrections(result.corrections);
      setShowCorrections(true);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze canvas content. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearCorrections = () => {
    setCorrections([]);
    setShowCorrections(false);
    setAnalysisResult(null);
  };

  const convertToChemistry = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const apiKey = getStoredAPIKey();
    if (!apiKey) {
      alert('Please add your Gemini API key in settings to use the chemistry conversion feature.');
      return;
    }

    setIsConverting(true);
    try {
      // Convert canvas to base64
      const canvasData = canvas.toDataURL('image/png', 0.8);
      
      // Convert to chemistry structure
      const result = await convertCanvasToChemistry(canvasData, apiKey);
      
      if (result.success && result.structure) {
        setChemistryStructure(result.structure);
        setShowChemistryViewer(true);
      } else {
        alert(result.error || 'Failed to convert to chemistry structure');
      }
    } catch (error) {
      console.error('Chemistry conversion failed:', error);
      alert('Failed to convert to chemistry structure. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleToolbarResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toolbarResizeStateRef.current = {
      startX: event.clientX,
      startWidth: toolbarWidth,
    };
    setIsResizingToolbar(true);
  };

  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* Chemistry Toolbar Toggle Button */}
      <div className="absolute top-8 left-8 z-10">
        <button
          onClick={() => setShowChemistryToolbar(!showChemistryToolbar)}
          className={`p-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg transition-all ${
            showChemistryToolbar ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
          }`}
          title={showChemistryToolbar ? "Hide Chemistry Tools" : "Show Chemistry Tools"}
        >
          <Atom size={18} />
        </button>
      </div>

      {/* Chemistry Toolbar */}
      {showChemistryToolbar && (
        <div className="absolute top-24 left-8 z-10">
          <ChemistryToolbar
            onToolSelect={setChemistryTool}
            currentTool={chemistryTool}
            onColorChange={setChemistryColor}
            onStrokeColorChange={handleChemistryStrokeColorChange}
            strokeColor={chemistryStrokeColor}
            fillEnabled={chemistryFillEnabled}
            onFillToggle={setChemistryFillEnabled}
            fillColor={chemistryFillColor}
            onFillColorChange={setChemistryFillColor}
            currentColor={chemistryColor}
            onSizeChange={setChemistrySize}
            currentSize={chemistrySize}
            onOpenCalculator={onOpenCalculator}
            onOpenMolView={onOpenMolView}
            onOpenPeriodicTable={onOpenPeriodicTable}
            onOpenMoleculeSearch={() => setShowMoleculeSearch(true)}
            onOpenChemistryWidgets={() => setShowChemistryWidgetPanel(true)}
            isCollapsed={isToolbarCollapsed}
            onToggleCollapse={() => setIsToolbarCollapsed((prev) => !prev)}
            width={toolbarWidth}
            onResizeStart={handleToolbarResizeStart}
          />
        </div>
      )}

      {/* Help Instructions - Bottom Left */}
      <div className="absolute bottom-8 left-8 z-10 max-w-sm rounded-xl border border-slate-700/50 bg-slate-800/90 p-4 shadow-lg backdrop-blur-sm">
        <div className="mb-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Lightbulb className="h-4 w-4 text-amber-300" />
            Shape Controls
          </p>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-slate-400 font-semibold text-cyan-400">Move:</p>
            <ol className="text-xs text-slate-400 space-y-0.5 ml-2">
              <li>1. Select Move Tool</li>
              <li>2. Click shape</li>
              <li>3. Drag to position</li>
            </ol>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold text-cyan-400">Rotate:</p>
            <ol className="text-xs text-slate-400 space-y-0.5 ml-2">
              <li>1. Select Rotate Tool</li>
              <li>2. Right-click on shape</li>
              <li>3. Drag to rotate</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Canvas Controls */}
      <div className="absolute top-8 right-8 z-10 flex flex-col items-end gap-3">
        <button
          onClick={() => setShowMoleculeSearch(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 shadow-lg transition-all hover:bg-slate-700/60"
          title="Search Molecules"
        >
          <Atom size={18} className="text-blue-300" />
          <span>Search Molecules</span>
        </button>

        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 shadow-lg">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-all ${
              showGrid 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-slate-700/50'
            }`}
            title="Toggle Grid"
          >
            <Grid3x3 size={18} />
          </button>
        </div>

        {/* Canvas Background Toggle */}
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 shadow-lg">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setCanvasBackground('dark')}
              className={`flex items-center justify-center gap-2 rounded-lg p-2 text-xs font-medium transition-all ${
                canvasBackground === 'dark'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-400 hover:bg-slate-700/50'
              }`}
              title="Dark Canvas (Blue/Black)"
            >
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => setCanvasBackground('white')}
              className={`flex items-center justify-center gap-2 rounded-lg p-2 text-xs font-medium transition-all ${
                canvasBackground === 'white'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-400 hover:bg-slate-700/50'
              }`}
              title="White Canvas"
            >
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 shadow-lg flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-400 hover:bg-slate-700/50 rounded-lg transition-all"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 text-slate-400 hover:bg-slate-700/50 rounded-lg transition-all"
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-400 hover:bg-slate-700/50 rounded-lg transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
        </div>

        {/* Clear Canvas Button */}
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 shadow-lg">
          <button
            onClick={clearCanvas}
            className="p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all"
            title="Clear Canvas"
          >
            <Trash2 size={18} />
          </button>
        </div>

            {/* Chemistry Conversion Button */}
            <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 shadow-lg">
              <button
                onClick={convertToChemistry}
                disabled={isConverting}
                className={`p-3 rounded-lg transition-all flex items-center gap-2 ${
                  isConverting
                    ? 'bg-primary/50 text-primary-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                title={isConverting ? "Converting..." : "Convert to Chemistry Structure"}
              >
                {isConverting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Beaker size={18} />
                )}
                <span className="text-sm font-medium">
                  {isConverting ? 'Converting...' : 'Convert'}
                </span>
              </button>
            </div>

            {/* Correction Button */}
            <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 shadow-lg">
              <button
                onClick={showCorrections ? clearCorrections : analyzeCanvas}
                disabled={isAnalyzing}
                className={`p-3 rounded-lg transition-all flex items-center gap-2 ${
                  isAnalyzing
                    ? 'bg-primary/50 text-primary-foreground cursor-not-allowed'
                    : showCorrections
                    ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                title={isAnalyzing ? "Analyzing..." : showCorrections ? "Clear Corrections" : "Check My Work"}
              >
                {isAnalyzing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : showCorrections ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span className="text-sm font-medium">
                  {isAnalyzing ? 'Analyzing...' : showCorrections ? 'Clear' : 'Check'}
                </span>
              </button>
            </div>
      </div>

      {/* Zoom Indicator */}
      <div className="absolute bottom-8 right-8 z-10 rounded-lg border border-slate-700/50 bg-slate-800/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        <span className="text-xs font-medium text-slate-300">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          touchAction: 'none'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Correction Markers - Simplified */}
      {showCorrections && corrections.map((correction) => (
        <div
          key={correction.id}
          className="absolute z-20 pointer-events-none"
          style={{
            left: correction.x * zoom,
            top: correction.y * zoom,
          }}
        >
          {/* Simple Marker */}
          <div className={`w-3 h-3 rounded-full border-2 ${
            correction.type === 'error' ? 'bg-red-500 border-red-600' :
            correction.type === 'warning' ? 'bg-yellow-500 border-yellow-600' :
            'bg-blue-500 border-blue-600'
          } shadow-lg animate-pulse`} />
        </div>
      ))}

      {/* Analysis Results Panel - Side-by-Side Layout */}
      {showCorrections && analysisResult && (
        <div className="absolute bottom-4 right-4 z-10 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl analysis-panel" style={{ width: '1000px', height: '700px' }}>
          {/* Header with Score */}
          <div className="sticky top-0 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-white flex items-center gap-3">
                <AlertCircle size={20} className="text-orange-400" />
                Canvas Analysis Results
              </h4>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg text-sm font-bold ${
                  analysisResult.overallScore >= 80 ? 'bg-green-600 text-green-100' :
                  analysisResult.overallScore >= 60 ? 'bg-yellow-600 text-yellow-100' :
                  'bg-red-600 text-red-100'
                }`}>
                  {analysisResult.overallScore}%
                </div>
                <button
                  onClick={clearCorrections}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-slate-300 text-sm rounded-lg transition-colors"
                  title="Close Analysis"
                >
                  ✕ Close
                </button>
                <div className="text-xs text-slate-400 mt-2">
                  Analysis Status: {isAnalyzing ? 'Analyzing...' : 'Complete'} | 
                  Corrections: {corrections.length} | 
                  Score: {analysisResult?.overallScore || 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Content */}
          <div className="flex analysis-content">
            {/* Left Panel - Errors & Corrections */}
            <div className="flex-1 p-8 border-r border-slate-700/50 analysis-sidebar">
              {/* Overall Feedback */}
              {analysisResult.feedback && (
                <div className="mb-8 p-5 bg-gradient-to-r from-slate-700/50 to-slate-600/30 rounded-lg border border-slate-600/30">
                  <h5 className="text-base font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Brain size={18} className="text-blue-400" />
                    Overall Feedback
                  </h5>
                  <p className="text-base text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {analysisResult.feedback}
                  </p>
                </div>
              )}

              {/* Corrections */}
              <div>
                <h5 className="text-base font-semibold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-400" />
                  Errors & Corrections ({corrections.length})
                </h5>
                {corrections.length > 0 ? (
                  <div className="space-y-5">
                    {corrections.map((correction, index) => (
                      <div key={correction.id} className="correction-item p-5 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:bg-slate-700/40 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            correction.type === 'error' ? 'bg-red-500' :
                            correction.type === 'warning' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}>
                            <span className="text-white text-sm font-bold">
                              {correction.type === 'error' ? '!' : correction.type === 'warning' ? '⚠' : 'i'}
                            </span>
                          </div>
                          <span className={`text-base font-medium px-4 py-2 rounded ${
                            correction.type === 'error' ? 'bg-red-600 text-red-100' :
                            correction.type === 'warning' ? 'bg-yellow-600 text-yellow-100' :
                            'bg-blue-600 text-blue-100'
                          }`}>
                            {correction.type.toUpperCase()}
                          </span>
                          <span className={`text-base px-4 py-2 rounded ${
                            correction.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                            correction.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {correction.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-base text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {correction.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 bg-green-900/20 rounded-lg border border-green-600/30">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle size={18} className="text-green-400" />
                      <span className="text-base font-medium text-green-300">No Errors Found!</span>
                    </div>
                    <p className="text-base text-green-200">
                      Great job! Your chemical formulas and equations appear to be correct.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Suggestions & Tips */}
            <div className="flex-1 p-8 analysis-sidebar">
              {/* Suggestions */}
              {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                <div>
                  <h5 className="text-base font-semibold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-400" />
                    Study Tips & Suggestions
                  </h5>
                  <div className="space-y-5">
                    {analysisResult.suggestions.map((suggestion, index) => (
                      <div key={index} className="suggestion-item p-5 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-600/30 hover:bg-purple-900/30 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-4 h-4 rounded-full bg-purple-400 mt-1 flex-shrink-0" />
                          <p className="text-base text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {suggestion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Guide */}
              <div className="mt-8 p-5 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-600/30">
                <h6 className="text-base font-semibold text-green-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-400" />
                  Quick Study Guide
                </h6>
                <div className="space-y-4 text-base text-slate-300">
                  <div className="flex items-center gap-4">
                    <span className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></span>
                    <span>Review chemical notation and subscript placement</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></span>
                    <span>Practice balancing equations step by step</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></span>
                    <span>Double-check molecular formulas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chemistry Structure Viewer */}
      {showChemistryViewer && chemistryStructure && (
        <ChemistryStructureViewer
          structure={chemistryStructure}
          onClose={() => setShowChemistryViewer(false)}
          onRegenerate={convertToChemistry}
        />
      )}

      {/* Molecule Search Modal */}
      {showMoleculeSearch && (
        <MoleculeSearch
          onClose={() => setShowMoleculeSearch(false)}
          onSelectMolecule={(moleculeData) => {
            // Add molecule to canvas at center position
            const canvas = canvasRef.current;
            if (canvas) {
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;
              
              const newMolecule: Shape = {
                id: `molecule-${Date.now()}`,
                type: 'molecule',
                startX: centerX,
                startY: centerY,
                endX: centerX + 100,
                endY: centerY + 100,
                color: chemistryColor,
                size: chemistrySize,
                rotation: 0,
                moleculeData: {
                  name: moleculeData.name,
                  cid: moleculeData.cid,
                  formula: moleculeData.formula,
                  weight: moleculeData.weight,
                  svgUrl: moleculeData.svgUrl,
                  svgData: moleculeData.svgData,
                  smiles: moleculeData.smiles,
                }
              };
              
              // Add to shapes array
              setShapes([...shapes, newMolecule]);
              canvasHistoryRef.current = [...shapes, newMolecule];
              
              // Callback if provided
              if (onMoleculeInserted) {
                onMoleculeInserted(moleculeData);
              }
              
              console.log('✅ Molecule added to canvas:', newMolecule);
            }
            setShowMoleculeSearch(false);
          }}
        />
      )}

      {/* Chemistry Widget Panel Modal */}
      {showChemistryWidgetPanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <ChemistryWidgetPanel onClose={() => setShowChemistryWidgetPanel(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
