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
    staffType: 'POS_STAFF';
  }) {
    return this.databaseService.createStaffAccount(input);
  }

  updateStaff(input: {
    adminUserId: number;
    staffUserId: number;
    fullName: string;
    email: string;
    password?: string;
    staffType: 'POS_STAFF';
  }) {
    return this.databaseService.updateStaffAccountForAdmin(input);
  }

  deleteStaff(input: { adminUserId: number; staffUserId: number }) {
    return this.databaseService.deleteStaffAccountForAdmin(input);
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

  getStoreSettings(adminUserId: number) {
    return this.databaseService.getStoreSettingsForAdmin(adminUserId);
  }

  updateStoreSettings(input: {
    adminUserId: number;
    enableCustomerRecommendation?: boolean;
    enableTableManagement?: boolean;
    enableRefund?: boolean;
    enableVoid?: boolean;
    enableDiscount?: boolean;
    enableServiceCharge?: boolean;
    serviceChargePercentage?: number;
    enableDineIn?: boolean;
    enableTakeout?: boolean;
    enableIngredientCustomization?: boolean;
    enableReceiptPrinting?: boolean;
  }) {
    return this.databaseService.updateStoreSettingsForAdmin(input);
  }

  listCategories(adminUserId: number) {
    return this.databaseService.listCategoriesForAdmin(adminUserId);
  }

  createCategory(input: { adminUserId: number; name: string; description: string | null }) {
    return this.databaseService.createCategoryForAdmin(input);
  }

  updateCategory(input: { adminUserId: number; categoryId: number; name: string; description: string | null }) {
    return this.databaseService.updateCategoryForAdmin(input);
  }

  deleteCategory(input: { adminUserId: number; categoryId: number }) {
    return this.databaseService.deleteCategoryForAdmin(input);
  }

  listProducts(adminUserId: number) {
    return this.databaseService.listProductsForAdmin(adminUserId);
  }

  createProduct(input: any) {
    return this.databaseService.createProductForAdmin(input);
  }

  updateProduct(input: any) {
    return this.databaseService.updateProductForAdmin(input);
  }

  deleteProduct(input: { adminUserId: number; productId: number }) {
    return this.databaseService.deleteProductForAdmin(input);
  }
}
