import type {
  ConversionRequest,
  ConversionResult,
  ApiResponse,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:3001/api");

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error("Something went wrong. Please try again.");
      }

      return data;
    } catch {
      throw new Error("Something went wrong. Please try again.");
    }
  }

  async startConversion(
    request: ConversionRequest
  ): Promise<{ conversionId: string }> {
    const response = await this.request<{ conversionId: string }>(
      "/playlist/start-conversion",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );

    if (!response.success || !response.data) {
      throw new Error("Something went wrong. Please try again.");
    }

    return response.data;
  }

  async getConversionStatus(conversionId: string): Promise<any> {
    const response = await this.request<any>(
      `/playlist/conversion-status/${conversionId}`
    );

    if (!response.success) {
      throw new Error("Something went wrong. Please try again.");
    }

    return response.data;
  }

  async cancelConversion(
    conversionId: string
  ): Promise<{ conversionId: string }> {
    const response = await this.request<{ conversionId: string }>(
      `/playlist/cancel-conversion/${conversionId}`,
      {
        method: "POST",
      }
    );

    if (!response.success || !response.data) {
      throw new Error("Something went wrong. Please try again.");
    }

    return response.data;
  }

  async getAllConversions(): Promise<any[]> {
    const response = await this.request<any[]>("/playlist/conversions");

    if (!response.success) {
      throw new Error("Something went wrong. Please try again.");
    }

    return response.data || [];
  }

  async convertPlaylist(request: ConversionRequest): Promise<ConversionResult> {
    const response = await this.request<ConversionResult>("/playlist/convert", {
      method: "POST",
      body: JSON.stringify(request),
    });

    if (!response.success || !response.data) {
      throw new Error("Something went wrong. Please try again.");
    }

    return response.data;
  }

  async getConversionLogs(): Promise<ConversionResult[]> {
    const response = await this.request<ConversionResult[]>("/playlist/logs");

    if (!response.success) {
      throw new Error("Something went wrong. Please try again.");
    }

    return response.data || [];
  }

  async healthCheck(): Promise<{
    backend: boolean;
    ytmusicService: boolean;
    timestamp: string;
  }> {
    const response = await this.request<{
      backend: boolean;
      ytmusicService: boolean;
      timestamp: string;
    }>("/playlist/health");

    if (!response.success || !response.data) {
      throw new Error("Something went wrong. Please try again.");
    }

    return response.data;
  }
}

export default new ApiService();
