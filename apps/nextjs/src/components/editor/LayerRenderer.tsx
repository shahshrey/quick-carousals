'use client';

import { Rect, Text } from 'react-konva';
import type { Layer, TextBoxLayer, SlideContent, StyleKit } from './types';

interface LayerRendererProps {
  layers: Layer[];
  content: SlideContent;
  styleKit: StyleKit;
  onTextBoxClick?: (layerId: string, position: { x: number; y: number; width: number; height: number }) => void;
}

export function LayerRenderer({ layers, content, styleKit, onTextBoxClick }: LayerRendererProps) {
  return (
    <>
      {layers.map((layer, index) => {
        if (layer.type === 'background') {
          return renderBackgroundLayer(layer, styleKit, index);
        } else if (layer.type === 'text_box') {
          return renderTextBoxLayer(layer, content, styleKit, index, onTextBoxClick);
        }
        return null;
      })}
    </>
  );
}

function renderBackgroundLayer(
  layer: Layer,
  styleKit: StyleKit,
  index: number
) {
  return (
    <Rect
      key={`bg-${index}`}
      x={0}
      y={0}
      width={1080}
      height={1350}
      fill={styleKit.colors.background}
    />
  );
}

function renderTextBoxLayer(
  layer: TextBoxLayer,
  content: SlideContent,
  styleKit: StyleKit,
  index: number,
  onTextBoxClick?: (layerId: string, position: { x: number; y: number; width: number; height: number }) => void
) {
  const layerContent = content[layer.id];
  
  // Handle both string and string[] content
  let text = '';
  if (Array.isArray(layerContent)) {
    if (layer.bulletStyle === 'numbered') {
      text = layerContent.map((line, i) => `${i + 1}. ${line}`).join('\n');
    } else if (layer.bulletStyle === 'disc') {
      text = layerContent.map(line => `• ${line}`).join('\n');
    } else {
      text = layerContent.join('\n');
    }
  } else if (typeof layerContent === 'string') {
    text = layerContent;
  }

  // Determine font family based on layer id
  const isHeadline = layer.id.includes('headline');
  const fontFamily = isHeadline 
    ? styleKit.typography.headline_font 
    : styleKit.typography.body_font;
  const fontWeight = isHeadline 
    ? styleKit.typography.headline_weight 
    : styleKit.typography.body_weight;

  // Calculate initial font size (will be auto-fit later)
  const fontSize = layer.constraints.max_font;

  // Calculate line height based on style kit
  const lineHeight = styleKit.spacingRules.line_height;

  // Determine text alignment
  const align = layer.align || 'left';

  return (
    <Text
      key={`text-${layer.id}-${index}`}
      x={layer.position.x}
      y={layer.position.y}
      width={layer.position.width}
      height={layer.position.height}
      text={text}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontStyle={fontWeight >= 600 ? 'bold' : 'normal'}
      fill={styleKit.colors.foreground}
      align={align}
      verticalAlign="top"
      lineHeight={lineHeight}
      wrap="word"
      onClick={() => {
        onTextBoxClick?.(layer.id, layer.position);
      }}
      onTap={() => {
        // Mobile tap support
        onTextBoxClick?.(layer.id, layer.position);
      }}
      // Make text boxes appear clickable
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'text';
        }
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'default';
        }
      }}
      // Add data attribute for testing (stored as name in Konva)
      name="text_box"
    />
  );
}
