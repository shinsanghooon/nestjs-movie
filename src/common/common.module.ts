import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { join } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { v4 } from 'uuid';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { DefaultLogger } from './logger/default.logger';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');
          let extension = 'mp4';

          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          cb(null, `${v4()}_${Date.now()}.mp4`);
        },
      }),
    }),
    TypeOrmModule.forFeature([Movie]),
    BullModule.forRoot({
      connection: {
        host: 'redis-15605.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com',
        port: 15605,
        username: 'default',
        password: 'rPpdlWPLsTDbQaqPwjIYclq00HzANnYt',
      }
    }),
    BullModule.registerQueue({
      name: 'thumbnail-generation',

    })
  ],
  controllers: [CommonController],
  providers: [CommonService, TasksService, DefaultLogger],
  exports: [CommonService, DefaultLogger],
})
export class CommonModule { }
