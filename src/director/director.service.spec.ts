import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { Director } from './entity/director.entity';


const mockDirectorRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository: Repository<Director>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository
        }
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(getRepositoryToken(Director));
  });

  beforeAll(() => {
    jest.clearAllMocks();
  })

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });


  describe("create", () => {
    it("shouild create a new director", async () => {
      const createDirectorDto = {
        name: "code"
      };

      jest.spyOn(mockDirectorRepository, "save").mockResolvedValue(createDirectorDto);

      const result = await directorService.create(createDirectorDto as CreateDirectorDto);

      expect(directorRepository.save).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toEqual(createDirectorDto);

    })
  })

  describe("findAll", () => {
    it('should return an array of directors', async () => {
      const directors = [
        {
          id: 1,
          name: 'code'
        }
      ]

      jest.spyOn(mockDirectorRepository, "find").mockResolvedValue(directors);

      const result = await directorService.findAll();
      expect(directorRepository.find).toHaveBeenCalled();
      expect(result).toEqual(directors);
    })
  })

  describe("findOne", () => {
    it('should return an director by id', async () => {
      const director = {
        id: 1,
        name: 'code'
      }

      jest.spyOn(mockDirectorRepository, "findOne").mockResolvedValue(director as Director);

      const result = await directorService.findOne(director.id);
      expect(result).toEqual(result);
      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id: director.id }
      })
    })
  })

  describe("update", () => {
    it('should update a director', async () => {
      const updateDirectorDto = { name: 'code' };
      const existingDirector = { id: 1, name: 'code' };
      const updatedDirector = { id: 1, name: 'code2' };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValueOnce(existingDirector);
      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValueOnce(updatedDirector);

      const result = await directorService.update(1, updateDirectorDto)

      expect(result).toEqual(updatedDirector);
      expect(directorRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
      expect(directorRepository.update).toHaveBeenCalledWith({
        id: 1,
      }, updateDirectorDto);
    })

    it('should throw NotFoundException if director does not exist', async () => {

      jest.spyOn(mockDirectorRepository, "findOne").mockResolvedValue(null);
      expect(directorService.update(1, { name: 'code' })).rejects.toThrow(NotFoundException);

    })
  })

  describe("remove", () => {
    it('should remove a director by id', async () => {
      const director = { id: 1, name: 'code' };

      jest.spyOn(mockDirectorRepository, 'findOne').mockResolvedValue(director);


      const result = await directorService.remove(director.id);

      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: director.id
        }
      });
      expect(directorRepository.delete).toHaveBeenCalledWith(director.id)

    })
  })

  it('should throw NotFoundException if director does not exist', async () => {
    jest.spyOn(mockDirectorRepository, "findOne").mockResolvedValue(null);
    expect(directorService.update(1, { name: 'code' })).rejects.toThrow(NotFoundException);
  })

});
