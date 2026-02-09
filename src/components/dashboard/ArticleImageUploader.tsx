import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Upload,
  Link,
  ImageIcon,
  Maximize2,
  Scissors,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface ArticleImageUploaderProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function ArticleImageUploader({ imageUrl, onImageChange }: ArticleImageUploaderProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>("");
  const [rawFile, setRawFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop dialog state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [quality, setQuality] = useState(0.85);
  const [outputSize, setOutputSize] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    setRawFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setScale(1);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setIsCropDialogOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 16 / 9));
  }, []);

  const updateOutputSize = useCallback(() => {
    if (completedCrop && imgRef.current) {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      setOutputSize({
        width: Math.round(completedCrop.width * scaleX),
        height: Math.round(completedCrop.height * scaleY),
      });
    }
  }, [completedCrop]);

  const handleCropComplete = (c: PixelCrop) => {
    setCompletedCrop(c);
    if (imgRef.current) {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      setOutputSize({
        width: Math.round(c.width * scaleX),
        height: Math.round(c.height * scaleY),
      });
    }
  };

  const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
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

    // Limit max dimension to 1600px for article images
    const maxDimension = 1600;
    let outWidth = cropWidth;
    let outHeight = cropHeight;

    if (outWidth > maxDimension || outHeight > maxDimension) {
      const ratio = Math.min(maxDimension / outWidth, maxDimension / outHeight);
      outWidth = Math.round(outWidth * ratio);
      outHeight = Math.round(outHeight * ratio);
    }

    canvas.width = outWidth;
    canvas.height = outHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, outWidth, outHeight);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    });
  }, [completedCrop, quality]);

  const uploadToStorage = async (blob: Blob, fileName: string): Promise<string | null> => {
    if (!user?.id) return null;

    const filePath = `${user.id}/${Date.now()}_${fileName}`;
    const { error } = await supabase.storage
      .from("ad-campaigns")
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("ad-campaigns")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleConfirmCrop = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedBlob();
      if (!croppedBlob) return;

      setIsUploading(true);
      const fileName = rawFile?.name?.replace(/\.[^/.]+$/, "") || "article-image";
      const publicUrl = await uploadToStorage(croppedBlob, `${fileName}.jpg`);

      if (publicUrl) {
        onImageChange(publicUrl);
        setIsCropDialogOpen(false);
      }
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const handleSkipCrop = async () => {
    if (!rawFile || !user?.id) return;
    setIsUploading(true);
    try {
      const publicUrl = await uploadToStorage(rawFile, rawFile.name);
      if (publicUrl) {
        onImageChange(publicUrl);
        setIsCropDialogOpen(false);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseCrop = () => {
    setIsCropDialogOpen(false);
    setRawImageSrc("");
    setRawFile(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
  };

  return (
    <div className="space-y-2">
      <Label>Obrazek główny *</Label>

      <div className="flex gap-2">
        <Input
          value={imageUrl}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="https://... lub wgraj plik poniżej"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        Wklej URL lub wgraj obraz z dysku (zostanie przycięty i zoptymalizowany)
      </p>

      {imageUrl && (
        <div className="mt-2 rounded-lg overflow-hidden border relative group">
          <img
            src={imageUrl}
            alt="Podgląd"
            className="w-full h-32 object-cover bg-muted"
          />
        </div>
      )}

      {/* Crop Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={(open) => !open && handleCloseCrop()}>
        <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Przytnij i zoptymalizuj obraz artykułu
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0 gap-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setScale((p) => Math.max(p - 0.1, 0.5))} disabled={scale <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
                <Button variant="ghost" size="sm" onClick={() => setScale((p) => Math.min(p + 0.1, 3))} disabled={scale >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setScale(1);
                  if (imgRef.current) {
                    const { width, height } = imgRef.current;
                    setCrop(centerAspectCrop(width, height, 16 / 9));
                  }
                }}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {outputSize && (
                <Badge variant="secondary" className="font-mono">
                  <Maximize2 className="h-3 w-3 mr-1" />
                  {outputSize.width} × {outputSize.height} px
                </Badge>
              )}
            </div>

            {/* Crop area */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[250px]">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={handleCropComplete}
                aspect={16 / 9}
                className="max-w-full max-h-full"
              >
                <img
                  ref={imgRef}
                  src={rawImageSrc}
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

            {/* Quality slider */}
            <div className="space-y-1 px-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Jakość kompresji</Label>
                <span className="text-xs text-muted-foreground">{Math.round(quality * 100)}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={([val]) => setQuality(val)}
                min={0.3}
                max={1}
                step={0.05}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mniejszy plik</span>
                <span>Lepsza jakość</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Zalecane proporcje: 16:9. Maks. wymiar: 1600px
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="ghost" onClick={handleSkipCrop} disabled={isProcessing || isUploading} className="sm:mr-auto">
              Pomiń przycinanie
            </Button>
            <Button variant="outline" onClick={handleCloseCrop} disabled={isProcessing}>
              Anuluj
            </Button>
            <Button onClick={handleConfirmCrop} disabled={isProcessing || !completedCrop}>
              {isProcessing || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? "Wysyłanie..." : "Przetwarzanie..."}
                </>
              ) : (
                "Zastosuj i wgraj"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
