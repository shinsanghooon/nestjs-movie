import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { envVariableKeys } from 'src/common/const/env.const';
import { Role, User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UserService,
    private configService: ConfigService,
    private jwtService: JwtService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('Invalid Authorization header');
    }

    const [type, token] = basicSplit;

    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    const userSplit = decoded.split(':');

    if (userSplit.length !== 2) {
      throw new BadRequestException('Invalid Authorization header');
    }

    const [email, password] = userSplit;

    return { email, password };
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    return this.userService.create({
      email,
      password,
    });
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    );

    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.accessTokenSecret,
    );

    return {
      refreshToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'refresh',
        },
        {
          secret: refreshTokenSecret,
          expiresIn: '24h',
        },
      ),
      accessToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'access',
        },
        {
          secret: accessTokenSecret,
          expiresIn: 300,
        },
      ),
    };
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('Invalid password');
    }

    return user;
  }

  async issueToken(user: { id: number; role: Role }, isRefresh: boolean) {
    const secret = isRefresh
      ? this.configService.get<string>(envVariableKeys.refreshTokenSecret)
      : this.configService.get<string>(envVariableKeys.accessTokenSecret);

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefresh ? 'refresh' : 'access',
      },
      {
        secret: secret,
        expiresIn: isRefresh ? '24h' : '300s',
      },
    );

    return token;
  }

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const [type, token] = rawToken.split(' ');

    if (type !== 'Bearer') {
      throw new BadRequestException('Invalid Authorization header');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          envVariableKeys.refreshTokenSecret,
        ),
      });

      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('Refresh 토큰을 입력해주세요!');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력해주세요!');
        }
      }

      return payload;
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료되었습니다.');
    }
  }

  async tokenBlock(token: string) {
    const payload = this.jwtService.decode(token);

    const expiryDate = +new Date(payload['exp'] * 1000);
    const now = +Date.now();

    const differenceInSeconds = (expiryDate - now) / 1000;
    await this.cacheManager.set(
      `BLOCK_${token}`,
      payload,
      Math.max(differenceInSeconds, 1) * 1000,
    );

    return true;
  }
}
