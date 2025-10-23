// API Configuration and Base Service
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  setRefreshToken(refreshToken: string | null) {
    this.refreshToken = refreshToken;
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }
  }

  private async handleTokenRefresh(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        if (!this.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseURL}/api/v2/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.refreshToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        this.setToken(data.access_token);

        if (data.refresh_token) {
          this.setRefreshToken(data.refresh_token);
        }

        return data.access_token;
      } catch (error) {
        // Clear tokens on refresh failure
        this.setToken(null);
        this.setRefreshToken(null);

        // Trigger logout event
        window.dispatchEvent(new CustomEvent('auth:logout'));

        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retryCount === 0 && this.refreshToken) {
        try {
          await this.handleTokenRefresh();
          // Retry the request with new token
          return this.request<T>(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          // Refresh failed, throw original error
          throw new ApiError(401, 'Authentication required');
        }
      }

      if (!response.ok) {
        throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response.text() as unknown as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; refresh_token: string; user: any }>('/api/v2/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store refresh token
    if (response.refresh_token) {
      this.setRefreshToken(response.refresh_token);
    }

    return response;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.request<{ access_token: string; refresh_token: string; user: any }>('/api/v2/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    // Store refresh token
    if (response.refresh_token) {
      this.setRefreshToken(response.refresh_token);
    }

    return response;
  }

  async logout() {
    try {
      return await this.request('/api/v2/auth/logout', { method: 'POST' });
    } finally {
      // Always clear tokens on logout
      this.setToken(null);
      this.setRefreshToken(null);
    }
  }

  async refreshAccessToken() {
    return this.request<{ access_token: string }>('/api/v2/auth/refresh', { method: 'POST' });
  }

  async getProfile() {
    return this.request<any>('/api/v2/auth/profile');
  }

  async updateProfile(data: any) {
    return this.request<any>('/api/v2/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/api/v2/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/api/v2/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Users methods
  async getUsers() {
    return this.request<any[]>('/api/v2/users');
  }

  async getUserActivity(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/api/v2/users/activity${query}`);
  }

  async createUser(data: any) {
    return this.request<any>('/api/v2/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUser(id: string) {
    return this.request<any>(`/api/v2/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/api/v2/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/api/v2/users/${id}`, { method: 'DELETE' });
  }

  async resetUserPassword(id: string) {
    return this.request(`/api/v2/users/${id}/reset-password`, { method: 'POST' });
  }

  // Aircraft methods
  async getAircraftTypes() {
    return this.request<any[]>('/api/v2/aircraft-types');
  }

  async getAircraft() {
    return this.request<any[]>('/api/v2/aircraft');
  }

  async createAircraft(data: any) {
    return this.request<any>('/api/v2/aircraft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAircraftById(id: string) {
    return this.request<any>(`/api/v2/aircraft/${id}`);
  }

  async updateAircraft(id: string, data: any) {
    return this.request<any>(`/api/v2/aircraft/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAircraft(id: string) {
    return this.request(`/api/v2/aircraft/${id}`, { method: 'DELETE' });
  }

  // Analysis methods
  async analyzeFlightLog(file: File, metadata?: any) {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return this.request<any>('/api/v2/analyze', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async getAnalyses() {
    return this.request<any[]>('/api/v2/analyses');
  }

  async getAnalysis(id: string) {
    return this.request<any>(`/api/v2/analyses/${id}`);
  }

  async deleteAnalysis(id: string) {
    return this.request(`/api/v2/analyses/${id}`, { method: 'DELETE' });
  }

  async exportAnalyses(format: 'csv' | 'json' = 'csv') {
    const response = await fetch(`${this.baseURL}/api/v2/analyses/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flight-analyses-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async batchAnalyze(files: File[]) {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    return this.request<any>('/api/v2/batch-analyze', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  async retrainModel() {
    return this.request('/api/v2/retrain', { method: 'POST' });
  }

  async getModelInfo() {
    return this.request<any>('/api/v2/model/info');
  }

  // Files methods
  async getFiles() {
    return this.request<any[]>('/api/v2/files');
  }

  async deleteFile(id: string) {
    return this.request(`/api/v2/files/${id}`, { method: 'DELETE' });
  }

  async downloadFile(id: string) {
    return this.request(`/api/v2/files/${id}/download`);
  }

  async getFileMetadata(id: string) {
    return this.request<any>(`/api/v2/files/${id}/metadata`);
  }

  // System methods
  async getSystemStatus() {
    return this.request<any>('/api/v2/system/status');
  }

  async getDatabaseStatus() {
    return this.request<any>('/api/v2/system/database-status');
  }

  async getSystemMetrics() {
    return this.request<any>('/api/v2/system/metrics');
  }

  async getSystemLogs() {
    return this.request<any>('/api/v2/system/logs');
  }

  async createBackup() {
    return this.request('/api/v2/system/backup', { method: 'POST' });
  }

  async getDetailedHealth() {
    return this.request<any>('/api/v2/system/health-detailed');
  }

  async getHealth() {
    return this.request<any>('/health');
  }

  async getSystemSettings() {
    return this.request<any>('/api/v2/system/settings');
  }

  async updateSystemSettings(settings: any) {
    return this.request<any>('/api/v2/system/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Organizations methods
  async getOrganizations() {
    return this.request<any[]>('/api/v2/organizations');
  }

  async createOrganization(data: any) {
    return this.request<any>('/api/v2/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrganization(id: string) {
    return this.request<any>(`/api/v2/organizations/${id}`);
  }

  async updateOrganization(id: string, data: any) {
    return this.request<any>(`/api/v2/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(id: string) {
    return this.request(`/api/v2/organizations/${id}`, { method: 'DELETE' });
  }

  // Reports methods
  async getReports() {
    return this.request<any[]>('/api/v2/reports');
  }

  async generateReport(data: any) {
    return this.request<any>('/api/v2/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReport(id: string) {
    return this.request<any>(`/api/v2/reports/${id}`);
  }

  async exportReportPDF(id: string) {
    return this.request(`/api/v2/reports/${id}/pdf`);
  }

  async exportReportCSV(id: string) {
    return this.request(`/api/v2/reports/${id}/csv`);
  }

  async deleteReport(id: string) {
    return this.request(`/api/v2/reports/${id}`, { method: 'DELETE' });
  }

  // Notifications methods
  async getNotifications() {
    return this.request<any[]>('/api/v2/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/api/v2/notifications/${id}/read`, { method: 'PUT' });
  }

  async deleteNotification(id: string) {
    return this.request(`/api/v2/notifications/${id}`, { method: 'DELETE' });
  }

  async markAllNotificationsAsRead() {
    return this.request('/api/v2/notifications/mark-all-read', { method: 'POST' });
  }

  // API Keys methods
  async getApiKeys() {
    return this.request<any[]>('/api/v2/api-keys');
  }

  async createApiKey(data: any) {
    return this.request<any>('/api/v2/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApiKey(id: string, data: any) {
    return this.request<any>(`/api/v2/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApiKey(id: string) {
    return this.request(`/api/v2/api-keys/${id}`, { method: 'DELETE' });
  }
}

export const apiService = new ApiService(API_BASE_URL);
export { ApiError };