import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { AddRoleDto } from './dto/add-role.dto';
import { UpdateUserDto } from './dto/edit-user.dto';
import { Accesses } from '../auth/accesses.decorator';

@ApiTags('Пользователи')
@Accesses('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: 'Создание пользователя' })
  @ApiResponse({ status: 201, type: User })
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @ApiOperation({ summary: 'Список пользователей' })
  @ApiResponse({ status: 200, type: [User] })
  @Accesses('all_zp', 'orders')
  @Get()
  all() {
    return this.userService.getAll();
  }

  @ApiOperation({ summary: 'Пользователь детально' })
  @ApiResponse({ status: 200, type: User })
  @Accesses('all_zp')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.get(+id);
  }

  @ApiOperation({ summary: 'Редактирование пользователя' })
  @ApiResponse({ status: 200, type: User })
  @Post(':id')
  edit(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.edit(+id, dto);
  }

  @ApiOperation({ summary: 'Добавить роль пользователю' })
  @ApiResponse({ status: 200, type: User })
  @Post('/:id/role')
  addRole(@Param('id') id: string, @Body() dto: AddRoleDto) {
    return this.userService.addRole(+id, dto.slug);
  }

  @ApiOperation({ summary: 'Деактивация сотрудника' })
  @Get('/:id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.userService.deactivate(+id);
  }
}
