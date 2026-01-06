import { useState } from 'react';
import apiClient from '@/api/client';
import { toast } from '@/shared/utils/toast';

export interface UploadedImage {
  original: string;
  resolutions: {
    '1080p': string;
    '720p': string;
    '480p': string;
  };
  publicId: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface UseImageUploadReturn {
  uploadProgress: UploadProgress[];
  isUploading: boolean;
  uploadImages: (files: File[]) => Promise<UploadedImage[]>;
  deleteImages: (publicIds: string[]) => Promise<void>;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImages = async (files: File[]): Promise<UploadedImage[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    
    // Initialize progress for all files
    const initialProgress: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));
    setUploadProgress(initialProgress);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          images: UploadedImage[];
        };
      }>('/v1/upload/product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
            // Update progress for all files (simplified - could be per-file if backend supports it)
            setUploadProgress(prev => 
              prev.map(item => ({
                ...item,
                progress: percentCompleted,
              }))
            );
          }
        },
      });

      if (response.data.success) {
        const newImages = response.data.data.images;
        
        // Mark all as successful
        setUploadProgress(prev => 
          prev.map(item => ({
            ...item,
            progress: 100,
            status: 'success',
          }))
        );

        toast.success(`Successfully uploaded ${newImages.length} image(s)`);
        
        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress([]);
        }, 2000);
        
        return newImages;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload images';
      
      // Mark all as error
      setUploadProgress(prev => 
        prev.map(item => ({
          ...item,
          status: 'error',
          error: errorMessage,
        }))
      );

      toast.error(errorMessage);
      
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadProgress,
    isUploading,
    uploadImages,
  };
};
