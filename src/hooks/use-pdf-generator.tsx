import { useState } from 'react';
import { api } from '@/trpc/react';



interface PdfGenerationOptions {
  format: 'standard' | 'detailed' | 'college-prep';
  includeWatermark?: boolean;
  includeAchievements?: boolean;
  includeActivities?: boolean;
}

export function usePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use tRPC mutation for server-side PDF generation
  const generatePdfMutation = api.transcript.generateTranscriptPdf.useMutation({
    onSuccess: () => {
      setIsGenerating(false);
      setError(null);
    },
    onError: (error) => {
      setIsGenerating(false);
      setError(error.message);
    },
  });

  const generatePdf = async (
    studentId: string,
    options: PdfGenerationOptions = { format: 'standard' }
  ): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Call server-side PDF generation
      const result = await generatePdfMutation.mutateAsync({
        studentId,
        format: options.format,
        includeWatermark: options.includeWatermark ?? false,
        includeAchievements: options.includeAchievements ?? true,
        includeActivities: options.includeActivities ?? true,
      });

      // Convert base64 to blob
      const binaryString = window.atob(result.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(`PDF generation failed: ${errorMessage}`);
    }
  };

  return {
    generatePdf,
    isGenerating: isGenerating || generatePdfMutation.isPending,
    error,
  };
} 