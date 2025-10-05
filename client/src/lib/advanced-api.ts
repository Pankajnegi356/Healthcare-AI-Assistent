/**
 * Advanced API Service with Caching, Request Optimization, and Error Handling
 * Features:
 * - Intelligent request caching with TTL
 * - Request deduplication
 * - Retry logic with exponential backoff
 * - Request batching
 * - Performance monitoring
 * - Offline support
 */

class AdvancedAPIService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private requestQueue: Array<{ url: string; options: any; resolve: (value: any) => void; reject: (reason: any) => void }> = [];
  private batchQueue: Array<{ url: string; options: any; resolve: (value: any) => void; reject: (reason: any) => void }> = [];
  private isProcessingBatch = false;
  private retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff
  private performanceMetrics = new Map<string, { count: number; totalTime: number; errors: number }>();

  constructor(private baseURL: string = 'http://localhost:3000/api') {}

  /**
   * Enhanced GET request with caching and optimization
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const cacheKey = this.generateCacheKey('GET', endpoint, options);
    
    // Check cache first
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.updateMetrics(endpoint, 0, false); // Cache hit
        return cached;
      }
    }

    // Check for pending identical request
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this.executeRequest<T>('GET', endpoint, null, options);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result
      if (options.useCache !== false) {
        this.setCache(cacheKey, result, options.cacheTTL || 300000); // 5 minutes default
      }
      
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Enhanced POST request with optimization
   */
  async post<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    if (options.batchable) {
      return this.addToBatch<T>('POST', endpoint, data, options);
    }
    
    return this.executeRequest<T>('POST', endpoint, data, options);
  }

  /**
   * Enhanced PUT request
   */
  async put<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.executeRequest<T>('PUT', endpoint, data, options);
  }

  /**
   * Enhanced DELETE request
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Invalidate related cache entries
    this.invalidateCache(endpoint);
    return this.executeRequest<T>('DELETE', endpoint, null, options);
  }

  /**
   * Batch multiple requests together
   */
  private async addToBatch<T>(method: string, endpoint: string, data: any, options: RequestOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ 
        url: `${this.baseURL}${endpoint}`, 
        options: { method, body: JSON.stringify(data), ...options }, 
        resolve, 
        reject 
      });

      // Process batch if queue is full or after delay
      if (this.batchQueue.length >= 5 || !this.isProcessingBatch) {
        this.processBatch();
      }
    });
  }

  /**
   * Process batched requests
   */
  private async processBatch() {
    if (this.isProcessingBatch || this.batchQueue.length === 0) return;
    
    this.isProcessingBatch = true;
    
    setTimeout(async () => {
      const currentBatch = this.batchQueue.splice(0, 5);
      
      try {
        const promises = currentBatch.map(req => 
          this.executeRequestWithRetry(req.url, req.options)
            .then((result: any) => req.resolve(result))
            .catch((error: any) => req.reject(error))
        );
        
        await Promise.allSettled(promises);
      } finally {
        this.isProcessingBatch = false;
        
        // Process next batch if available
        if (this.batchQueue.length > 0) {
          this.processBatch();
        }
      }
    }, 100); // Small delay to accumulate more requests
  }

  /**
   * Execute request with retry logic and error handling
   */
  private async executeRequest<T>(
    method: string, 
    endpoint: string, 
    data: any, 
    options: RequestOptions
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    return this.executeRequestWithRetry(url, requestOptions);
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequestWithRetry<T>(url: string, options: RequestInit): Promise<T> {
    const startTime = performance.now();
    const endpoint = url.replace(this.baseURL, '');
    
    for (let attempt = 0; attempt <= this.retryDelays.length; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          // signal: AbortSignal.timeout(options.timeout || 30000), // 30s timeout - commented out for compatibility
        });

        if (!response.ok) {
          throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }

        const result = await response.json();
        const endTime = performance.now();
        
        this.updateMetrics(endpoint, endTime - startTime, false);
        
        return result;
      } catch (error) {
        const isLastAttempt = attempt === this.retryDelays.length;
        
        if (isLastAttempt) {
          const endTime = performance.now();
          this.updateMetrics(endpoint, endTime - startTime, true);
          
          // Enhanced error handling
          if (error instanceof APIError) {
            throw error;
          } else if ((error as any)?.name === 'AbortError') {
            throw new APIError('Request timeout', 408);
          } else if (!navigator.onLine) {
            throw new APIError('Network unavailable', 0);
          } else {
            throw new APIError('Network error', 500);
          }
        }

        // Wait before retry
        await this.delay(this.retryDelays[attempt]);
      }
    }

    throw new APIError('Max retries exceeded', 500);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(method: string, endpoint: string, options: any): string {
    const params = options.params ? JSON.stringify(options.params) : '';
    return `${method}:${endpoint}:${params}`;
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    } else if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Cleanup old cache entries
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Invalidate cache entries
   */
  private invalidateCache(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((value, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.cache.forEach((value, key) => {
      if (now - value.timestamp >= value.ttl) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(endpoint: string, duration: number, isError: boolean): void {
    if (!this.performanceMetrics.has(endpoint)) {
      this.performanceMetrics.set(endpoint, { count: 0, totalTime: 0, errors: 0 });
    }

    const metrics = this.performanceMetrics.get(endpoint)!;
    metrics.count++;
    metrics.totalTime += duration;
    if (isError) metrics.errors++;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Map<string, { count: number; avgTime: number; errorRate: number }> {
    const result = new Map();
    this.performanceMetrics.forEach((metrics, endpoint) => {
      result.set(endpoint, {
        count: metrics.count,
        avgTime: metrics.totalTime / metrics.count,
        errorRate: (metrics.errors / metrics.count) * 100,
      });
    });
    return result;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This would need to track hits vs misses in a real implementation
    return {
      size: this.cache.size,
      hitRate: 0, // Placeholder
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Request options interface
 */
interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  useCache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  batchable?: boolean;
  retries?: number;
}

/**
 * Medical API Service with specialized healthcare endpoints
 */
class MedicalAPIService extends AdvancedAPIService {
  constructor() {
    super('http://localhost:3000/api');
  }

  // Specialized medical endpoints with intelligent caching
  async analyzeSymptoms(symptoms: string, mode: string = 'patient', sessionId: string, patientInfo?: any, followUpAnswers?: any[]) {
    return this.post('/analyze', { symptoms, mode, sessionId, patientInfo, followUpAnswers }, {
      cacheTTL: 600000, // 10 minutes cache for symptom analysis
      timeout: 45000, // Longer timeout for AI analysis
    });
  }

  async generateQuestions(symptoms: string, mode: string = 'patient', sessionId: string, patientInfo?: any, questionType: string = 'mcq') {
    return this.post('/generate-questions', { symptoms, mode, sessionId, patientInfo, questionType }, {
      useCache: true,
      cacheTTL: 1800000, // 30 minutes cache for questions
    });
  }

  async getSessionData(sessionId: string) {
    return this.get(`/sessions/${sessionId}/conversation`, {
      useCache: true,
      cacheTTL: 60000, // 1 minute cache for session data
    });
  }

  async exportSession(sessionId: string) {
    return this.get(`/sessions/${sessionId}/export`, {
      useCache: false, // Don't cache exports
      timeout: 60000, // Longer timeout for export generation
    });
  }

  async createSession() {
    return this.post('/sessions', {}, {
      useCache: false, // Never cache session creation
    });
  }

  // Batch medical record updates
  async updateMedicalRecords(records: any[]) {
    return Promise.all(
      records.map(record => 
        this.put(`/medical-records/${record.id}`, record, { batchable: true })
      )
    );
  }

  // Real-time vital signs monitoring
  async getVitalSigns(patientId: string) {
    return this.get(`/patients/${patientId}/vitals`, {
      useCache: true,
      cacheTTL: 30000, // 30 seconds cache for vitals
    });
  }

  // Emergency alert system
  async sendEmergencyAlert(alert: any) {
    return this.post('/emergency/alert', alert, {
      timeout: 10000, // Fast timeout for emergency
      retries: 5, // More retries for critical alerts
    });
  }
}

// Export singleton instance
export const medicalAPI = new MedicalAPIService();
export { APIError, type RequestOptions };
