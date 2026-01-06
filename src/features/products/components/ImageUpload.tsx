import { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { UploadedImage, UploadProgress } from '@/shared/hooks/useImageUpload';
import { cn } from '@/shared/utils/cn';

interface ImageUploadProps {
  uploadedImages: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onImageRemove?: (index: number) => void | Promise<void>;
  primaryImageIndex?: number;
  onPrimaryImageChange?: (index: number) => void;
  maxImages?: number;
  uploadImages: (files: File[]) => Promise<UploadedImage[]>;
  uploadProgress?: UploadProgress[];
  isUploading?: boolean;
}

export function ImageUpload({
  uploadedImages,
  onImagesChange,
  onImageRemove,
  primaryImageIndex,
  onPrimaryImageChange,
  maxImages = 10,
  uploadImages: uploadImagesFn,
  uploadProgress = [],
  isUploading = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      return;
    }

    // Check total images limit
    const remaining = maxImages - uploadedImages.length;
    if (remaining <= 0) {
      return;
    }

    const filesToUpload = imageFiles.slice(0, remaining);
    try {
      const newImages = await uploadImagesFn(filesToUpload);
      onImagesChange([...uploadedImages, ...newImages]);
    } catch (error) {
      // Error handling is done in the upload function
      console.error('Upload error:', error);
    }
  }, [uploadedImages, maxImages, uploadImagesFn, onImagesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleRemoveImage = useCallback(async (index: number) => {
    // Call custom remove handler if provided (for Cloudinary cleanup)
    if (onImageRemove) {
      await onImageRemove(index);
    } else {
      // Default behavior: just remove from state
      const newImages = uploadedImages.filter((_, i) => i !== index);
      onImagesChange(newImages);
      
      // Reset primary image if it was removed
      if (primaryImageIndex === index && onPrimaryImageChange) {
        onPrimaryImageChange(0);
      } else if (primaryImageIndex !== undefined && primaryImageIndex > index && onPrimaryImageChange) {
        onPrimaryImageChange(primaryImageIndex - 1);
      }
    }
  }, [uploadedImages, onImagesChange, onImageRemove, primaryImageIndex, onPrimaryImageChange]);

  const handleSetPrimary = useCallback((index: number) => {
    if (onPrimaryImageChange) {
      onPrimaryImageChange(index);
    }
  }, [onPrimaryImageChange]);

  // Sync uploaded images from hook (this is a workaround - ideally the hook should expose a callback)
  // For now, we'll use the onImagesChange prop to update parent state
  // The parent should sync with the hook's uploadedImages

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          isUploading && "opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-muted p-4">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isDragging ? 'Drop images here' : 'Drag and drop images here'}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse (max {maxImages} images)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || uploadedImages.length >= maxImages}
            >
              Select Images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((progress, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate flex-1 mr-2">
                  {progress.file.name}
                </span>
                <div className="flex items-center gap-2">
                  {progress.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {progress.status === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {progress.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    progress.status === 'success' && "bg-green-500",
                    progress.status === 'error' && "bg-destructive",
                    progress.status === 'uploading' && "bg-primary"
                  )}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.error && (
                <p className="text-xs text-destructive">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Gallery */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Images ({uploadedImages.length}/{maxImages})</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {uploadedImages.map((image, index) => (
              <div
                key={index}
                className={cn(
                  "relative group border-2 rounded-lg overflow-hidden",
                  primaryImageIndex === index ? "border-primary" : "border-border"
                )}
              >
                <div className="aspect-square bg-muted relative">
                  <img
                    src={image.resolutions['480p'] || image.original}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = image.original;
                    }}
                  />
                  {primaryImageIndex === index && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetPrimary(index)}
                      className="h-8"
                    >
                      Set Primary
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveImage(index)}
                      className="h-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedImages.length === 0 && !isUploading && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}

