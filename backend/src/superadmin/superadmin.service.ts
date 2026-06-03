import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SuperadminService {
  constructor(private readonly databaseService: DatabaseService) {}

  listAdminUsers() {
    return this.databaseService.listAdminUsers();
  }

  createAdminAccount(input: { fullName: string; email: string; storeType: 'RESTAURANT' | 'RETAIL_STORE'; password?: string }) {
    return this.databaseService.createAdminAccount(input);
  }
}