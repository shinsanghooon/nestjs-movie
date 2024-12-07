import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const { path, method } = request;
    const cacheKey = `${method}:${path}`;

    if (this.cache.has(cacheKey)) {
      // Observable로 반환하기 위해
      return of(this.cache.get(cacheKey));
    }

    return next
      .handle()
      .pipe(tap((response) => this.cache.set(cacheKey, response)));
  }
}
