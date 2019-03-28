import {
  Controller,
  Get,
  Body,
  Post,
  Query,
  ParseIntPipe,
  Param,
  Req
} from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from '@nestjs/common';

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
  list: T[];
  count?: number;
  query?: Query;
}

class Address {
  name: string;
  location: string;
  houseNumber: string;
}

interface Query {
  size: number;
  index: number;
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

  @Get('profile')
  async profile(@Req() request: Request): Promise<User> {
    return null;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return null;
  }
}
