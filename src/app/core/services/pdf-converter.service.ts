import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use local bundled worker to avoid CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.min.mjs';

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
      console.log('[PDF Converter] Starting conversion for:', pdfFile.name, `(${pdfFile.size} bytes)`);

      // Report loading progress
      progressCallback?.({
        currentPage: 0,
        totalPages: 0,
        status: 'loading',
        message: 'Loading PDF...'
      });

      // Load the PDF file with timeout
      console.log('[PDF Converter] Reading file as ArrayBuffer...');
      const arrayBuffer = await pdfFile.arrayBuffer();
      console.log('[PDF Converter] ArrayBuffer loaded:', arrayBuffer.byteLength, 'bytes');

      console.log('[PDF Converter] Creating PDF.js loading task...');
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

      console.log('[PDF Converter] Waiting for PDF to load...');
      const pdf = await this.withTimeout(
        loadingTask.promise,
        30000, // 30 second timeout
        'PDF loading timed out after 30 seconds'
      );

      console.log('[PDF Converter] PDF loaded successfully, pages:', pdf.numPages);

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
        console.log(`[PDF Converter] Processing page ${pageNum}/${totalPages}...`);

        const page = await this.withTimeout(
          pdf.getPage(pageNum),
          15000,
          `Failed to get page ${pageNum}`
        );
        console.log(`[PDF Converter] Page ${pageNum} loaded`);

        const viewport = page.getViewport({ scale });
        console.log(`[PDF Converter] Viewport size: ${viewport.width}x${viewport.height}`);

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas 2D context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page to canvas
        console.log(`[PDF Converter] Rendering page ${pageNum} to canvas...`);
        await this.withTimeout(
          page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          }).promise,
          15000,
          `Page ${pageNum} rendering timed out`
        );
        console.log(`[PDF Converter] Page ${pageNum} rendered successfully`);

        // Convert canvas to blob with timeout
        console.log(`[PDF Converter] Converting canvas to blob (${imageFormat}, quality: ${quality})...`);
        const blob = await this.withTimeout(
          new Promise<Blob>((resolve, reject) => {
            try {
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    console.log(`[PDF Converter] Blob created successfully: ${blob.size} bytes`);
                    resolve(blob);
                  } else {
                    reject(new Error('Canvas toBlob returned null'));
                  }
                },
                imageFormat,
                quality
              );
            } catch (error) {
              console.error('[PDF Converter] Error in toBlob:', error);
              reject(error);
            }
          }),
          10000,
          `Canvas to blob conversion timed out for page ${pageNum}`
        );

        // Create a File object from the blob
        console.log(`[PDF Converter] Creating File object from blob...`);
        const fileName = this.generateImageFileName(pdfFile.name, pageNum, totalPages, imageFormat);
        const imageFile = new File([blob], fileName, { type: imageFormat });
        console.log(`[PDF Converter] File created: ${fileName} (${imageFile.size} bytes)`);

        console.log(`[PDF Converter] Adding image to array...`);
        convertedImages.push({
          file: imageFile,
          pageNumber: pageNum,
          width: viewport.width,
          height: viewport.height
        });
        console.log(`[PDF Converter] Image added, array length: ${convertedImages.length}`);

        // Report progress
        console.log(`[PDF Converter] Reporting progress for page ${pageNum}...`);
        progressCallback?.({
          currentPage: pageNum,
          totalPages,
          status: 'converting',
          message: `Converted page ${pageNum} of ${totalPages}`
        });
        console.log(`[PDF Converter] Progress reported`);
      }

      // Report completion
      console.log(`[PDF Converter] Conversion complete, reporting final status...`);
      progressCallback?.({
        currentPage: totalPages,
        totalPages,
        status: 'complete',
        message: `Converted ${totalPages} page${totalPages > 1 ? 's' : ''} successfully`
      });
      console.log(`[PDF Converter] Returning ${convertedImages.length} converted images`);

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

  /**
   * Wrap a promise with a timeout
   * @param promise The promise to wrap
   * @param timeoutMs Timeout in milliseconds
   * @param errorMessage Error message if timeout occurs
   * @returns Promise that rejects if timeout is reached
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      )
    ]);
  }
}
