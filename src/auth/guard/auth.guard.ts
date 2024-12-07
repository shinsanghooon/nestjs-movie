import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 만약에 public decoration이 되어있으면
    // 모든 로직을 bypass
    // 데코레이터가 있으면 isPublic엔 빈 객체가 들어온다. 만약 데코레이터가 없으면 undefiend
    const isPublic = this.reflector.get(Public, context.getHandler());
    if (isPublic) {
      return true;
    }

    // 요청에서 user 객체가 존재하는지 확인한다.
    const request = context.switchToHttp().getRequest();

    // if (!request.user || request.user.type !== 'access') {
    if (!request.user) {
      return false;
    }

    return true;
  }
}
