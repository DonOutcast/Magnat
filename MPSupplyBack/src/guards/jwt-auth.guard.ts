import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { jwtConstants } from './jwt.config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    if (['/api/auth/login'].includes(req.url)) {
      return true;
    }
    if (['/api/stock/calc'].includes(req.url)) {
      return true;
    }
    if (['/api/stock/sync'].includes(req.url)) {
      return true;
    }
    if (['/api/sales/sync'].includes(req.url)) {
      return true;
    }
    if (['/api/warehouses/sync'].includes(req.url)) {
      return true;
    }
    if (['/api/products/sync'].includes(req.url)) {
      return true;
    }

    if (['/api/capital/assets/calc'].includes(req.url)) {
      return true;
    }

    if (req.url.indexOf('/api/observable/label/') !== -1) {
      return true;
    }

    try {
      const authHeader = req.headers.authorization;
      const type = authHeader.split(' ')[0];
      const token = authHeader.split(' ')[1];

      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException({
          message: 'Проверьте токен авторизации',
        });
      }

      const user = this.jwtService.verify(token, {
        secret: jwtConstants.secret,
      });

      const accesses = [];
      // TODO: Repo access
      if (user.roles.some((role) => role.slug == 'admin')) {
        accesses.push(
          'orders',
          'own_calendar',
          'all_calendar',
          'clients',
          'service_manage',
          'own_zp',
          'all_zp',
          'schedule',
          'stat',
          'warehouse',
          'delete_order',
          'roles',
          'users',
          'warehouse_edit',
          'payment_edit',
        );
      }

      user.accesses = accesses;

      req.user = user;
      return true;
    } catch (e) {
      throw new UnauthorizedException({
        message: 'Пользователь не авторизован',
      });
    }
  }
}
