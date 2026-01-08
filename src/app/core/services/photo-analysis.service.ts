import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Confidence scores for extracted fields (0.0 - 1.0)
 */
export interface VisionConfidence {
  brand?: number;
  model?: number;
  serialNumber?: number;
}

/**
 * AI-extracted gadget information from photo
 */
export interface ExtractedGadgetInfo {
  brand?: string;
  model?: string;
  serialNumber?: string;
  confidence: VisionConfidence;
  rawText: string;
  suggestedCategory?: string;
}

/**
 * Response from photo analysis endpoint
 */
export interface PhotoAnalysisResponse {
  extractedData: ExtractedGadgetInfo;
  photoAnalysisId: string;
  status: 'success' | 'partial' | 'failed';
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PhotoAnalysisService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Analyze a device photo using AI to extract brand, model, and serial number
   *
   * @param file - Image file (JPEG or PNG, max 10MB)
   * @param category - Optional category hint to improve extraction accuracy
   * @returns Observable<PhotoAnalysisResponse>
   */
  analyzePhoto(file: File, category?: string): Observable<PhotoAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (category) {
      formData.append('category', category);
    }

    // Note: Don't set Content-Type header - browser will set it automatically with boundary for multipart/form-data
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.post<PhotoAnalysisResponse>(
      `${this.baseUrl}/items/analyze-photo`,
      formData,
      { headers }
    );
  }

  /**
   * Get stored auth token
   */
  private getToken(): string | null {
    return localStorage.getItem('gc_token') || localStorage.getItem('auth_token');
  }
}
