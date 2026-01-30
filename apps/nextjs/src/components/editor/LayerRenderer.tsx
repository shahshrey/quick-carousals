'use client';

import { useEffect, useState } from 'react';
import { Rect, Text, Group } from 'react-konva';
import type { Layer, TextBoxLayer, SlideContent, StyleKit } from './types';
import { calculateOptimalFontSize, measureText } from '~/lib/text-measure';

interface LayerRendererProps {
  layers: Layer[];
  content: SlideContent;
  styleKit: StyleKit;
  onTextBoxClick?: (layerId: string, position: { x: number; y: number; width: number; height: number }) => void;
}

interface TextFitResult {
  fontSize: number;
  overflow: boolean;
}

interface TextBoxComponentProps {
  layer: TextBoxLayer;
  content: SlideContent;
  styleKit: StyleKit;
  index: number;
  onTextBoxClick?: (layerId: string, position: { x: number; y: number; width: number; height: number }) => void;
}

export function LayerRenderer({ layers, content, styleKit, onTextBoxClick }: LayerRendererProps) {
  return (
    <>
      {layers.map((layer, index) => {
        if (layer.type === 'background') {
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
        } else if (layer.type === 'text_box') {
          return (
            <TextBoxComponent
              key={`text-${layer.id}-${index}`}
              layer={layer}
              content={content}
              styleKit={styleKit}
              index={index}
              onTextBoxClick={onTextBoxClick}
            />
          );
        }
        return null;
      })}
    </>
  );
}

function TextBoxComponent({ layer, content, styleKit, index, onTextBoxClick }: TextBoxComponentProps) {
  const layerContent = content[layer.id];
  const [textFit, setTextFit] = useState<TextFitResult>({ fontSize: layer.constraints.max_font, overflow: false });
  
  // Handle both string and string[] content
  let text = '';
  let rawContent: string | string[] = '';
  if (Array.isArray(layerContent)) {
    rawContent = layerContent;
    if (layer.bulletStyle === 'numbered') {
      text = layerContent.map((line, i) => `${i + 1}. ${line}`).join('\n');
    } else if (layer.bulletStyle === 'disc') {
      text = layerContent.map(line => `• ${line}`).join('\n');
    } else {
      text = layerContent.join('\n');
    }
  } else if (typeof layerContent === 'string') {
    rawContent = layerContent;
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

  // Calculate line height based on style kit
  const lineHeight = styleKit.spacingRules.line_height;

  // Determine text alignment
  const align = layer.align || 'left';

  // Auto-fit text - calculate optimal font size
  useEffect(() => {
    if (!text || typeof window === 'undefined') return;

    try {
      const optimalFontSize = calculateOptimalFontSize(
        rawContent,
        {
          fontSize: layer.constraints.max_font,
          fontFamily,
          fontWeight,
          lineHeight,
          maxWidth: layer.position.width,
          maxHeight: layer.position.height,
        },
        layer.constraints.min_font,
        layer.constraints.max_font
      );

      // Check if text overflows even at minimum font size
      const measurement = measureText(rawContent, {
        fontSize: layer.constraints.min_font,
        fontFamily,
        fontWeight,
        lineHeight,
        maxWidth: layer.position.width,
      });

      const overflow = measurement.height > layer.position.height;

      setTextFit({ fontSize: optimalFontSize, overflow });
    } catch (error) {
      console.error('Auto-fit text calculation failed:', error);
      setTextFit({ fontSize: layer.constraints.max_font, overflow: false });
    }
  }, [text, rawContent, layer, fontFamily, fontWeight, lineHeight]);

  return (
    <Group>
      <Text
        x={layer.position.x}
        y={layer.position.y}
        width={layer.position.width}
        height={layer.position.height}
        text={text}
        fontSize={textFit.fontSize}
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
      
      {/* Overflow indicator */}
      {textFit.overflow && (
        <Rect
          x={layer.position.x}
          y={layer.position.y}
          width={layer.position.width}
          height={layer.position.height}
          stroke="#ef4444"
          strokeWidth={3}
          name="overflow_indicator"
          listening={false}
        />
      )}
    </Group>
  );
}
