import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class MovieTitleValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    // 글자가 2보다 작으면 에러 던지기

    if (value === undefined) {
      return value;
    }

    if (value.length <= 2) {
      throw new BadRequestException('제목은 2글자 이상 입력해주세요!');
    }

    return value;
  }
}
