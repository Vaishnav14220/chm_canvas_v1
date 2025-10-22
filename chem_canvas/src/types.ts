export interface DrawingElement {
  type: 'path' | 'text' | 'shape';
  id: string;
  data: any;
}

export interface PathElement extends DrawingElement {
  type: 'path';
  data: {
    points: { x: number; y: number }[];
    color: string;
    width: number;
  };
}

export interface TextElement extends DrawingElement {
  type: 'text';
  data: {
    content: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
  };
}

export interface CanvasState {
  elements: DrawingElement[];
  backgroundColor: string;
}

export type InteractionMode = 'chat' | 'coach';

export interface AIInteraction {
  id: string;
  prompt: string;
  response: string;
  timestamp: Date;
  mode: InteractionMode;
}
