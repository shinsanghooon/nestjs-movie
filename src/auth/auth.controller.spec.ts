import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/user/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';


const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  tokenBlock: jest.fn(),
  issueToken: jest.fn()
}

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        }
      ],
    }).compile();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });


  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });


  describe('registerUser', () => {
    it('should register a user', async () => {
      const token = "Basic kajdhflkajdf";
      const result = { id: 1, email: "test@test.com" };

      jest.spyOn(authService, "register").mockResolvedValue(result as User);
      expect(authController.registerUser(token)).resolves.toEqual(result);
      expect(authService.register).toHaveBeenCalledWith(token);
    })
  })

  describe('loginUser', () => {
    it("should login a user", async () => {
      const token = "Basic adkjfhladk";
      const result = {
        refreshToken: 'mocked.refresh.token',
        accessToken: 'mocked.access.token'
      }

      jest.spyOn(authService, "login").mockResolvedValue(result);

      expect(authController.loginUser(token)).resolves.toEqual(result);
      expect(authService.login).toHaveBeenCalledWith(token);
    })
  })

  describe('blockToken', () => {
    it('should block a token', async () => {
      const token = 'some.jwt.token';
      jest.spyOn(authService, 'tokenBlock').mockResolvedValue(true);

      expect(authController.blockToken(token)).resolves.toBe(true);
      expect(authService.tokenBlock).toHaveBeenCalledWith(token);
    })
  })

  // describe('rotateAccessToken', () => {
  //   it('should rotate access token', async () => {
  //     const accessToken = 'mocked.access.token';

  //     jest.spyOn(authService, 'issueToken').mockResolvedValue(accessToken);
  //     const result = await authController.rotateAccesstoken("a")

  //     expect(authService.issueToken).toHaveBeenCalledWith("a", false);

  //     expect(result).toEqual(accessToken);
  //   })
  // })

});
