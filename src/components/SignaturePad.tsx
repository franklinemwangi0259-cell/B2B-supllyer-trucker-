import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Type,
  Upload,
  RotateCcw,
  Check,
  Sparkles,
  Eraser,
  Image as ImageIcon,
} from 'lucide-react';

interface SignaturePadProps {
  initialSignature?: string;
  onSaveSignature: (dataUrl: string) => void;
  signerName?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  initialSignature,
  onSaveSignature,
  signerName = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!initialSignature);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState(signerName || 'Authorized Signatory');
  const [fontFamily, setFontFamily] = useState<string>('font-signature-1');
  const [penColor, setPenColor] = useState<string>('#1e1b4b'); // Deep indigo ink

  // Canvas Drawing setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = penColor;

    // If initial signature image exists, draw it
    if (initialSignature && signatureMode === 'draw') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = initialSignature;
    }
  }, [signatureMode]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    exportCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSaveSignature('');
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
  };

  // Type mode generation
  const renderTypedSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'italic 36px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Authorized Signatory', 200, 75);

    // Decorative flourish line
    ctx.beginPath();
    ctx.moveTo(60, 110);
    ctx.bezierCurveTo(150, 125, 250, 100, 340, 115);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    setHasDrawn(true);
  };

  useEffect(() => {
    if (signatureMode === 'type') {
      renderTypedSignature();
    }
  }, [typedName, penColor, signatureMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSaveSignature(dataUrl);
      setHasDrawn(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {/* Mode Selectors */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setSignatureMode('draw')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              signatureMode === 'draw'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" /> Draw
          </button>
          <button
            type="button"
            onClick={() => {
              setSignatureMode('type');
              renderTypedSignature();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              signatureMode === 'type'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Type
          </button>
          <button
            type="button"
            onClick={() => setSignatureMode('upload')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              signatureMode === 'upload'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Image
          </button>
        </div>

        {/* Ink Color Selector */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Ink:</span>
          {[
            { color: '#1e1b4b', label: 'Dark Navy' },
            { color: '#0f172a', label: 'Black' },
            { color: '#1e40af', label: 'Blue' },
          ].map((c) => (
            <button
              key={c.color}
              type="button"
              onClick={() => setPenColor(c.color)}
              className={`w-5 h-5 rounded-full border transition-all ${
                penColor === c.color ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.color }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* DRAW MODE */}
      {signatureMode === 'draw' && (
        <div className="relative rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden group">
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            className="w-full h-36 touch-none cursor-crosshair block"
          />

          {!hasDrawn && !isDrawing && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
              <PenTool className="w-6 h-6 mb-1 text-slate-300 stroke-[1.5]" />
              <span>Sign with finger, stylus, or mouse here</span>
            </div>
          )}

          {/* Baseline rule */}
          <div className="absolute left-6 right-6 bottom-7 border-b border-slate-300/60 dark:border-slate-700/60 pointer-events-none flex justify-end">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Sign Here</span>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white/90 dark:bg-slate-800/90 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eraser className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>
      )}

      {/* TYPE MODE */}
      {signatureMode === 'type' && (
        <div className="space-y-3">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Enter authorized signatory name..."
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center min-h-[120px] relative">
            <div
              className="text-3xl tracking-wide select-none transition-all"
              style={{
                fontFamily: '"Brush Script MT", "Caveat", "Segoe Script", cursive',
                color: penColor,
                fontStyle: 'italic',
              }}
            >
              {typedName || 'Your Signature'}
            </div>
            <div className="w-48 h-0.5 bg-slate-300 dark:bg-slate-700 mt-2 relative">
              <span className="absolute -right-2 -bottom-2 text-[9px] text-slate-400 font-mono">Authorized</span>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODE */}
      {signatureMode === 'upload' && (
        <div className="p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
              <span>Upload signature image or company seal</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG with transparent background recommended</p>
          </div>
        </div>
      )}
    </div>
  );
};
