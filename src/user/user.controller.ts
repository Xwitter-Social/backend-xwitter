import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Prisma, User as UserModel } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CurrentUser,
  type CurrentUserData,
} from 'src/auth/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body() userData: Prisma.UserCreateInput,
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getCurrentUser(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<UserModel> {
    return this.userService.getUserByIdentifier(currentUser.sub);
  }

  @UseGuards(AuthGuard)
  @Get('search')
  async searchUsers(@Query('q') query: string): Promise<UserModel[]> {
    return await this.userService.searchUsers(query);
  }

  @UseGuards(AuthGuard)
  @Get(':identifier')
  async getUser(@Param('identifier') identifier: string): Promise<UserModel> {
    return this.userService.getUserByIdentifier(identifier);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() data: Prisma.UserUpdateInput,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<UserModel> {
    return this.userService.updateUser(id, data, currentUser.sub);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<UserModel> {
    return this.userService.deleteUser(id, currentUser.sub);
  }
}
