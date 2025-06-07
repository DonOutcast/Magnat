import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEYS } from 'src/modules/user/auth/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEYS, [context.getHandler(), context.getClass()]);

      if (!requiredRoles) {
        return true;
      }

      return req.user.roles.some(role => requiredRoles.includes(role.slug));
    } catch (e) {
      throw new HttpException('Недостаточно прав', HttpStatus.FORBIDDEN);
    }
  }
}
