import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TokenDto } from './dto/token.dto';
import { AuthUserDto } from './dto/auth-user.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from '../user/entities/user.entity';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiResponse({ status: 200, type: TokenDto })
  @Post('/login')
  login(@Body() userDto: AuthUserDto) {
    return this.authService.login(userDto);
  }

  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiResponse({ status: 200, type: TokenDto })
  @Post('/registration')
  reg(@Body() userDto: CreateUserDto) {
    return this.authService.reg(userDto);
  }

  @ApiOperation({ summary: 'Проверка авторизации' })
  @Get('/am_i_auth')
  amIAuth(@Req() req: { user: User }) {
    return this.authService.amIAuth(req.user);
  }

  @ApiOperation({ summary: 'Выход пользователя' })
  @Get('/logout')
  logout() {
    // return this.authService.logout();
  }

  @ApiOperation({ summary: 'Смена кабинета' })
  @ApiResponse({ status: 200, type: TokenDto })
  @Get('/set/cabinet/:id')
  setCabinet(@Param('id') id: string, @Req() req: { user: User }) {
    return this.authService.setCabinet(req.user.id, +id);
  }
}
