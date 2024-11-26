import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  private movies : Movie[] = [];

  private idCounter = 3;

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>
  ) {}

  async getMovies(title: string) {
    
    if(!title){
      return [await this.movieRepository.find(), await this.movieRepository.count()];
    }

    return await this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`)
      }
    })
    
  }

  async getMovieById(id: number) {
    
    const movie =  await this.movieRepository.findOne({
      where: {
        id,
      }
    });

    if (!movie) {
      throw new NotFoundException("존재하지 않는 영화입니다.");
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {

    const movie = await this.movieRepository.save(createMovieDto);
    
    return movie;
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie =  await this.movieRepository.findOne({
      where: {
        id,
      }
    });
    
    if (!movie) {
      throw new NotFoundException("존재하지 않는 영화입니다.");
    }

    this.movieRepository.update(
      {id},
      updateMovieDto
    );

    const newMovie =  await this.movieRepository.findOne({
      where: {
        id,
      }
    });

    return newMovie;

  }

  async deleteMovie(id: number) {
    const movie =  await this.movieRepository.findOne({
      where: {
        id,
      }
    });
    
    if (!movie) {
      throw new NotFoundException("존재하지 않는 영화입니다.");

    await this.movieRepository.delete(id);

    return id;
    }

  } 
}
