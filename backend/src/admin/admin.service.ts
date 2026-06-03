import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminService {
  constructor(private readonly databaseService: DatabaseService) {}

  listStaff(adminUserId: number) {
    return this.databaseService.listStaffForAdmin(adminUserId);
  }

  createStaff(input: {
    adminUserId: number;
    fullName: string;
    email: string;
    password: string;
    staffType: 'POS_STAFF' | 'INVENTORY_STAFF';
  }) {
    return this.databaseService.createStaffAccount(input);
  }
}
