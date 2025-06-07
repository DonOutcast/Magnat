import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ACCESSES_KEYS } from 'src/modules/user/auth/accesses.decorator';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const requiredAccesses = this.reflector.getAllAndOverride<string[]>(ACCESSES_KEYS, [context.getHandler(), context.getClass()]);

      if (!requiredAccesses) {
        return true;
      }

      return req.user.accesses.some(access => requiredAccesses.includes(access));
    } catch (e) {
      throw new HttpException('Недостаточно прав', HttpStatus.FORBIDDEN);
    }
  }
}
