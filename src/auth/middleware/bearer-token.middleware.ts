import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async use(req: any, res: any, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    const blockToken = await this.cacheManager.get(`BLOCK_${token}`);
    if (blockToken) {
      throw new ForbiddenException('차단된 토큰입니다.');
    }

    const cachedPayload = await this.cacheManager.get(`TOKEN_${token}`);
    if (cachedPayload) {
      req.user = cachedPayload;
    }

    const decodedPayload = this.jwtService.decode(token);

    try {
      const secretKey =
        decodedPayload.type == 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      // payload('exp) epoch time seconds
      const expiryDate = +new Date(payload['exp'] * 1000);
      const now = +Date.now();

      const differenceInSeconds = (expiryDate - now) / 1000;
      await this.cacheManager.set(
        `TOKEN_${token}`,
        payload,
        Math.max(differenceInSeconds - 30, 1) * 1000,
      );

      const isRefreshToken = decodedPayload.type === 'refresh';

      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('Refresh 토큰을 입력해주세요!');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력해주세요!');
        }
      }

      req.user = payload;
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료되었습니다.');
      }

      next();
      // 에러를 던져서 끝내지 않고 다음으로 보내버린다(가드에서 처리하도록)
      //   throw new UnauthorizedException('토큰이 만료되었습니다.');
    }
  }

  validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit[0] !== 'Bearer') {
      throw new BadRequestException('Invalid Authorization header');
    }

    if (basicSplit.length !== 2) {
      throw new BadRequestException('Invalid Authorization header');
    }

    return basicSplit[1];
  }
}
