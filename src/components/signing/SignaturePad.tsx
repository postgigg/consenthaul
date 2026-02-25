'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, PenTool, Type } from 'lucide-react';

interface SignaturePadProps {
  /** Called with the base64 PNG data URL after the user finishes a stroke or types. */
  onSignature: (dataUrl: string) => void;
  /** Called when the signature mode changes. */
  onTypeChange?: (type: 'drawn' | 'typed') => void;
  /** Width of the canvas. Defaults to 100% of the container. */
  width?: number;
  /** Height of the canvas in CSS pixels. Defaults to 200. */
  height?: number;
  /** Label for the clear button. */
  clearLabel?: string;
  /** Display language. */
  language?: 'en' | 'es';
}

const labels = {
  en: {
    drawMode: 'Draw your signature',
    typeMode: 'Type your name instead',
    drawInstead: 'Draw your signature instead',
    typePlaceholder: 'Type your full legal name',
    fingerOrMouse: 'Use your finger or mouse to sign',
    typeHint: 'Type your full legal name above',
    signAbove: 'Sign above',
  },
  es: {
    drawMode: 'Dibuje su firma',
    typeMode: 'Escriba su nombre en su lugar',
    drawInstead: 'Dibuje su firma en su lugar',
    typePlaceholder: 'Escriba su nombre legal completo',
    fingerOrMouse: 'Use su dedo o mouse para firmar',
    typeHint: 'Escriba su nombre legal completo arriba',
    signAbove: 'Firme arriba',
  },
};

// Script-like font for typed signatures — rendered on a canvas
const SCRIPT_FONT = '"Brush Script MT", "Segoe Script", "Apple Chancery", cursive';

export function SignaturePad({
  onSignature,
  onTypeChange,
  width,
  height = 200,
  clearLabel = 'Clear',
  language = 'en',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [mode, setMode] = useState<'drawn' | 'typed'>('drawn');
  const [typedName, setTypedName] = useState('');

  const t = labels[language];

  // Set up high-DPI canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = width ?? rect.width;

    canvas.width = w * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1a1a2e';

    // Draw the signature line
    drawSignatureLine(ctx, w, height, t.signAbove);
  }, [width, height, t.signAbove]);

  useEffect(() => {
    setupCanvas();

    // Resize on window resize
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  function drawSignatureLine(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    label: string,
  ) {
    const lineY = h - 35;
    ctx.save();
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, lineY);
    ctx.lineTo(w - 20, lineY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, lineY + 18);
    ctx.restore();
  }

  function getCoordinates(
    e: React.MouseEvent | React.TouchEvent,
  ): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1a1a2e';

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasSignature(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();

    // Emit the signature data
    const dataUrl = canvas.toDataURL('image/png');
    onSignature(dataUrl);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const rect = container.getBoundingClientRect();
    const w = width ?? rect.width;
    drawSignatureLine(ctx, w, height, t.signAbove);

    setHasSignature(false);
    onSignature('');
  }

  // Generate typed signature image on a hidden canvas
  const generateTypedSignature = useCallback(
    (name: string) => {
      if (!name.trim()) {
        onSignature('');
        setHasSignature(false);
        return;
      }

      const canvas = typedCanvasRef.current;
      if (!canvas) return;

      const dpr = 2; // Fixed high-DPI for consistent output
      const w = 400;
      const h = 120;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Draw typed name in script font
      ctx.fillStyle = '#1a1a2e';
      ctx.font = `italic 36px ${SCRIPT_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Scale font down if text is too wide
      let fontSize = 36;
      while (ctx.measureText(name).width > w - 40 && fontSize > 16) {
        fontSize -= 2;
        ctx.font = `italic ${fontSize}px ${SCRIPT_FONT}`;
      }

      ctx.fillText(name, w / 2, h / 2);

      const dataUrl = canvas.toDataURL('image/png');
      onSignature(dataUrl);
      setHasSignature(true);
    },
    [onSignature],
  );

  // Handle mode toggle
  const toggleMode = () => {
    const newMode = mode === 'drawn' ? 'typed' : 'drawn';
    setMode(newMode);
    onTypeChange?.(newMode);

    // Clear current signature
    setHasSignature(false);
    onSignature('');
    setTypedName('');

    if (newMode === 'drawn') {
      // Re-setup canvas after mode switch
      setTimeout(() => setupCanvas(), 0);
    }
  };

  // Handle typed name input
  const handleTypedNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setTypedName(name);
    generateTypedSignature(name);
  };

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex items-center justify-end px-1 pt-1">
        <button
          type="button"
          onClick={toggleMode}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C8A75E] hover:text-[#b08f3e] transition-colors"
        >
          {mode === 'drawn' ? (
            <>
              <Type className="h-3.5 w-3.5" />
              {t.typeMode}
            </>
          ) : (
            <>
              <PenTool className="h-3.5 w-3.5" />
              {t.drawInstead}
            </>
          )}
        </button>
      </div>

      {mode === 'drawn' ? (
        <>
          {/* Drawing canvas */}
          <div
            ref={containerRef}
            className="relative rounded-lg border border-gray-300 bg-white overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              className="touch-none cursor-crosshair w-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              role="img"
              aria-label="Signature canvas. Draw your signature here."
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{t.fingerOrMouse}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCanvas}
              disabled={!hasSignature}
            >
              <Eraser className="h-4 w-4" />
              {clearLabel}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Typed name input */}
          <div className="rounded-lg border border-gray-300 bg-white overflow-hidden p-4">
            <input
              type="text"
              value={typedName}
              onChange={handleTypedNameChange}
              placeholder={t.typePlaceholder}
              maxLength={100}
              className="w-full text-center text-2xl border-0 outline-none bg-transparent placeholder:text-gray-300"
              style={{ fontFamily: SCRIPT_FONT, fontStyle: 'italic' }}
              autoComplete="name"
            />
            {/* Signature line */}
            <div className="mt-4 mx-4 border-t border-dashed border-gray-300" />
            {/* Preview of what the signature looks like */}
            {typedName && (
              <p className="mt-2 text-center text-xs text-gray-400">
                {t.typeHint}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{t.typeHint}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypedName('');
                onSignature('');
                setHasSignature(false);
              }}
              disabled={!typedName}
            >
              <Eraser className="h-4 w-4" />
              {clearLabel}
            </Button>
          </div>
        </>
      )}

      {/* Hidden canvas for generating typed signature images */}
      <canvas
        ref={typedCanvasRef}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}
