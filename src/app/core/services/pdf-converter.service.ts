import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ConvertedImage {
  file: File;
  pageNumber: number;
  width: number;
  height: number;
}

export interface ConversionProgress {
  currentPage: number;
  totalPages: number;
  status: 'loading' | 'converting' | 'complete' | 'error';
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfConverterService {
  /**
   * Convert a PDF file to an array of image files (one per page)
   * @param pdfFile The PDF file to convert
   * @param options Conversion options
   * @param progressCallback Optional callback for progress updates
   * @returns Array of converted image files
   */
  async convertPdfToImages(
    pdfFile: File,
    options: {
      scale?: number;
      quality?: number;
      imageFormat?: 'image/jpeg' | 'image/png';
      maxPages?: number;
    } = {},
    progressCallback?: (progress: ConversionProgress) => void
  ): Promise<ConvertedImage[]> {
    // Default options
    const {
      scale = 2.0, // Higher scale = better quality but larger files
      quality = 0.85, // JPEG quality (0-1)
      imageFormat = 'image/jpeg',
      maxPages = 10 // Safety limit to prevent memory issues
    } = options;

    const convertedImages: ConvertedImage[] = [];

    try {
      // Report loading progress
      progressCallback?.({
        currentPage: 0,
        totalPages: 0,
        status: 'loading',
        message: 'Loading PDF...'
      });

      // Load the PDF file
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const totalPages = Math.min(pdf.numPages, maxPages);

      // Report conversion start
      progressCallback?.({
        currentPage: 0,
        totalPages,
        status: 'converting',
        message: `Converting ${totalPages} page${totalPages > 1 ? 's' : ''}...`
      });

      // Convert each page to an image
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas 2D context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert canvas to blob'));
              }
            },
            imageFormat,
            quality
          );
        });

        // Create a File object from the blob
        const fileName = this.generateImageFileName(pdfFile.name, pageNum, totalPages, imageFormat);
        const imageFile = new File([blob], fileName, { type: imageFormat });

        convertedImages.push({
          file: imageFile,
          pageNumber: pageNum,
          width: viewport.width,
          height: viewport.height
        });

        // Report progress
        progressCallback?.({
          currentPage: pageNum,
          totalPages,
          status: 'converting',
          message: `Converted page ${pageNum} of ${totalPages}`
        });
      }

      // Report completion
      progressCallback?.({
        currentPage: totalPages,
        totalPages,
        status: 'complete',
        message: `Converted ${totalPages} page${totalPages > 1 ? 's' : ''} successfully`
      });

      return convertedImages;

    } catch (error) {
      console.error('PDF conversion error:', error);

      // Report error
      progressCallback?.({
        currentPage: 0,
        totalPages: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to convert PDF'
      });

      throw error;
    }
  }

  /**
   * Generate a descriptive file name for the converted image
   */
  private generateImageFileName(
    originalPdfName: string,
    pageNumber: number,
    totalPages: number,
    imageFormat: string
  ): string {
    // Remove .pdf extension
    const baseName = originalPdfName.replace(/\.pdf$/i, '');

    // Add page number if multiple pages
    const pageInfo = totalPages > 1 ? `_page${pageNumber}` : '';

    // Determine file extension
    const extension = imageFormat === 'image/png' ? '.png' : '.jpg';

    return `${baseName}${pageInfo}${extension}`;
  }

  /**
   * Validate if a file is a PDF
   */
  isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Get estimated conversion time (rough estimate)
   * @param fileSizeBytes File size in bytes
   * @returns Estimated time in seconds
   */
  estimateConversionTime(fileSizeBytes: number): number {
    // Very rough estimate: ~1 second per MB
    const sizeInMB = fileSizeBytes / (1024 * 1024);
    return Math.max(1, Math.round(sizeInMB));
  }
}
