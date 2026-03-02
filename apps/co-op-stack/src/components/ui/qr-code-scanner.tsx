import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import { Button } from './button';
import { Camera, X, QrCode, Loader2 } from 'lucide-react';
import { playBeep } from '@/utils/sound';

interface QrCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

/** Trigger haptic feedback on supported devices */
function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 30, 50]); // Short double-pulse pattern
  }
}

export function QrCodeScanner({ onScan, onClose }: QrCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;

      if (!videoRef.current) return;

      setIsScanning(true);

      // Start continuous scanning
      await reader.decodeFromVideoDevice(
        null, // Use default camera (back camera on mobile)
        videoRef.current,
        (result, err) => {
          if (result) {
            const scannedText = result.getText();
            // Feedback on successful scan
            triggerHaptic();
            playBeep(1200, 100, 0.08); // Higher pitch, short confirmation beep
            stopScanning();
            onScan(scannedText);
          }
          // Ignore errors during scanning - they occur on each failed frame
          if (err && err.name !== 'NotFoundException') {
            console.debug('QR scan attempt:', err.message);
          }
        }
      );
    } catch (err) {
      console.error('Failed to start QR scanner:', err);
      setError('Camera access denied or not available. Please enter the meeting code manually.');
      setIsScanning(false);
    }
  }, [onScan, stopScanning]);

  useEffect(() => {
    void startScanning();
    return () => {
      stopScanning();
    };
  }, [startScanning, stopScanning]);

  const handleManualEntry = () => {
    stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card/80 backdrop-blur border-b border-border text-foreground">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          <span className="font-medium">Scan QR Code</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualEntry}
          className="hover:bg-muted"
          aria-label="Close scanner"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-foreground">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
        />

        {/* Scanning overlay with viewfinder */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Darkened corners with transparent center */}
            <div className="relative w-64 h-64">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
              
              {/* Scanning indicator */}
              <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-2 text-background">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Scanning...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/90">
            <div className="text-center text-background p-6 max-w-sm">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Camera Not Available</p>
              <p className="text-sm opacity-80 mb-4">{error}</p>
              <Button onClick={handleManualEntry} className="w-full">
                Enter Code Manually
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer with manual entry option */}
      <div className="p-4 bg-card/80 backdrop-blur border-t border-border">
        <Button
          variant="outline"
          onClick={handleManualEntry}
          className="w-full"
        >
          Enter Code Manually
        </Button>
      </div>
    </div>
  );
}
