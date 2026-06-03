import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { SuperadminService } from './superadmin.service';

class CreateAdminDto {
  @IsOptional()
  @IsString()
  full_name!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(['RESTAURANT', 'RETAIL_STORE', 'RETAIL'])
  store_type?: 'RESTAURANT' | 'RETAIL_STORE' | 'RETAIL';

  @IsOptional()
  @IsIn(['RESTAURANT', 'RETAIL_STORE', 'RETAIL'])
  storeType?: 'RESTAURANT' | 'RETAIL_STORE' | 'RETAIL';

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Get('admins')
  listAdmins() {
    return this.superadminService.listAdminUsers();
  }

  @Post('admins')
  createAdmin(@Body() body: CreateAdminDto) {
    const fullName = body.full_name ?? body.fullName;
    const storeType = this.normalizeStoreType(body.store_type ?? body.storeType);

    if (!fullName?.trim()) {
      throw new BadRequestException('Full name is required.');
    }

    if (!body.email?.trim()) {
      throw new BadRequestException('Email is required.');
    }

    return this.superadminService.createAdminAccount({
      fullName,
      email: body.email,
      storeType,
      password: body.password,
    });
  }

  private normalizeStoreType(storeType: CreateAdminDto['store_type']) {
    if (storeType === 'RETAIL') {
      return 'RETAIL_STORE';
    }

    if (storeType === 'RESTAURANT' || storeType === 'RETAIL_STORE') {
      return storeType;
    }

    throw new BadRequestException('Store type must be RESTAURANT or RETAIL_STORE.');
  }
}
