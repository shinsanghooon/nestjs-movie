import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  // id_52,like_count_100
  cursor?: string;

  @IsArray()
  @IsString({
    each: true,
  })
  // [id_ASC, likeCount_DESC]
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  take: number = 20;
}
