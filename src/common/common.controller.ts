import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';

@Controller('common')
export class CommonController {
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
  createVideo(@UploadedFile() video: Express.Multer.File) {
    return {
      fileName: video.filename,
    };
  }
}
