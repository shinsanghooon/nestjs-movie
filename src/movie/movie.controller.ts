import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';



@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}


  @Get()
  getManyMovies(@Query('title') title: string){
    return this.movieService.getMovies(title)
  }

  @Get(':id')
  getMovie(@Param('id') id: string){
    return this.movieService.getMovieById(+id);

  }

  @Post()
  postMovie(@Body() body: CreateMovieDto){
    return this.movieService.createMovie(body)
  }


  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto){
    return this.movieService.updateMovie(+id, updateMovieDto)
  
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id)
  }
}
