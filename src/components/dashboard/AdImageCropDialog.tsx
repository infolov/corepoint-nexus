import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, ZoomIn, ZoomOut, Maximize2, Image as ImageIcon } from "lucide-react";

interface AdImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  originalFile: File;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  recommendedDimensions?: { width: number; height: number };
}

type AspectRatioOption = {
  label: string;
  value: number | undefined;
  icon: string;
};

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "Dowolny", value: undefined, icon: "⬜" },
  { label: "16:9", value: 16 / 9, icon: "📺" },
  { label: "4:3", value: 4 / 3, icon: "🖥️" },
  { label: "1:1", value: 1, icon: "⬛" },
  { label: "9:16", value: 9 / 16, icon: "📱" },
];

const QUALITY_OPTIONS = [
  { label: "Niska", value: 0.6, description: "Mniejszy plik" },
  { label: "Średnia", value: 0.8, description: "Zbalansowana" },
  { label: "Wysoka", value: 0.92, description: "Najlepsza jakość" },
];

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect?: number) {
  if (!aspect) {
    return centerCrop(
      { unit: "%", width: 90, height: 90, x: 5, y: 5 },
      mediaWidth,
      mediaHeight
    );
  }
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function AdImageCropDialog({
  isOpen,
  onClose,
  imageSrc,
  originalFile,
  onCropComplete,
  recommendedDimensions,
}: AdImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState(1);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(undefined);
  const [quality, setQuality] = useState(0.8);
  const [outputSize, setOutputSize] = useState<{ width: number; height: number } | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);

  // Calculate output dimensions based on crop
  useEffect(() => {
    if (completedCrop && imgRef.current) {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      const width = Math.round(completedCrop.width * scaleX);
      const height = Math.round(completedCrop.height * scaleY);
      
      setOutputSize({ width, height });
      
      // Estimate file size (rough approximation)
      const pixels = width * height;
      const bytesPerPixel = quality * 0.5; // JPEG compression ratio
      const estimatedBytes = pixels * bytesPerPixel;
      
      if (estimatedBytes < 1024) {
        setEstimatedSize(`~${Math.round(estimatedBytes)} B`);
      } else if (estimatedBytes < 1024 * 1024) {
        setEstimatedSize(`~${Math.round(estimatedBytes / 1024)} KB`);
      } else {
        setEstimatedSize(`~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`);
      }
    }
  }, [completedCrop, quality]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerAspectCrop(width, height, selectedAspect);
    setCrop(crop);
  }, [selectedAspect]);

  const handleAspectChange = (aspect: number | undefined) => {
    setSelectedAspect(aspect);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, selectedAspect));
    }
  };

  const getCroppedImage = useCallback(async (): Promise<{ blob: Blob; previewUrl: string } | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Use actual crop dimensions (with optional max size limit)
    const maxDimension = 2000;
    let outputWidth = cropWidth;
    let outputHeight = cropHeight;
    
    if (outputWidth > maxDimension || outputHeight > maxDimension) {
      const ratio = Math.min(maxDimension / outputWidth, maxDimension / outputHeight);
      outputWidth = Math.round(outputWidth * ratio);
      outputHeight = Math.round(outputHeight * ratio);
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const previewUrl = canvas.toDataURL("image/jpeg", quality);
            resolve({ blob, previewUrl });
          } else {
            resolve(null);
          }
        },
        "image/jpeg",
        quality
      );
    });
  }, [completedCrop, quality]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const result = await getCroppedImage();
      if (result) {
        // Create a new File object from the blob
        const fileName = originalFile.name.replace(/\.[^/.]+$/, "") + "_cropped.jpg";
        const croppedFile = new File([result.blob], fileName, { type: "image/jpeg" });
        onCropComplete(croppedFile, result.previewUrl);
        handleClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    // Use original file without cropping
    const reader = new FileReader();
    reader.onload = (e) => {
      onCropComplete(originalFile, e.target?.result as string);
      handleClose();
    };
    reader.readAsDataURL(originalFile);
  };

  const handleClose = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    setSelectedAspect(undefined);
    setQuality(0.8);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Przytnij i zoptymalizuj obraz
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0 gap-4">
          {/* Aspect Ratio Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm text-muted-foreground mr-2">Proporcje:</Label>
            {ASPECT_RATIOS.map((ratio) => (
              <Button
                key={ratio.label}
                variant={selectedAspect === ratio.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleAspectChange(ratio.value)}
                className="h-8"
              >
                <span className="mr-1">{ratio.icon}</span>
                {ratio.label}
              </Button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            {outputSize && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  <Maximize2 className="h-3 w-3 mr-1" />
                  {outputSize.width} × {outputSize.height} px
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {estimatedSize}
                </Badge>
              </div>
            )}
          </div>

          {/* Crop area */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[250px]">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={selectedAspect}
              className="max-w-full max-h-full"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{
                  transform: `scale(${scale})`,
                  maxHeight: "350px",
                  maxWidth: "100%",
                }}
                className="transition-transform"
              />
            </ReactCrop>
          </div>

          {/* Quality Slider */}
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Jakość kompresji</Label>
              <span className="text-xs text-muted-foreground">
                {QUALITY_OPTIONS.find((q) => q.value === quality)?.label || "Niestandardowa"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[quality]}
                onValueChange={([val]) => setQuality(val)}
                min={0.3}
                max={1}
                step={0.05}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-right">{Math.round(quality * 100)}%</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mniejszy plik</span>
              <span>Lepsza jakość</span>
            </div>
          </div>

          {recommendedDimensions && (
            <p className="text-xs text-muted-foreground text-center">
              Zalecane wymiary dla tego miejsca: {recommendedDimensions.width} × {recommendedDimensions.height} px
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button variant="ghost" onClick={handleSkip} disabled={isProcessing} className="sm:mr-auto">
            Pomiń przycinanie
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Anuluj
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing || !completedCrop}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Przetwarzanie...
              </>
            ) : (
              "Zastosuj"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
