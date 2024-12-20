import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { envVariableKeys } from 'src/common/const/env.const';
import { Role, User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockUserService = {
    create: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        [envVariableKeys.refreshTokenSecret]: 'test-refresh-secret',
        [envVariableKeys.accessTokenSecret]: 'test-access-secret',
      };
      return config[key];
    }),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockImplementation((payload, options) => {
      // payload와 options에 따라 다른 토큰 반환

      if (payload.type === 'refresh') {
        return Promise.resolve('mock-refresh-token');
      }
      return Promise.resolve('mock-access-token');
    }),
    verifyAsync: jest.fn().mockResolvedValue({
      sub: 1,
      role: 'user',
      type: 'access',
    }),
    decode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('register', () => {
    it('should return registered user', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const basicToken = Buffer.from(`${email}:${password}`).toString('base64');
      const rawToken = `Basic ${basicToken}`;

      const expectedUser = { id: 1, email };
      mockUserService.create.mockResolvedValue(expectedUser);

      // When
      const result = await authService.register(rawToken);

      // Then
      expect(mockUserService.create).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('tokenBlock', () => {
    it('should block a token', async () => {
      const token = 'token';
      const payload = {
        exp: Math.floor(Date.now() / 1000) * 60,
      };

      jest.spyOn(mockJwtService, 'decode').mockReturnValue(payload);

      await authService.tokenBlock(token);

      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `BLOCK_${token}`,
        payload,
        expect.any(Number),
      );
    });
  });

  describe('parseBasicToken', () => {
    it('should parse a valid Basic Token', () => {
      const email = 'test@example.com';
      const password = 'password123';
      const basicToken = Buffer.from(`${email}:${password}`).toString('base64');
      const rawToken = `Basic ${basicToken}`;

      const result = authService.parseBasicToken(rawToken);

      expect(result).toEqual({
        email,
        password,
      });
    });

    it('shoould throw an error for invalid token format', () => {
      const rawToken = 'InvalidTokenFormat';
      expect(() => authService.parseBasicToken(rawToken)).rejects.toThrow;
    });

    it('shoould throw an error for invalid Bearer token format', () => {
      const rawToken = 'Bearer InvalidTokenFormat';
      expect(() => authService.parseBasicToken(rawToken)).rejects.toThrow;
    });

    it('shoould throw an error for invalid Basic token format', () => {
      const rawToken = 'basic A';
      expect(() => authService.parseBasicToken(rawToken)).rejects.toThrow;
    });
  });

  describe('parseBearerToken', () => {
    it('should parse a valid Bearer Toekn', async () => {
      const rawToken = 'Bearer token';
      const payload = { type: 'access' };
      jest.spyOn(mockJwtService, 'verifyAsync').mockResolvedValue(payload);

      const result = await authService.parseBearerToken(rawToken, false);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('token', {
        secret: 'test-access-secret',
      });
    });
  });

  describe('login', () => {
    it('should login', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const basicToken = Buffer.from(`${email}:${password}`).toString('base64');
      const rawToken = `Basic ${basicToken}`;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        email,
        password,
      });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((password, user_password) => true);

      const result = await authService.login(rawToken);

      const expectedResult = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      expect(result).toEqual(expectedResult);
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException when user does not exist', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const basicToken = Buffer.from(`${email}:${password}`).toString('base64');
      const rawToken = `Basic ${basicToken}`;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);

      expect(authService.login(rawToken)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when password is not correct', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const basicToken = Buffer.from(`${email}:${password}`).toString('base64');
      const rawToken = `Basic ${basicToken}`;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        email,
        password,
      });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((password, user_password) => false);

      expect(authService.login(rawToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('issueToken', () => {
    it('should return new refresh token', async () => {
      const id = 1;
      const role = Role.admin;
      const isRefresh = true;

      const result = await authService.issueToken(
        {
          id,
          role,
        },
        isRefresh,
      );

      const expectedToken = 'mock-refresh-token';

      expect(result).toEqual(expectedToken);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: id, role: role, type: 'refresh' },
        { secret: 'test-refresh-secret', expiresIn: '24h' },
      );
    });

    it('should return new access token', async () => {
      const id = 1;
      const role = Role.admin;
      const isRefresh = false;

      const result = await authService.issueToken(
        {
          id,
          role,
        },
        isRefresh,
      );
      console.log(result);

      const expectedToken = 'mock-access-token';

      expect(result).toEqual(expectedToken);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: id, role: role, type: 'access' },
        { secret: 'test-access-secret', expiresIn: '300s' },
      );
    });
  });
});
