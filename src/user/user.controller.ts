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
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CurrentUser,
  type CurrentUserData,
} from 'src/auth/current-user.decorator';
import { CreateUserDto, UpdateUserDto } from './dto';
import {
  ApiCreateUser,
  ApiGetAllUsers,
  ApiGetCurrentUser,
  ApiGetUser,
  ApiGetUserFollowers,
  ApiGetUserFollowing,
  ApiUpdateUser,
  ApiDeleteUser,
} from '../common/decorators/swagger.decorators';
import { SanitizedUser } from './user.service';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiCreateUser()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<SanitizedUser> {
    return this.userService.createUser(createUserDto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiGetCurrentUser()
  async getCurrentUser(
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<SanitizedUser> {
    return this.userService.getUserByIdentifier(currentUser.sub);
  }

  @UseGuards(AuthGuard)
  @Get('search')
  @ApiGetAllUsers()
  async searchUsers(@Query('search') query: string): Promise<SanitizedUser[]> {
    return await this.userService.searchUsers(query);
  }

  @UseGuards(AuthGuard)
  @Get(':id/followers')
  @ApiGetUserFollowers()
  async getFollowers(@Param('id') id: string): Promise<SanitizedUser[]> {
    return this.userService.getFollowers(id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/following')
  @ApiGetUserFollowing()
  async getFollowing(@Param('id') id: string): Promise<SanitizedUser[]> {
    return this.userService.getFollowing(id);
  }

  @UseGuards(AuthGuard)
  @Get(':identifier')
  @ApiGetUser()
  async getUser(
    @Param('identifier') identifier: string,
  ): Promise<SanitizedUser> {
    return this.userService.getUserByIdentifier(identifier);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @ApiUpdateUser()
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<SanitizedUser> {
    return this.userService.updateUser(id, updateUserDto, currentUser.sub);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @ApiDeleteUser()
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<SanitizedUser> {
    return this.userService.deleteUser(id, currentUser.sub);
  }
}
