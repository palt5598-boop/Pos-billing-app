import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Flashlight, RefreshCw, X, AlertCircle, Barcode, CheckCircle2, Plus } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedBarcode: string) => void;
  title?: string;
  subtitle?: string;
  existingProducts?: Product[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Barcode',
  subtitle = 'Point camera at product barcode',
  existingProducts = [],
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'cicada-qr-reader-container';

  // Audio beep feedback using Web Audio API
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio not permitted or supported
    }
  };

  const handleDetectedBarcode = (decodedText: string) => {
    const trimmed = decodedText.trim();
    if (!trimmed) return;
    playBeep();
    setLastScannedCode(trimmed);
    onScanSuccess(trimmed);
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setLastScannedCode(null);
      setCameraError(null);
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      setCameraError(null);
      try {
        // Formats: EAN-13, EAN-8, UPC-A, UPC-E, CODE-128, CODE-39, QR
        const formats = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: formats,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.333,
        };

        await html5QrCode.start(
          { facingMode },
          config,
          (decodedText) => {
            if (isMounted) {
              handleDetectedBarcode(decodedText);
            }
          },
          () => {
            // ongoing scan frames
          }
        );

        if (isMounted) {
          setIsScanning(true);
          // Check torch capability
          try {
            const track = (html5QrCode as any).getRunningTrackCapabilities?.();
            if (track?.torch) {
              setHasTorch(true);
            }
          } catch {
            setHasTorch(false);
          }
        }
      } catch (err: any) {
        console.warn('Camera start error:', err);
        if (isMounted) {
          setCameraError(
            err?.message || 'Camera permission denied or camera not accessible in this environment.'
          );
          setIsScanning(false);
        }
      }
    };

    const timer = setTimeout(() => {
      startCamera();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error clearing scanner', e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch {
      // ignore
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetectedBarcode(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
    >
      <div
        id="barcode-scanner-modal-container"
        className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {title}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
            </div>
          </div>
          <button
            id="btn-close-scanner-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px] overflow-hidden">
          <div id={readerElementId} className="w-full h-full max-w-sm" />

          {/* Laser overlay animation when active */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                {/* Laser scan bar */}
                <div className="absolute w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                <div className="absolute top-1 left-2 text-[10px] uppercase font-mono tracking-wider text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded">
                  Align Barcode
                </div>
              </div>
            </div>
          )}

          {/* Camera Error / Fallback info */}
          {cameraError && (
            <div className="p-6 text-center max-w-sm text-zinc-200">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto mb-3 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">Camera Stream Inactive</p>
              <p className="text-xs text-zinc-400 mb-4">{cameraError}</p>
              <p className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-lg p-2.5">
                Use the manual code entry or quick barcode simulator buttons below to test scanning!
              </p>
            </div>
          )}

          {/* Camera Controls Bar */}
          {isScanning && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={`p-2 rounded-full text-xs font-semibold backdrop-blur-md transition-colors ${
                    torchOn ? 'bg-amber-500 text-black' : 'bg-black/50 text-white'
                  }`}
                  title="Toggle Torch"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={toggleCameraFacing}
                className="p-2 rounded-full text-xs font-semibold bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Last scanned banner */}
          {lastScannedCode && (
            <div className="absolute bottom-3 left-3 right-3 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between shadow-lg z-20 animate-fade-in">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                Scanned: <strong className="font-mono">{lastScannedCode}</strong>
              </span>
              <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Captured
              </span>
            </div>
          )}
        </div>

        {/* Manual Barcode Entry Form */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="input-scanner-manual-code"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Or type barcode numbers (e.g. 8901719101014)..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <button
              id="btn-scanner-submit-code"
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1 shrink-0"
            >
              Submit
            </button>
          </form>

          {/* Quick simulator buttons */}
          {existingProducts.filter((p) => p.barcode).length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                Quick Barcode Simulator (Click to test):
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {existingProducts
                  .filter((p) => p.barcode)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleDetectedBarcode(p.barcode!)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      <Barcode className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="truncate max-w-[140px]">{p.name}</span>
                      <span className="font-mono text-[10px] text-zinc-400">({p.barcode?.slice(-5)})</span>
                    </button>
                  ))}
                {/* Unknown barcode test button */}
                <button
                  type="button"
                  onClick={() => handleDetectedBarcode(`890999${Math.floor(100000 + Math.random() * 900000)}`)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Test Unknown Barcode
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
