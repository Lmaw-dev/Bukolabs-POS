import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUser } from '../common/types';

type ColumnInfo = {
  column_name: string;
};

type SchemaColumns = {
  users: Set<string>;
  stores: Set<string>;
};

type StoreInformation = {
  id: number;
  store_id: number;
  business_name: string;
  business_description: string | null;
  address: string | null;
  contact_number: string | null;
  email: string | null;
  logo: string | null;
  receipt_thank_you_message: string | null;
  receipt_footer_message: string | null;
  operating_hours: string | null;
  currency: string | null;
  theme_color: string | null;
  tax_rate: string | number | null;
  service_charge_rate: string | number | null;
  updated_at: Date | string | null;
};

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;
  private schemaColumns: SchemaColumns | null = null;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    this.pool = connectionString
      ? new Pool({ connectionString })
      : new Pool({
          host: process.env.DB_HOST ?? 'localhost',
          port: Number(process.env.DB_PORT ?? 5432),
          user: process.env.DB_USER ?? 'postgres',
          password: process.env.DB_PASSWORD ?? '',
          database: process.env.DB_NAME ?? 'bukolabs_pos',
        });
  }

  async onModuleInit() {
    return;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const result = await this.pool.query<T>(sql, params);
      return result.rows;
    } catch (error) {
      throw new ServiceUnavailableException('PostgreSQL is not reachable or is missing credentials. Check backend/.env and database status.');
    }
  }

  async withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async queryWithClient<T extends QueryResultRow>(client: PoolClient, sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await client.query<T>(sql, params);
    return result.rows;
  }

  async getLoginUserByEmail(email: string): Promise<AuthenticatedUser & { password_hash: string } | null> {
    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);
    const storeColumns = this.resolveStoreColumns(schema.stores);

    const passwordColumn = userColumns.passwordColumn;
    const fullNameColumn = userColumns.fullNameColumn;
    const roleColumn = userColumns.roleColumn;
    const storeIdColumn = userColumns.storeIdColumn;
    const staffTypeColumn = userColumns.staffTypeColumn;

    if (!passwordColumn || !fullNameColumn || !roleColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for login.');
    }

    const storeTypeSelect = storeColumns.storeTypeColumn ? `${this.normalizedStoreTypeSql(`s.${this.quoteIdentifier(storeColumns.storeTypeColumn)}`)} AS store_type` : 'NULL AS store_type';
    const storeNameSelect = storeColumns.storeNameColumn ? `s.${this.quoteIdentifier(storeColumns.storeNameColumn)} AS store_name` : 'NULL AS store_name';
    const storeJoin = storeIdColumn && storeColumns.joinable ? `LEFT JOIN stores s ON s.id = u.${this.quoteIdentifier(storeIdColumn)}` : '';
    const storeIdSelect = storeIdColumn ? `u.${this.quoteIdentifier(storeIdColumn)} AS store_id` : 'NULL AS store_id';
    const staffTypeSelect = staffTypeColumn ? `u.${this.quoteIdentifier(staffTypeColumn)} AS staff_type` : 'NULL AS staff_type';

    const rows = await this.query<{
      id: number;
      full_name: string;
      email: string;
      role: string;
      store_id: number | null;
      staff_type: 'POS_STAFF' | null;
      password_hash: string;
      store_type: string | null;
      store_name: string | null;
      status: string | null;
    }>(
      `
        SELECT
          u.id,
          u.${this.quoteIdentifier(fullNameColumn)} AS full_name,
          u.email,
          u.${this.quoteIdentifier(roleColumn)} AS role,
          ${storeIdSelect},
          ${staffTypeSelect},
          u.${this.quoteIdentifier(passwordColumn)} AS password_hash,
          ${storeTypeSelect},
          ${storeNameSelect},
          ${userColumns.statusColumn ? `u.${this.quoteIdentifier(userColumns.statusColumn)} AS status` : `'ACTIVE' AS status`}
        FROM users u
        ${storeJoin}
        WHERE LOWER(u.email) = LOWER($1)
        ${this.activeUsersWhereClause(userColumns)}
        LIMIT 1
      `,
      [email],
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  async listAdminUsers() {
    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);
    const storeColumns = this.resolveStoreColumns(schema.stores);

    if (!userColumns.fullNameColumn || !userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for admin listing.');
    }

    const storeJoin = userColumns.storeIdColumn && storeColumns.joinable ? `LEFT JOIN stores s ON s.id = u.${this.quoteIdentifier(userColumns.storeIdColumn)} LEFT JOIN store_information si ON si.store_id = s.id` : '';
    const storeTypeSelect = storeColumns.storeTypeColumn ? `${this.normalizedStoreTypeSql(`s.${this.quoteIdentifier(storeColumns.storeTypeColumn)}`)} AS store_type` : 'NULL AS store_type';
    const storeNameSelect = storeJoin
      ? storeColumns.storeNameColumn
        ? `COALESCE(si.business_name, s.${this.quoteIdentifier(storeColumns.storeNameColumn)}) AS store_name`
        : 'si.business_name AS store_name'
      : 'NULL AS store_name';

    return this.query<{
      id: number;
      full_name: string;
      email: string;
      role: string;
      store_id: number | null;
      store_type: string | null;
      store_name: string | null;
      staff_type: 'POS_STAFF' | null;
      status: string | null;
    }>(
      `
        SELECT
          u.id,
          u.${this.quoteIdentifier(userColumns.fullNameColumn)} AS full_name,
          u.email,
          u.${this.quoteIdentifier(userColumns.roleColumn)} AS role,
          ${userColumns.storeIdColumn ? `u.${this.quoteIdentifier(userColumns.storeIdColumn)} AS store_id` : 'NULL AS store_id'},
          ${storeTypeSelect},
          ${storeNameSelect},
          ${userColumns.staffTypeColumn ? `u.${this.quoteIdentifier(userColumns.staffTypeColumn)} AS staff_type` : 'NULL AS staff_type'},
          ${userColumns.statusColumn ? `u.${this.quoteIdentifier(userColumns.statusColumn)} AS status` : `'ACTIVE' AS status`}
        FROM users u
        ${storeJoin}
        WHERE u.${this.quoteIdentifier(userColumns.roleColumn)} = 'ADMIN'
        ORDER BY u.id ASC
      `,
    );
  }

  async comparePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async createAdminAccount(input: { fullName: string; email: string; storeType: 'RESTAURANT' | 'RETAIL_STORE'; password?: string }) {
    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);
    const storeColumns = this.resolveStoreColumns(schema.stores);

    if (!userColumns.fullNameColumn || !userColumns.roleColumn || !userColumns.passwordColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for admin creation.');
    }

    if (!storeColumns.storeTypeColumn) {
      throw new InternalServerErrorException('Stores table is missing a store type column.');
    }

    const password = input.password ?? this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      return await this.withTransaction(async (client) => {
      const storeInsertColumns: string[] = [this.quoteIdentifier(storeColumns.storeTypeColumn!)];
      const storeInsertValues: unknown[] = [this.toDatabaseStoreType(input.storeType)];
      const storeInsertPlaceholders: string[] = ['$1'];

      if (storeColumns.storeNameColumn) {
        storeInsertColumns.push(this.quoteIdentifier(storeColumns.storeNameColumn));
        storeInsertValues.push(`${input.fullName}'s Store`);
        storeInsertPlaceholders.push(`$${storeInsertValues.length}`);
      }

      const storeRows = await this.queryWithClient<{ id: number }>(
        client,
        `
          INSERT INTO stores (${storeInsertColumns.join(', ')})
          VALUES (${storeInsertPlaceholders.join(', ')})
          RETURNING id
        `,
        storeInsertValues,
      );

      const storeId = storeRows[0]?.id ?? null;

      const userInsertColumns: string[] = [this.quoteIdentifier(userColumns.fullNameColumn!), 'email', this.quoteIdentifier(userColumns.roleColumn!), this.quoteIdentifier(userColumns.passwordColumn!)];
      const userInsertValues: unknown[] = [input.fullName, input.email, 'ADMIN', passwordHash];
      const userInsertPlaceholders: string[] = ['$1', '$2', '$3', '$4'];

      if (userColumns.storeIdColumn) {
        userInsertColumns.push(this.quoteIdentifier(userColumns.storeIdColumn));
        userInsertValues.push(storeId);
        userInsertPlaceholders.push(`$${userInsertValues.length}`);
      }

      if (userColumns.staffTypeColumn) {
        userInsertColumns.push(this.quoteIdentifier(userColumns.staffTypeColumn));
        userInsertValues.push(null);
        userInsertPlaceholders.push(`$${userInsertValues.length}`);
      }

      const userRows = await this.queryWithClient<{
        id: number;
        full_name: string;
        email: string;
        role: string;
        store_id: number | null;
        staff_type: 'POS_STAFF' | null;
      }>(
        client,
        `
          INSERT INTO users (${userInsertColumns.join(', ')})
          VALUES (${userInsertPlaceholders.join(', ')})
          RETURNING
            id,
            ${this.quoteIdentifier(userColumns.fullNameColumn!)} AS full_name,
            email,
            ${this.quoteIdentifier(userColumns.roleColumn!)} AS role,
            ${userColumns.storeIdColumn ? `${this.quoteIdentifier(userColumns.storeIdColumn)} AS store_id` : 'NULL AS store_id'},
            ${userColumns.staffTypeColumn ? `${this.quoteIdentifier(userColumns.staffTypeColumn)} AS staff_type` : 'NULL AS staff_type'}
        `,
        userInsertValues,
      );

      if (storeId) {
        await this.ensureStoreInformationRow(storeId, storeColumns.storeNameColumn ? `${input.fullName}'s Store` : input.fullName, client);
      }

      return {
        user: { ...userRows[0], store_type: input.storeType, store_name: storeColumns.storeNameColumn ? `${input.fullName}'s Store` : null },
        store: { id: storeId, store_type: input.storeType, store_name: storeColumns.storeNameColumn ? `${input.fullName}'s Store` : null },
        temporary_password: input.password ? null : password,
      };
      });
    } catch (error) {
      this.handleDatabaseWriteError(error, 'Unable to create admin account.');
    }
  }

  async updateAdminAccount(input: { adminUserId: number; fullName: string; email: string; storeType: 'RESTAURANT' | 'RETAIL_STORE'; password?: string }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Admin account was not found.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);
    const storeColumns = this.resolveStoreColumns(schema.stores);

    if (!userColumns.fullNameColumn || !userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for admin updates.');
    }

    const roleColumn = userColumns.roleColumn;
    const userUpdates: string[] = [`${this.quoteIdentifier(userColumns.fullNameColumn)} = $1`, 'email = $2'];
    const values: unknown[] = [input.fullName, input.email];

    if (input.password?.trim()) {
      if (!userColumns.passwordColumn) {
        throw new InternalServerErrorException('Users table is missing a password column.');
      }

      values.push(await bcrypt.hash(input.password, 10));
      userUpdates.push(`${this.quoteIdentifier(userColumns.passwordColumn)} = $${values.length}`);
    }

    try {
      await this.withTransaction(async (client) => {
        values.push(input.adminUserId);
        await this.queryWithClient(
          client,
          `
            UPDATE users
            SET ${userUpdates.join(', ')}
            WHERE id = $${values.length}
              AND ${this.quoteIdentifier(roleColumn)} = 'ADMIN'
          `,
          values,
        );

        if (storeColumns.storeTypeColumn) {
          await this.queryWithClient(
            client,
            `
              UPDATE stores
              SET ${this.quoteIdentifier(storeColumns.storeTypeColumn)} = $1
              WHERE id = $2
            `,
            [this.toDatabaseStoreType(input.storeType), admin.store_id],
          );
        }
      });

      const updated = await this.getUserStoreScope(input.adminUserId);
      return updated;
    } catch (error) {
      this.handleDatabaseWriteError(error, 'Unable to update admin account.');
    }
  }

  async deleteAdminAccount(adminUserId: number) {
    if (!Number.isFinite(adminUserId) || adminUserId <= 0) {
      throw new BadRequestException('A valid admin user id is required.');
    }

    const admin = await this.getUserStoreScope(adminUserId);

    if (admin.role !== 'ADMIN') {
      throw new NotFoundException('Admin account was not found.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);

    if (!userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for admin deletion.');
    }

    const deactivatedIds = await this.deactivateAdminAndStoreStaff(adminUserId, admin.store_id, userColumns);
    return { id: adminUserId, status: 'INACTIVE', deactivated: true, deleted: false, affected_user_ids: deactivatedIds };
  }

  async permanentlyDeleteAdminAccount(adminUserId: number) {
    if (!Number.isFinite(adminUserId) || adminUserId <= 0) {
      throw new BadRequestException('A valid admin user id is required.');
    }

    const admin = await this.getUserStoreScope(adminUserId);

    if (admin.role !== 'ADMIN') {
      throw new NotFoundException('Admin account was not found.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);

    if (!userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for admin deletion.');
    }

    try {
      const rows = await this.hardDeleteUserByRole(adminUserId, 'ADMIN', null, userColumns);

      if (rows.length === 0) {
        throw new NotFoundException('Admin account was not found.');
      }

      return { id: rows[0].id, deleted: true, deactivated: false };
    } catch (error) {
      this.handleDatabaseWriteError(error, 'Unable to delete admin account.');
    }
  }

  async activateAdminAccount(adminUserId: number) {
    if (!Number.isFinite(adminUserId) || adminUserId <= 0) {
      throw new BadRequestException('A valid admin user id is required.');
    }

    const admin = await this.getUserStoreScope(adminUserId);

    if (admin.role !== 'ADMIN') {
      throw new NotFoundException('Admin account was not found.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);

    if (!userColumns.statusColumn || !userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing required status columns.');
    }

    const activatedIds = await this.activateAdminAndStoreStaff(adminUserId, admin.store_id, userColumns);
    return { id: adminUserId, status: 'ACTIVE', activated: true, affected_user_ids: activatedIds };
  }

  async listStaffForAdmin(adminUserId: number) {
    const admin = await this.getUserStoreScope(adminUserId);

    if (!admin.store_id) {
      throw new InternalServerErrorException('Admin account is not linked to a store.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);
    const storeColumns = this.resolveStoreColumns(schema.stores);

    if (!userColumns.fullNameColumn || !userColumns.roleColumn || !userColumns.storeIdColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for staff listing.');
    }

    const storeJoin = storeColumns.joinable ? `LEFT JOIN stores s ON s.id = u.${this.quoteIdentifier(userColumns.storeIdColumn)}` : '';
    const storeTypeSelect = storeColumns.storeTypeColumn ? `${this.normalizedStoreTypeSql(`s.${this.quoteIdentifier(storeColumns.storeTypeColumn)}`)} AS store_type` : 'NULL AS store_type';
    const storeNameSelect = storeColumns.storeNameColumn ? `s.${this.quoteIdentifier(storeColumns.storeNameColumn)} AS store_name` : 'NULL AS store_name';

    return this.query<AuthenticatedUser>(
      `
        SELECT
          u.id,
          u.${this.quoteIdentifier(userColumns.fullNameColumn)} AS full_name,
          u.email,
          u.${this.quoteIdentifier(userColumns.roleColumn)} AS role,
          u.${this.quoteIdentifier(userColumns.storeIdColumn)} AS store_id,
          ${userColumns.staffTypeColumn ? `u.${this.quoteIdentifier(userColumns.staffTypeColumn)} AS staff_type` : 'NULL AS staff_type'},
          ${storeTypeSelect},
          ${storeNameSelect},
          ${userColumns.statusColumn ? `u.${this.quoteIdentifier(userColumns.statusColumn)} AS status` : `'ACTIVE' AS status`}
        FROM users u
        ${storeJoin}
        WHERE u.${this.quoteIdentifier(userColumns.roleColumn)} = 'STAFF'
          AND u.${this.quoteIdentifier(userColumns.storeIdColumn)} = $1
          ${userColumns.staffTypeColumn ? `AND u.${this.quoteIdentifier(userColumns.staffTypeColumn)} = 'POS_STAFF'` : ''}
        ORDER BY u.id ASC
      `,
      [admin.store_id],
    );
  }

  async createStaffAccount(input: {
    adminUserId: number;
    fullName: string;
    email: string;
    password: string;
    staffType: 'POS_STAFF';
  }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can create staff.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);

    if (!userColumns.fullNameColumn || !userColumns.roleColumn || !userColumns.passwordColumn || !userColumns.storeIdColumn || !userColumns.staffTypeColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for staff creation.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const rows = await this.query<AuthenticatedUser>(
      `
        INSERT INTO users (
          ${this.quoteIdentifier(userColumns.fullNameColumn)},
          email,
          ${this.quoteIdentifier(userColumns.roleColumn)},
          ${this.quoteIdentifier(userColumns.passwordColumn)},
          ${this.quoteIdentifier(userColumns.storeIdColumn)},
          ${this.quoteIdentifier(userColumns.staffTypeColumn)}
        )
        VALUES ($1, $2, 'STAFF', $3, $4, $5)
        RETURNING
          id,
          ${this.quoteIdentifier(userColumns.fullNameColumn)} AS full_name,
          email,
          ${this.quoteIdentifier(userColumns.roleColumn)} AS role,
          ${this.quoteIdentifier(userColumns.storeIdColumn)} AS store_id,
          ${this.quoteIdentifier(userColumns.staffTypeColumn)} AS staff_type,
          $6::text AS store_type,
          $7::text AS store_name,
          ${userColumns.statusColumn ? `${this.quoteIdentifier(userColumns.statusColumn)} AS status` : `'ACTIVE' AS status`}
      `,
      [input.fullName, input.email, passwordHash, admin.store_id, input.staffType, admin.store_type, admin.store_name],
    );

    return rows[0];
  }

  async updateStaffAccountForAdmin(input: {
    adminUserId: number;
    staffUserId: number;
    fullName: string;
    email: string;
    password?: string;
    staffType: 'POS_STAFF';
  }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can update staff.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);
    const storeColumns = this.resolveStoreColumns(schema.stores);

    if (!userColumns.fullNameColumn || !userColumns.roleColumn || !userColumns.storeIdColumn || !userColumns.staffTypeColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for staff updates.');
    }

    const updates: string[] = [
      `${this.quoteIdentifier(userColumns.fullNameColumn)} = $1`,
      `email = $2`,
      `${this.quoteIdentifier(userColumns.staffTypeColumn)} = $3`,
    ];
    const values: unknown[] = [input.fullName, input.email, input.staffType];

    if (input.password?.trim()) {
      if (!userColumns.passwordColumn) {
        throw new InternalServerErrorException('Users table is missing a password column.');
      }

      values.push(await bcrypt.hash(input.password, 10));
      updates.push(`${this.quoteIdentifier(userColumns.passwordColumn)} = $${values.length}`);
    }

    values.push(input.staffUserId, admin.store_id);
    const staffIdParam = `$${values.length - 1}`;
    const storeIdParam = `$${values.length}`;

    try {
      const storeJoin = storeColumns.joinable ? `LEFT JOIN stores s ON s.id = u.${this.quoteIdentifier(userColumns.storeIdColumn)}` : '';
      const storeTypeSelect = storeColumns.storeTypeColumn ? `${this.normalizedStoreTypeSql(`s.${this.quoteIdentifier(storeColumns.storeTypeColumn)}`)} AS store_type` : 'NULL AS store_type';
      const storeNameSelect = storeColumns.storeNameColumn ? `s.${this.quoteIdentifier(storeColumns.storeNameColumn)} AS store_name` : 'NULL AS store_name';

      const rows = await this.query<AuthenticatedUser>(
        `
          WITH updated AS (
            UPDATE users
            SET ${updates.join(', ')}
            WHERE id = ${staffIdParam}
              AND ${this.quoteIdentifier(userColumns.roleColumn)} = 'STAFF'
              AND ${this.quoteIdentifier(userColumns.storeIdColumn)} = ${storeIdParam}
            RETURNING *
          )
          SELECT
            u.id,
            u.${this.quoteIdentifier(userColumns.fullNameColumn)} AS full_name,
            u.email,
            u.${this.quoteIdentifier(userColumns.roleColumn)} AS role,
            u.${this.quoteIdentifier(userColumns.storeIdColumn)} AS store_id,
            u.${this.quoteIdentifier(userColumns.staffTypeColumn)} AS staff_type,
            ${storeTypeSelect},
            ${storeNameSelect},
            ${userColumns.statusColumn ? `u.${this.quoteIdentifier(userColumns.statusColumn)} AS status` : `'ACTIVE' AS status`}
          FROM updated u
          ${storeJoin}
          LIMIT 1
        `,
        values,
      );

      if (rows.length === 0) {
        throw new InternalServerErrorException('Staff account was not found for this store.');
      }

      return rows[0];
    } catch (error) {
      this.handleDatabaseWriteError(error, 'Unable to update staff account.');
    }
  }

  async deleteStaffAccountForAdmin(input: { adminUserId: number; staffUserId: number }) {
    if (!Number.isFinite(input.adminUserId) || input.adminUserId <= 0) {
      throw new BadRequestException('A valid admin_user_id is required.');
    }

    if (!Number.isFinite(input.staffUserId) || input.staffUserId <= 0) {
      throw new BadRequestException('A valid staff user id is required.');
    }

    if (input.adminUserId === input.staffUserId) {
      throw new ForbiddenException('You cannot remove your own account from this screen.');
    }

    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new ForbiddenException('Only store admin accounts can remove staff for their store.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);

    if (!userColumns.roleColumn || !userColumns.storeIdColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for staff deletion.');
    }

    if (userColumns.statusColumn) {
      const rows = await this.deactivateStaffForStore(input.staffUserId, admin.store_id, userColumns);

      if (rows.length === 0) {
        throw new NotFoundException('Staff account was not found for this store.');
      }

      return { id: rows[0].id, status: 'INACTIVE', deactivated: true, deleted: false };
    }

    try {
      const rows = await this.hardDeleteUserByRole(input.staffUserId, 'STAFF', admin.store_id, userColumns);

      if (rows.length === 0) {
        throw new NotFoundException('Staff account was not found for this store.');
      }

      return { id: rows[0].id, deleted: true, deactivated: false };
    } catch (error) {
      this.handleDatabaseWriteError(error, 'Unable to remove staff account.');
    }
  }

  async permanentlyDeleteStaffAccountForAdmin(input: { adminUserId: number; staffUserId: number }) {
    if (!Number.isFinite(input.adminUserId) || input.adminUserId <= 0) {
      throw new BadRequestException('A valid admin_user_id is required.');
    }

    if (!Number.isFinite(input.staffUserId) || input.staffUserId <= 0) {
      throw new BadRequestException('A valid staff user id is required.');
    }

    if (input.adminUserId === input.staffUserId) {
      throw new ForbiddenException('You cannot remove your own account from this screen.');
    }

    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new ForbiddenException('Only store admin accounts can remove staff for their store.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);

    if (!userColumns.roleColumn || !userColumns.storeIdColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for staff deletion.');
    }

    try {
      const rows = await this.hardDeleteUserByRole(input.staffUserId, 'STAFF', admin.store_id, userColumns);

      if (rows.length === 0) {
        throw new NotFoundException('Staff account was not found for this store.');
      }

      return { id: rows[0].id, deleted: true, deactivated: false };
    } catch (error) {
      this.handleDatabaseWriteError(error, 'Unable to delete staff account.');
    }
  }

  async activateStaffAccountForAdmin(input: { adminUserId: number; staffUserId: number }) {
    if (!Number.isFinite(input.adminUserId) || input.adminUserId <= 0) {
      throw new BadRequestException('A valid admin_user_id is required.');
    }

    if (!Number.isFinite(input.staffUserId) || input.staffUserId <= 0) {
      throw new BadRequestException('A valid staff user id is required.');
    }

    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new ForbiddenException('Only store admin accounts can activate staff for their store.');
    }

    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);

    if (!userColumns.statusColumn || !userColumns.roleColumn || !userColumns.storeIdColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for staff activation.');
    }

    const rows = await this.activateStaffForStore(input.staffUserId, admin.store_id, userColumns);

    if (rows.length === 0) {
      throw new NotFoundException('Staff account was not found for this store.');
    }

    return { id: rows[0].id, status: 'ACTIVE', activated: true };
  }

  async getStoreInformationForAdmin(adminUserId: number): Promise<StoreInformation> {
    const user = await this.getUserStoreScope(adminUserId);

    if (!['ADMIN', 'STAFF'].includes(String(user.role)) || !user.store_id) {
      throw new InternalServerErrorException('Only store users can view store information.');
    }

    await this.ensureStoreInformationRow(user.store_id, user.store_name);

    const rows = await this.query<StoreInformation>(
      `
        SELECT
          id,
          store_id,
          business_name,
          business_description,
          address,
          contact_number,
          email,
          logo,
          receipt_thank_you_message,
          receipt_footer_message,
          operating_hours,
          currency,
          theme_color,
          tax_rate,
          service_charge_rate,
          updated_at
        FROM store_information
        WHERE store_id = $1
        LIMIT 1
      `,
      [user.store_id],
    );

    if (rows.length === 0) {
      throw new InternalServerErrorException('Store information was not found.');
    }

    return rows[0];
  }

  async updateStoreInformationForAdmin(input: {
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
  }): Promise<StoreInformation> {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can update store information.');
    }

    await this.ensureStoreInformationRow(admin.store_id, admin.store_name);

    const rows = await this.query<StoreInformation>(
      `
        UPDATE store_information
        SET
          business_name = $1,
          business_description = $2,
          address = $3,
          contact_number = $4,
          email = $5,
          logo = $6,
          receipt_thank_you_message = $7,
          receipt_footer_message = $8,
          operating_hours = $9,
          currency = $10,
          theme_color = $11,
          tax_rate = $12,
          service_charge_rate = $13,
          updated_at = CURRENT_TIMESTAMP
        WHERE store_id = $14
        RETURNING
          id,
          store_id,
          business_name,
          business_description,
          address,
          contact_number,
          email,
          logo,
          receipt_thank_you_message,
          receipt_footer_message,
          operating_hours,
          currency,
          theme_color,
          tax_rate,
          service_charge_rate,
          updated_at
      `,
      [
        input.businessName,
        input.businessDescription,
        input.address,
        input.contactNumber,
        input.email,
        input.logo,
        input.receiptThankYouMessage,
        input.receiptFooterMessage,
        input.operatingHours,
        input.currency,
        input.themeColor,
        input.taxRate,
        input.serviceChargeRate,
        admin.store_id,
      ],
    );

    return rows[0];
  }

  async getStoreSettingsForAdmin(adminUserId: number) {
    const admin = await this.getUserStoreScope(adminUserId);

    if (!admin.store_id) {
      throw new InternalServerErrorException('Only store-linked accounts can view store settings.');
    }

    await this.ensureStoreSettingsRow(admin.store_id, admin.store_type);

    const rows = await this.query(
      `
        SELECT *
        FROM store_settings
        WHERE store_id = $1
          AND (store_type = $2 OR store_type IS NULL)
        LIMIT 1
      `,
      [admin.store_id, admin.store_type],
    );

    return rows[0];
  }

  async updateStoreSettingsForAdmin(input: {
    adminUserId: number;
    enableCustomerRecommendation?: boolean;
    enableTableManagement?: boolean;
    enableRefund?: boolean;
    enableVoid?: boolean;
    enableDiscount?: boolean;
    enableServiceCharge?: boolean;
    serviceChargeRate?: number;
    enableTax?: boolean;
    taxRate?: number;
    enableDineIn?: boolean;
    enableTakeout?: boolean;
    enableIngredientCustomization?: boolean;
    enableReceiptPrinting?: boolean;
  }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can update store settings.');
    }

    await this.ensureStoreSettingsRow(admin.store_id, admin.store_type);

    const rows = await this.query(
      `
        UPDATE store_settings
        SET
          enable_customer_recommendation = COALESCE($1, enable_customer_recommendation),
          enable_table_management = COALESCE($2, enable_table_management),
          enable_refund = COALESCE($3, enable_refund),
          enable_void = COALESCE($4, enable_void),
          enable_discount = COALESCE($5, enable_discount),
          enable_service_charge = COALESCE($6, enable_service_charge),
          service_charge_rate = COALESCE($7, service_charge_rate),
          service_charge_percentage = COALESCE($7, service_charge_percentage),
          enable_tax = COALESCE($8, enable_tax),
          tax_rate = COALESCE($9, tax_rate),
          enable_dine_in = COALESCE($10, enable_dine_in),
          enable_takeout = COALESCE($11, enable_takeout),
          enable_ingredient_customization = COALESCE($12, enable_ingredient_customization),
          enable_receipt_printing = COALESCE($13, enable_receipt_printing),
          store_type = COALESCE(store_type, $14),
          updated_at = CURRENT_TIMESTAMP
        WHERE store_id = $15
          AND (store_type = $14 OR store_type IS NULL)
        RETURNING *
      `,
      [
        input.enableCustomerRecommendation,
        input.enableTableManagement,
        input.enableRefund,
        input.enableVoid,
        input.enableDiscount,
        input.enableServiceCharge,
        input.serviceChargeRate,
        input.enableTax,
        input.taxRate,
        input.enableDineIn,
        input.enableTakeout,
        input.enableIngredientCustomization,
        input.enableReceiptPrinting,
        admin.store_type,
        admin.store_id,
      ],
    );

    return rows[0];
  }

  async listDiscountSettingsForAdmin(adminUserId: number) {
    const admin = await this.getUserStoreScope(adminUserId);

    if (!admin.store_id) {
      throw new InternalServerErrorException('Only store-linked accounts can view discount settings.');
    }

    await this.ensureDefaultDiscountSettings(admin.store_id);

    return this.query(
      `
        SELECT id, store_id, discount_name, discount_rate, is_enabled, created_at, updated_at
        FROM discount_settings
        WHERE store_id = $1
        ORDER BY id ASC
      `,
      [admin.store_id],
    );
  }

  async createDiscountSettingForAdmin(input: { adminUserId: number; discountName: string; discountRate: number; isEnabled: boolean }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can create discount settings.');
    }

    const rows = await this.query(
      `
        INSERT INTO discount_settings (store_id, discount_name, discount_rate, is_enabled)
        VALUES ($1, $2, $3, $4)
        RETURNING id, store_id, discount_name, discount_rate, is_enabled, created_at, updated_at
      `,
      [admin.store_id, input.discountName, input.discountRate, input.isEnabled],
    );

    return rows[0];
  }

  async updateDiscountSettingForAdmin(input: { adminUserId: number; discountId: number; discountName: string; discountRate: number; isEnabled: boolean }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can update discount settings.');
    }

    const rows = await this.query(
      `
        UPDATE discount_settings
        SET discount_name = $1,
            discount_rate = $2,
            is_enabled = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
          AND store_id = $5
        RETURNING id, store_id, discount_name, discount_rate, is_enabled, created_at, updated_at
      `,
      [input.discountName, input.discountRate, input.isEnabled, input.discountId, admin.store_id],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Discount setting was not found for this store.');
    }

    return rows[0];
  }

  async deleteDiscountSettingForAdmin(input: { adminUserId: number; discountId: number }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can delete discount settings.');
    }

    const rows = await this.query(
      `
        DELETE FROM discount_settings
        WHERE id = $1
          AND store_id = $2
        RETURNING id
      `,
      [input.discountId, admin.store_id],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Discount setting was not found for this store.');
    }

    return { id: input.discountId };
  }

  async listCategoriesForAdmin(adminUserId: number) {
    const admin = await this.getUserStoreScope(adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can view categories.');
    }

    return this.query(
      `
        SELECT id, store_id, store_type, name, description, created_at, updated_at
        FROM product_categories
        WHERE store_id = $1
          AND store_type = $2
        ORDER BY name ASC
      `,
      [admin.store_id, admin.store_type],
    );
  }

  async createCategoryForAdmin(input: { adminUserId: number; name: string; description: string | null }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id || !admin.store_type) {
      throw new InternalServerErrorException('Only store admin accounts can create categories.');
    }

    const rows = await this.query(
      `
        INSERT INTO product_categories (store_id, store_type, name, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id, store_id, store_type, name, description, created_at, updated_at
      `,
      [admin.store_id, admin.store_type, input.name, input.description],
    );

    return rows[0];
  }

  async updateCategoryForAdmin(input: { adminUserId: number; categoryId: number; name: string; description: string | null }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can update categories.');
    }

    const rows = await this.query(
      `
        UPDATE product_categories
        SET name = $1,
            description = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND store_id = $4
        RETURNING id, store_id, store_type, name, description, created_at, updated_at
      `,
      [input.name, input.description, input.categoryId, admin.store_id],
    );

    if (rows.length === 0) {
      throw new InternalServerErrorException('Category was not found for this store.');
    }

    return rows[0];
  }

  async deleteCategoryForAdmin(input: { adminUserId: number; categoryId: number }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can delete categories.');
    }

    const rows = await this.query<{ id: number }>(
      `
        DELETE FROM product_categories
        WHERE id = $1
          AND store_id = $2
        RETURNING id
      `,
      [input.categoryId, admin.store_id],
    );

    return { id: rows[0]?.id ?? input.categoryId, deleted: rows.length > 0 };
  }

  async listProductsForAdmin(adminUserId: number) {
    const admin = await this.getUserStoreScope(adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can view products.');
    }

    return this.query(
      `
        SELECT
          p.*,
          c.name AS category_name
        FROM products p
        LEFT JOIN product_categories c ON c.id = p.category_id
        WHERE p.store_id = $1
          AND p.store_type = $2
        ORDER BY p.created_at DESC
      `,
      [admin.store_id, admin.store_type],
    );
  }

  async createProductForAdmin(input: any) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id || !admin.store_type) {
      throw new InternalServerErrorException('Only store admin accounts can create products.');
    }

    const rows = await this.query(
      `
        INSERT INTO products (
          store_id, category_id, store_type, name, description, price, image_url,
          meal_type, preparation_time_minutes, sku, barcode, unit, size, color,
          stock_quantity, low_stock_limit, is_available
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, COALESCE($17, TRUE))
        RETURNING *
      `,
      [
        admin.store_id,
        input.categoryId,
        admin.store_type,
        input.name,
        input.description ?? null,
        input.price,
        input.image_url ?? null,
        input.meal_type ?? null,
        input.preparation_time_minutes ?? null,
        input.sku ?? null,
        input.barcode ?? null,
        input.unit ?? null,
        input.size ?? null,
        input.color ?? null,
        input.stock_quantity ?? 0,
        input.low_stock_limit ?? 5,
        input.is_available,
      ],
    );

    return rows[0];
  }

  async updateProductForAdmin(input: any) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can update products.');
    }

    const rows = await this.query(
      `
        UPDATE products
        SET
          category_id = $1,
          name = $2,
          description = $3,
          price = $4,
          image_url = $5,
          meal_type = $6,
          preparation_time_minutes = $7,
          sku = $8,
          barcode = $9,
          unit = $10,
          size = $11,
          color = $12,
          stock_quantity = $13,
          low_stock_limit = $14,
          is_available = COALESCE($15, is_available),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $16
          AND store_id = $17
        RETURNING *
      `,
      [
        input.categoryId,
        input.name,
        input.description ?? null,
        input.price,
        input.image_url ?? null,
        input.meal_type ?? null,
        input.preparation_time_minutes ?? null,
        input.sku ?? null,
        input.barcode ?? null,
        input.unit ?? null,
        input.size ?? null,
        input.color ?? null,
        input.stock_quantity ?? 0,
        input.low_stock_limit ?? 5,
        input.is_available,
        input.productId,
        admin.store_id,
      ],
    );

    if (rows.length === 0) {
      throw new InternalServerErrorException('Product was not found for this store.');
    }

    return rows[0];
  }

  async deleteProductForAdmin(input: { adminUserId: number; productId: number }) {
    const admin = await this.getUserStoreScope(input.adminUserId);

    if (admin.role !== 'ADMIN' || !admin.store_id) {
      throw new InternalServerErrorException('Only store admin accounts can delete products.');
    }

    const rows = await this.query<{ id: number }>(
      `
        DELETE FROM products
        WHERE id = $1
          AND store_id = $2
        RETURNING id
      `,
      [input.productId, admin.store_id],
    );

    return { id: rows[0]?.id ?? input.productId, deleted: rows.length > 0 };
  }

  private async ensureStoreInformationRow(storeId: number, fallbackStoreName: string | null, client?: PoolClient) {
    const sql = `
      INSERT INTO store_information (
        store_id,
        business_name,
        business_description,
        address,
        contact_number,
        email,
        receipt_thank_you_message,
        receipt_footer_message,
        operating_hours,
        currency,
        theme_color,
        tax_rate,
        service_charge_rate
      )
      SELECT
        $1,
        $2,
        'Your one-stop shop for quality ukay-ukay finds! We offer affordable and stylish pre-loved items for the whole family.',
        '123 Sampaguita St., Barangay Guadalupe, Cebu City, Cebu, Philippines',
        '0917 123 4567',
        'ukayhub.main@gmail.com',
        'Thank you for shopping with us!',
        'We appreciate your support. Come again!',
        'Mon-Sun, 9:00 AM - 8:00 PM',
        'PHP',
        '#008967',
        0,
        0
      WHERE NOT EXISTS (
        SELECT 1 FROM store_information WHERE store_id = $1
      )
    `;
    const params = [storeId, fallbackStoreName ?? 'Ukay Hub - Main Branch'];

    if (client) {
      await this.queryWithClient(client, sql, params);
      return;
    }

    await this.query(
      `
        ${sql}
      `,
      params,
    );
  }

  private async ensureStoreSettingsRow(storeId: number, storeType: string | null) {
    await this.query(
      `
        INSERT INTO store_settings (
          store_id,
          store_type,
          enable_customer_recommendation,
          enable_table_management,
          enable_refund,
          enable_void,
          enable_discount,
          enable_service_charge,
          service_charge_rate,
          service_charge_percentage,
          enable_tax,
          tax_rate,
          enable_dine_in,
          enable_takeout,
          enable_ingredient_customization,
          enable_receipt_printing
        )
        VALUES ($1, $2, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 0, 0, TRUE, 0, TRUE, TRUE, TRUE, TRUE)
        ON CONFLICT (store_id) DO UPDATE
        SET store_type = COALESCE(store_settings.store_type, EXCLUDED.store_type),
            service_charge_rate = COALESCE(store_settings.service_charge_rate, store_settings.service_charge_percentage, 0),
            service_charge_percentage = COALESCE(store_settings.service_charge_percentage, store_settings.service_charge_rate, 0),
            updated_at = CURRENT_TIMESTAMP
      `,
      [storeId, storeType],
    );
  }

  private async ensureDefaultDiscountSettings(storeId: number) {
    await this.query(
      `
        INSERT INTO discount_settings (store_id, discount_name, discount_rate, is_enabled)
        SELECT $1, seed.discount_name, seed.discount_rate, TRUE
        FROM (
          VALUES
            ('PWD', 20),
            ('Senior Citizen', 20),
            ('Promo Discount', 10),
            ('Custom Discount', 0)
        ) AS seed(discount_name, discount_rate)
        WHERE NOT EXISTS (
          SELECT 1
          FROM discount_settings ds
          WHERE ds.store_id = $1
        )
      `,
      [storeId],
    );
  }

  private async getUserStoreScope(userId: number): Promise<AuthenticatedUser> {
    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);
    const storeColumns = this.resolveStoreColumns(schema.stores);

    if (!userColumns.fullNameColumn || !userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for store scoping.');
    }

    const storeJoin = userColumns.storeIdColumn && storeColumns.joinable ? `LEFT JOIN stores s ON s.id = u.${this.quoteIdentifier(userColumns.storeIdColumn)} LEFT JOIN store_information si ON si.store_id = s.id` : '';
    const storeTypeSelect = storeColumns.storeTypeColumn ? `${this.normalizedStoreTypeSql(`s.${this.quoteIdentifier(storeColumns.storeTypeColumn)}`)} AS store_type` : 'NULL AS store_type';
    const storeNameSelect = storeJoin
      ? storeColumns.storeNameColumn
        ? `COALESCE(si.business_name, s.${this.quoteIdentifier(storeColumns.storeNameColumn)}) AS store_name`
        : 'si.business_name AS store_name'
      : 'NULL AS store_name';

    const rows = await this.query<AuthenticatedUser>(
      `
        SELECT
          u.id,
          u.${this.quoteIdentifier(userColumns.fullNameColumn)} AS full_name,
          u.email,
          u.${this.quoteIdentifier(userColumns.roleColumn)} AS role,
          ${userColumns.storeIdColumn ? `u.${this.quoteIdentifier(userColumns.storeIdColumn)} AS store_id` : 'NULL AS store_id'},
          ${userColumns.staffTypeColumn ? `u.${this.quoteIdentifier(userColumns.staffTypeColumn)} AS staff_type` : 'NULL AS staff_type'},
          ${storeTypeSelect},
          ${storeNameSelect}
        FROM users u
        ${storeJoin}
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId],
    );

    if (rows.length === 0) {
      throw new InternalServerErrorException('User account was not found.');
    }

    return rows[0];
  }

  private async getSchemaColumns(): Promise<SchemaColumns> {
    if (this.schemaColumns) {
      return this.schemaColumns;
    }

    const [users, stores] = await Promise.all([
      this.query<ColumnInfo>(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`),
      this.query<ColumnInfo>(`SELECT column_name FROM information_schema.columns WHERE table_name = 'stores'`),
    ]);

    this.schemaColumns = {
      users: new Set(users.map((column) => column.column_name.toLowerCase())),
      stores: new Set(stores.map((column) => column.column_name.toLowerCase())),
    };

    return this.schemaColumns;
  }

  private resolveUserColumns(columns: Set<string>) {
    const pick = (candidates: string[]) => candidates.find((candidate) => columns.has(candidate.toLowerCase())) ?? null;

    return {
      fullNameColumn: pick(['full_name', 'fullname', 'name']),
      roleColumn: pick(['role']),
      storeIdColumn: pick(['store_id']),
      staffTypeColumn: pick(['staff_type']),
      passwordColumn: pick(['hashed_password', 'password_hash', 'password']),
      statusColumn: pick(['status']),
    };
  }

  private activeUsersWhereClause(userColumns: { statusColumn: string | null }, alias = 'u') {
    if (!userColumns.statusColumn) {
      return '';
    }

    return ` AND COALESCE(${alias}.${this.quoteIdentifier(userColumns.statusColumn)}, 'ACTIVE') = 'ACTIVE'`;
  }

  private async deactivateAdminAndStoreStaff(
    adminUserId: number,
    storeId: number | null,
    userColumns: ReturnType<DatabaseService['resolveUserColumns']>,
  ) {
    if (!userColumns.statusColumn || !userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing required status columns.');
    }

    const statusColumn = this.quoteIdentifier(userColumns.statusColumn);
    const roleColumn = this.quoteIdentifier(userColumns.roleColumn);

    if (storeId && userColumns.storeIdColumn) {
      const storeIdColumn = this.quoteIdentifier(userColumns.storeIdColumn);
      const rows = await this.query<{ id: number }>(
        `
          UPDATE users
          SET ${statusColumn} = 'INACTIVE'
          WHERE (
            (id = $1 AND ${roleColumn} = 'ADMIN')
            OR (${roleColumn} = 'STAFF' AND ${storeIdColumn} = $2)
          )
          RETURNING id
        `,
        [adminUserId, storeId],
      );

      if (!rows.some((row) => Number(row.id) === adminUserId)) {
        throw new NotFoundException('Admin account was not found.');
      }

      return rows.map((row) => row.id);
    }

    const rows = await this.query<{ id: number }>(
      `
        UPDATE users
        SET ${statusColumn} = 'INACTIVE'
        WHERE id = $1
          AND ${roleColumn} = 'ADMIN'
        RETURNING id
      `,
      [adminUserId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Admin account was not found.');
    }

    return rows.map((row) => row.id);
  }

  private async activateAdminAndStoreStaff(
    adminUserId: number,
    storeId: number | null,
    userColumns: ReturnType<DatabaseService['resolveUserColumns']>,
  ) {
    if (!userColumns.statusColumn || !userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing required status columns.');
    }

    const statusColumn = this.quoteIdentifier(userColumns.statusColumn);
    const roleColumn = this.quoteIdentifier(userColumns.roleColumn);

    if (storeId && userColumns.storeIdColumn) {
      const storeIdColumn = this.quoteIdentifier(userColumns.storeIdColumn);
      const rows = await this.query<{ id: number }>(
        `
          UPDATE users
          SET ${statusColumn} = 'ACTIVE'
          WHERE (
            (id = $1 AND ${roleColumn} = 'ADMIN')
            OR (${roleColumn} = 'STAFF' AND ${storeIdColumn} = $2)
          )
          RETURNING id
        `,
        [adminUserId, storeId],
      );

      if (!rows.some((row) => Number(row.id) === adminUserId)) {
        throw new NotFoundException('Admin account was not found.');
      }

      return rows.map((row) => row.id);
    }

    const rows = await this.query<{ id: number }>(
      `
        UPDATE users
        SET ${statusColumn} = 'ACTIVE'
        WHERE id = $1
          AND ${roleColumn} = 'ADMIN'
        RETURNING id
      `,
      [adminUserId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Admin account was not found.');
    }

    return rows.map((row) => row.id);
  }

  private async deactivateStaffForStore(
    staffUserId: number,
    storeId: number,
    userColumns: ReturnType<DatabaseService['resolveUserColumns']>,
  ) {
    if (!userColumns.statusColumn || !userColumns.roleColumn || !userColumns.storeIdColumn) {
      return [];
    }

    const statusColumn = this.quoteIdentifier(userColumns.statusColumn);
    const roleColumn = this.quoteIdentifier(userColumns.roleColumn);
    const storeIdColumn = this.quoteIdentifier(userColumns.storeIdColumn);

    return this.query<{ id: number }>(
      `
        UPDATE users
        SET ${statusColumn} = 'INACTIVE'
        WHERE id = $1
          AND ${roleColumn} = 'STAFF'
          AND ${storeIdColumn} = $2
        RETURNING id
      `,
      [staffUserId, storeId],
    );
  }

  private async activateStaffForStore(
    staffUserId: number,
    storeId: number,
    userColumns: ReturnType<DatabaseService['resolveUserColumns']>,
  ) {
    if (!userColumns.statusColumn || !userColumns.roleColumn || !userColumns.storeIdColumn) {
      return [];
    }

    const statusColumn = this.quoteIdentifier(userColumns.statusColumn);
    const roleColumn = this.quoteIdentifier(userColumns.roleColumn);
    const storeIdColumn = this.quoteIdentifier(userColumns.storeIdColumn);

    return this.query<{ id: number }>(
      `
        UPDATE users
        SET ${statusColumn} = 'ACTIVE'
        WHERE id = $1
          AND ${roleColumn} = 'STAFF'
          AND ${storeIdColumn} = $2
        RETURNING id
      `,
      [staffUserId, storeId],
    );
  }

  private async hardDeleteUserByRole(
    userId: number,
    role: 'ADMIN' | 'STAFF',
    storeId: number | null,
    userColumns: ReturnType<DatabaseService['resolveUserColumns']>,
  ) {
    if (!userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing a role column.');
    }

    const roleColumn = this.quoteIdentifier(userColumns.roleColumn);
    const conditions = [`id = $1`, `${roleColumn} = $2`];
    const params: unknown[] = [userId, role];

    if (role === 'STAFF') {
      if (!userColumns.storeIdColumn || storeId === null) {
        throw new InternalServerErrorException('Staff deletion requires a store scope.');
      }

      conditions.push(`${this.quoteIdentifier(userColumns.storeIdColumn)} = $3`);
      params.push(storeId);
    }

    try {
      return await this.query<{ id: number }>(
        `
          DELETE FROM users
          WHERE ${conditions.join(' AND ')}
          RETURNING id
        `,
        params,
      );
    } catch (error) {
      this.handleDatabaseWriteError(error, 'Unable to remove user account.');
    }
  }

  private resolveStoreColumns(columns: Set<string>) {
    const pick = (candidates: string[]) => candidates.find((candidate) => columns.has(candidate.toLowerCase())) ?? null;

    return {
      joinable: columns.has('id'),
      storeTypeColumn: pick(['store_type', 'type', 'store_kind']),
      storeNameColumn: pick(['store_name', 'name']),
      storeDescriptionColumn: pick(['store_description', 'description']),
      logoUrlColumn: pick(['logo_url', 'store_logo_url']),
      contactNumberColumn: pick(['contact_number', 'phone_number', 'phone']),
      emailAddressColumn: pick(['email_address', 'store_email', 'email']),
      addressColumn: pick(['address', 'store_address']),
      updatedAtColumn: pick(['updated_at']),
    };
  }

  private quoteIdentifier(identifier: string) {
    return `"${identifier.replaceAll('"', '""')}"`;
  }

  private toDatabaseStoreType(storeType: 'RESTAURANT' | 'RETAIL_STORE') {
    return storeType === 'RETAIL_STORE' ? 'RETAIL' : storeType;
  }

  private normalizedStoreTypeSql(expression: string) {
    return `CASE WHEN ${expression} = 'RETAIL' THEN 'RETAIL_STORE' ELSE ${expression} END`;
  }

  private handleDatabaseWriteError(error: unknown, fallbackMessage: string): never {
    const databaseError = error as { code?: string; detail?: string; message?: string };

    if (databaseError.code === '23503') {
      throw new ConflictException(
        'This account is linked to other records and cannot be permanently deleted. Run backend/sql/add-user-is-active.sql to enable deactivation instead.',
      );
    }

    if (databaseError.code === '23505') {
      throw new ConflictException(databaseError.detail ?? 'A record with the same unique value already exists.');
    }

    if (databaseError.code === '23514') {
      throw new InternalServerErrorException(databaseError.detail ?? databaseError.message ?? fallbackMessage);
    }

    if (databaseError.code === '23502') {
      throw new InternalServerErrorException(databaseError.detail ?? databaseError.message ?? fallbackMessage);
    }

    throw error;
  }

  private generateTemporaryPassword() {
    return Math.random().toString(36).slice(-10);
  }
}

