import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './entity/genre.entity';
import { GenreService } from './genre.service';

const mockGenreRepository = {
  save: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}


describe('GenreService', () => {
  let service: GenreService;
  let repository: Repository<Genre>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository
        }
      ],
    }).compile();

    service = module.get<GenreService>(GenreService);
    repository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterAll(() => {
    jest.clearAllMocks();
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


});
