import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bullmq';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { CommonService } from './common.service';

@Controller('common')
export class CommonController {

  constructor(
    private readonly commonService: CommonService,

    @InjectQueue('thumbnail-generation')
    private readonly thumbnailQueue: Queue,
  ) { }

  @Post('video')
  @RBAC(Role.admin)
  @UseInterceptors(
    FileInterceptor('video', {
      fileFilter(req, file, callback) {
        if (file.mimetype !== 'video/mp4') {
          return callback(new BadRequestException('Invalid file type'), false);
        }
        return callback(null, true); // true이면 파일 저장
      },
    }),
  )
  async createVideo(@UploadedFile() video: Express.Multer.File) {

    await this.thumbnailQueue.add('thumbnail', {
      videoId: video.filename,
      videoPath: video.path,
    }, {
      priority: 1,
      delay: 100, // 100ms 기다렸다가 프로세싱을 해라
      attempts: 2, // 어떠한 이유로 실패를 해도 몇 번까지 재시도를 해라
      lifo: false, // if true, stack 구조로 간다
      removeOnComplete: true, // 성공했을때 큐에서 삭제
      removeOnFail: false // 재시도 포함 실패했을때 삭제  
    });
    return {
      fileName: video.filename,
    };
  }
}
