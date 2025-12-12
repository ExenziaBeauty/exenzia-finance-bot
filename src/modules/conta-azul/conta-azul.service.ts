import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { TokenService } from './token.service';
import { RateLimitService } from '../../common/rate-limit.service';

interface RequestOptions {
  params?: Record<string, any>;
}

@Injectable()
export class ContaAzulService {
  private readonly logger = new Logger(ContaAzulService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly tokenService: TokenService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('CONTA_AZUL_BASE_URL', '');
  }

  async get<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.execute<T>('get', path, options);
  }

  private async execute<T>(method: 'get' | 'post', path: string, options?: RequestOptions): Promise<T> {
    await this.rateLimitService.consume();
    const accessToken = await this.tokenService.getAccessToken();

    try {
      const response = await this.httpService.axiosRef.request<T>({
        method,
        url: `${this.baseUrl}${path}`,
        params: options?.params,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 401) {
        this.logger.warn('Access token expired. Refreshing and retrying...');
        await this.tokenService.refreshToken();
        return this.execute<T>(method, path, options);
      }
      if (error.response?.status === 429) {
        return this.retryWithBackoff<T>(() => this.execute(method, path, options));
      }
      this.logger.error(`Conta Azul request failed: ${error.message}`);
      throw error;
    }
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
    const delay = Math.min(1000 * 2 ** attempt, 15000);
    this.logger.warn(`Rate limit hit. Backing off for ${delay}ms (attempt ${attempt}).`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fn();
  }
}
