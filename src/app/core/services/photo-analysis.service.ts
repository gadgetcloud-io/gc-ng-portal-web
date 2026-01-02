import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PhotoAnalysisResponse {
  extractedData: {
    brand?: string;
    model?: string;
    serialNumber?: string;
    confidence: {
      brand: number;
      model: number;
      serialNumber: number;
    };
    rawText: string;
    suggestedCategory?: string;
  };
  photoAnalysisId: string;
  status: 'success' | 'partial' | 'failed';
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PhotoAnalysisService {
  private readonly API_URL = `${environment.apiUrl}/api/items`;

  constructor(private http: HttpClient) {}

  /**
   * Analyzes a photo to extract device information using AI
   * @param file The image file to analyze
   * @param categoryHint Optional category hint to improve accuracy
   * @returns Observable with extracted device information
   */
  analyzePhoto(file: File, categoryHint?: string): Observable<PhotoAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (categoryHint) {
      formData.append('category', categoryHint);
    }

    return this.http.post<PhotoAnalysisResponse>(
      `${this.API_URL}/analyze-photo`,
      formData
    );
  }
}
