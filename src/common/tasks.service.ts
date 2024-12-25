import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly moiveRepository: Repository<Movie>,
    // private readonly logger: DefaultLogger,

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) { }

  // @Cron('*/5 * * * * *')
  // logEverySecond() {
  //   this.logger.log('5초마다 실행!', TasksService.name);
  //   this.logger.warn('5초마다 경고!');
  // }

  async eraseOrphanfiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const fileName = parse(file).name;
      const split = fileName.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();

        return now - date > aDayInMilSec;
      } catch (e) {
        return true;
      }
    });

    await Promise.all(
      deleteFilesTargets.map((x) =>
        unlink(join(process.cwd(), 'public', 'temp', x)),
      ),
    );

    // for (let i = 0; i < deleteFilesTargets.length; i++) {
    //   const fileName = deleteFilesTargets[i];
    //   await unlink(join(process.cwd(), 'public', 'temp', fileName));
    // }
  }

  @Cron('0 * * * * *')
  async calculateMovieLikeCounts() {
    console.log('like run!');
    await this.moiveRepository.query(
      `
        update movie m
        set "likeCount" = (select count(*) 
                            from movie_user_like mul 
                            where m.id=mul."movieId" and mul."isLike" = true)
        
        `,
    );
  }

  async calculateMovieDisLikeCounts() {
    await this.moiveRepository.query(
      `
            UPDATE movie m 
            SET "likeCount" = (
            select count(*) from movie_user_like mul
            where m.id - mul."movieId" and mul."isLike" = false 
            )
            `,
    );
  }
}
