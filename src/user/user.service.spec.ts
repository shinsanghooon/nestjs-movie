import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    // IoC 컨테이너에서 만들어지는 상황
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          email: 'test@test.ai',
        },
        {
          id: 2,
          email: 'test2@test.ai',
        },
      ];

      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = {
        id: 1,
        email: 'test@test.ai',
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      expect(result.id).toEqual(user.id);
      expect(mockUserRepository.findOne).toHaveBeenCalled();
    });

    it('should thorw a NotFoundException if user is not found', async () => {
      const user = {
        id: 1,
        email: 'test@test.ai',
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);
      // mockUserRepository.findOne.mockResolvedValue(user);

      const wrongId = 5;
      expect(userService.findOne(wrongId)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: wrongId,
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new user and return it', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: '123123',
      };

      const hashRounds = 10;
      const hashedPassword = 'hashhash';

      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);

      const createdUser = await userService.create(createUserDto);

      expect(createdUser).toEqual(result);

      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: createUserDto.email },
      });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { email: createUserDto.email },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      expect(bcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        hashRounds,
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('should throw a BadRequestException', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: '123123',
      };

      const hashRounds = 10;
      const hashedPassword = 'hashhash';

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
        email: createUserDto.email,
      });

      expect(userService.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      const id = 999;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id,
      });

      const result = await userService.remove(id);

      expect(result).toEqual(id);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
      });
    });

    it('should throw a NotFoundException if user to delete is not found', async () => {
      const id = 999;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.remove(id)).rejects.toThrow(NotFoundException);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a user if it exists and return the updated user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'test@test.com',
        password: '123123123',
      };

      const hashRounds = 10;
      const hashedPassword = '12312312314123';
      const user = {
        id: 1,
        email: updateUserDto.email,
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);

      jest.spyOn(mockUserRepository, 'update').mockResolvedValueOnce(undefined);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        ...user,
        password: hashedPassword,
      });

      const result = await userService.update(1, updateUserDto);
      expect(result).toEqual({
        ...user,
        password: hashedPassword,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        updateUserDto.password,
        hashRounds,
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        {
          id: 1,
        },
        {
          ...updateUserDto,
          password: hashedPassword,
        },
      );
    });

    it('should throw a NotFoundException if user to update is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      const updateUserDto: UpdateUserDto = {
        email: ' test@test.com',
        password: '123123',
      };

      expect(userService.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });
  });
});
