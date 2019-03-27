import {
  Controller,
  Get,
  Body,
  Post,
  Query,
  ParseIntPipe,
  Param
} from '@nestjs/common';
import { AppService } from './app.service';

class CreateUserReq {
  username: string;
  password: string;
  mobile: string;
}

class CreateUserRes {
  username: string;
  mobile: string;
  createdAt: Date;
}

class User {
  name: string;
}

class ResultList<T> {
  size: number;
  type: string;
}

@Controller({
  path: 'app'
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root(): string {
    return this.appService.root();
  }

  @Post()
  async create(@Body() user: CreateUserReq): Promise<CreateUserRes> {
    return null;
  }

  @Get('query')
  async query(
    @Query('keyword') keyword?: string,
    @Query('index', new ParseIntPipe()) index: number = 1,
    @Query('size', new ParseIntPipe()) size: number = 10
  ): Promise<ResultList<User>> {
    return null;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return null;
  }
}
