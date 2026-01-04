import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { PhotoAnalysisService, PhotoAnalysisResponse } from './photo-analysis.service';
import { environment } from '../../../environments/environment';

describe('PhotoAnalysisService', () => {
  let service: PhotoAnalysisService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PhotoAnalysisService]
    });
    service = TestBed.inject(PhotoAnalysisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should analyze photo successfully with category hint', async () => {
    const mockFile = new File(['mock image content'], 'device.jpg', { type: 'image/jpeg' });
    const mockResponse: PhotoAnalysisResponse = {
      extractedData: {
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        serialNumber: 'F17XH4K2Q1GH',
        confidence: {
          brand: 0.92,
          model: 0.87,
          serialNumber: 0.95
        },
        rawText: 'Apple iPhone 15 Pro\nSerial: F17XH4K2Q1GH',
        suggestedCategory: 'phone'
      },
      photoAnalysisId: 'PHOTO_xyz123',
      status: 'success',
      warnings: []
    };

    const responsePromise = firstValueFrom(service.analyzePhoto(mockFile, 'phone'));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/items/analyze-photo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockResponse);

    const response = await responsePromise;
    expect(response.status).toBe('success');
    expect(response.extractedData.brand).toBe('Apple');
    expect(response.extractedData.model).toBe('iPhone 15 Pro');
    expect(response.extractedData.serialNumber).toBe('F17XH4K2Q1GH');
    expect(response.extractedData.confidence.brand).toBe(0.92);
  });

  it('should analyze photo successfully without category hint', async () => {
    const mockFile = new File(['mock image content'], 'device.jpg', { type: 'image/jpeg' });
    const mockResponse: PhotoAnalysisResponse = {
      extractedData: {
        brand: 'Samsung',
        model: 'Galaxy S24',
        serialNumber: 'SN123456789',
        confidence: {
          brand: 0.88,
          model: 0.82,
          serialNumber: 0.91
        },
        rawText: 'Samsung Galaxy S24\nSerial: SN123456789',
        suggestedCategory: 'phone'
      },
      photoAnalysisId: 'PHOTO_abc456',
      status: 'success',
      warnings: []
    };

    const responsePromise = firstValueFrom(service.analyzePhoto(mockFile));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/items/analyze-photo`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    const response = await responsePromise;
    expect(response.status).toBe('success');
    expect(response.extractedData.brand).toBe('Samsung');
  });

  it('should handle partial analysis result', async () => {
    const mockFile = new File(['mock image content'], 'device.jpg', { type: 'image/jpeg' });
    const mockResponse: PhotoAnalysisResponse = {
      extractedData: {
        brand: 'Apple',
        confidence: {
          brand: 0.85,
          model: 0.45,
          serialNumber: 0.30
        },
        rawText: 'Apple\nSome partial text',
        suggestedCategory: 'laptop'
      },
      photoAnalysisId: 'PHOTO_partial123',
      status: 'partial',
      warnings: ['Model could not be extracted with high confidence', 'Serial number not found']
    };

    const responsePromise = firstValueFrom(service.analyzePhoto(mockFile));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/items/analyze-photo`);
    req.flush(mockResponse);

    const response = await responsePromise;
    expect(response.status).toBe('partial');
    expect(response.extractedData.brand).toBe('Apple');
    expect(response.extractedData.model).toBeUndefined();
    expect(response.warnings.length).toBe(2);
  });

  it('should handle failed analysis result', async () => {
    const mockFile = new File(['mock image content'], 'blurry.jpg', { type: 'image/jpeg' });
    const mockResponse: PhotoAnalysisResponse = {
      extractedData: {
        confidence: {
          brand: 0.15,
          model: 0.10,
          serialNumber: 0.05
        },
        rawText: '',
      },
      photoAnalysisId: 'PHOTO_failed789',
      status: 'failed',
      warnings: ['Image quality too low', 'No text detected']
    };

    const responsePromise = firstValueFrom(service.analyzePhoto(mockFile));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/items/analyze-photo`);
    req.flush(mockResponse);

    const response = await responsePromise;
    expect(response.status).toBe('failed');
    expect(response.extractedData.brand).toBeUndefined();
    expect(response.warnings.length).toBe(2);
  });

  it('should handle HTTP error', async () => {
    const mockFile = new File(['mock image content'], 'device.jpg', { type: 'image/jpeg' });

    const responsePromise = firstValueFrom(service.analyzePhoto(mockFile));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/items/analyze-photo`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    await expect(responsePromise).rejects.toThrow();
  });
});
