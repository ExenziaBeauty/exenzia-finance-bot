import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly tokenUrl: string;
  private readonly scope: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.tokenUrl = this.configService.get<string>('CONTA_AZUL_TOKEN_URL', '') || '';
    this.scope =
      this.configService.get<string>(
        'CONTA_AZUL_SCOPE',
        'openid profile aws.cognito.signin.user.admin',
      ) || 'openid profile aws.cognito.signin.user.admin';
  }

  async getAccessToken(): Promise<string> {
    const token = await this.prisma.token.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!token) {
      const newToken = await this.refreshToken();
      return newToken.accessToken;
    }

    const expiresSoon = dayjs(token.expiresAt).subtract(1, 'minute').isBefore(dayjs());
    if (expiresSoon) {
      const newToken = await this.refreshToken(token.refreshToken);
      return newToken.accessToken;
    }

    return token.accessToken;
  }

  async refreshToken(currentRefreshToken?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const clientId = this.configService.get<string>('CONTA_AZUL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('CONTA_AZUL_CLIENT_SECRET');
    const refreshToken = currentRefreshToken || (await this.getLatestRefreshToken());

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Conta Azul credentials or refresh token not configured.');
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('scope', this.scope);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const { data } = await this.httpService.axiosRef.post(this.tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    await this.saveTokens(data.access_token, data.refresh_token, data.expires_in);

    this.logger.log('Access token refreshed successfully');

    return { accessToken: data.access_token, refreshToken: data.refresh_token };
  }

  async saveTokens(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    await this.prisma.token.create({
      data: {
        accessToken,
        refreshToken,
        scope: this.scope,
        expiresAt: dayjs().add(expiresIn, 'seconds').toDate(),
      },
    });
  }

  private async getLatestRefreshToken(): Promise<string | undefined> {
    const token = await this.prisma.token.findFirst({ orderBy: { createdAt: 'desc' } });
    return token?.refreshToken;
  }
}
