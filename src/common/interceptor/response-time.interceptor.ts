import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const reqTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const resTime = Date.now();
        const responseTime = resTime - reqTime;
        req.responseTime = responseTime;

        if (responseTime > 1000) {
          console.log(
            `!!! TIMEOUT !!![${req.method}] ${req.path} - ${responseTime}ms`,
          );
          throw new InternalServerErrorException('시간이 너무 오래걸립니다.');
        } else {
          console.log(`[${req.method}] ${req.path} - ${responseTime}ms`);
        }
      }),
    );
  }
}
