import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateChatDto {

    @IsString()
    message: string;

    // admin 입장에서는 여러명의 사용자와 채팅을 해야하고
    // 어떤 방에 메시지를 보내야할지 알아야한다.
    @IsNumber()
    @IsOptional()
    room?: number;
}