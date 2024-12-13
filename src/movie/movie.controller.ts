import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { Role } from 'src/user/entities/user.entity';
import { QueryRunner as QR } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieService } from './movie.service';

@Controller('movie')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  @Get()
  @UseInterceptors(CacheInterceptor)
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  @ApiOperation({
    description: '영화를 조회하는 API(Pagination)',
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 API 페이지네이션이 실행됐을때',
  })
  getManyMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    return this.movieService.findAll(dto, userId);
  }

  @Get('recent')
  @UseInterceptors(CI) // 자동으로 엔드포인트의 결과를 캐싱한다. 쿼리파라미터가 있으면 다른 캐시로 저장된다.
  @CacheKey('getMoviesRecent') // 이렇게 하면 모든 캐시가 같은 키에 저장되기 때문에 쿼리파라미터에 영향을 안받는다
  @CacheTTL(1000) // module에서 적용한 설정은 오버라이딩 한다.
  @Throttle({
    count: 5,
    unit: 'minute',
  })
  getMoviesRecent() {
    console.log('Executes Get Movies Recent!');
    return this.movieService.findRecent();
  }

  @Public()
  @Get(':id')
  getMovie(
    @Param('id', ParseIntPipe)
    id: number,
    @Query('test', new DefaultValuePipe(10)) test: number,
  ) {
    return this.movieService.getMovieById(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() qr: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.createMovie(body, qr, userId);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.movieService.updateMovie(+id, updateMovieDto);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id);
  }

  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
