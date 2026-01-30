// Layer types for Konva rendering

export interface LayerPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextConstraints {
  max_font: number;
  min_font: number;
  max_lines: number;
}

export interface BackgroundLayer {
  type: 'background';
  properties: Record<string, unknown>;
}

export interface TextBoxLayer {
  type: 'text_box';
  id: string;
  position: LayerPosition;
  constraints: TextConstraints;
  align?: 'left' | 'center' | 'right';
  bulletStyle?: 'disc' | 'numbered';
  style?: string;
}

export type Layer = BackgroundLayer | TextBoxLayer;

export interface LayersBlueprint {
  layers: Layer[];
}

export interface SlideContent {
  [layerId: string]: string | string[];
}

export interface SlideData {
  layoutId: string;
  blueprint: LayersBlueprint;
  content: SlideContent;
  styleKit: StyleKit;
}

export interface StyleKit {
  id: string;
  name: string;
  typography: {
    headline_font: string;
    headline_weight: number;
    body_font: string;
    body_weight: number;
  };
  colors: {
    background: string;
    foreground: string;
    accent: string;
    marker?: string;
  };
  spacingRules: {
    padding: 'tight' | 'normal' | 'roomy';
    line_height: number;
  };
}
