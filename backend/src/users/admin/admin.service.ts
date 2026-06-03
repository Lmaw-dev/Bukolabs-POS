import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';

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

  getStoreInformation(adminUserId: number) {
    return this.databaseService.getStoreInformationForAdmin(adminUserId);
  }

  updateStoreInformation(input: {
    adminUserId: number;
    businessName: string;
    businessDescription: string | null;
    address: string | null;
    contactNumber: string | null;
    email: string | null;
    logo: string | null;
    receiptThankYouMessage: string | null;
    receiptFooterMessage: string | null;
    operatingHours: string | null;
    currency: string | null;
    themeColor: string | null;
    taxRate: number | null;
    serviceChargeRate: number | null;
  }) {
    return this.databaseService.updateStoreInformationForAdmin(input);
  }
}
