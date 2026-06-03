import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsNumber, IsString, MinLength } from 'class-validator';
import { AdminService } from './admin.service';

class CreateStaffDto {
  @Type(() => Number)
  @IsNumber()
  admin_user_id!: number;

  @IsString()
  full_name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(['POS_STAFF', 'INVENTORY_STAFF'])
  staff_type!: 'POS_STAFF' | 'INVENTORY_STAFF';
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('staff')
  listStaff(@Query('admin_user_id') adminUserId: string) {
    return this.adminService.listStaff(Number(adminUserId));
  }

  @Post('staff')
  createStaff(@Body() body: CreateStaffDto) {
    return this.adminService.createStaff({
      adminUserId: Number(body.admin_user_id),
      fullName: body.full_name,
      email: body.email,
      password: body.password,
      staffType: body.staff_type,
    });
  }
}
