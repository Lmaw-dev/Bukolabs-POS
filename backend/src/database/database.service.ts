import { ConflictException, Injectable, InternalServerErrorException, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
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
      staff_type: 'POS_STAFF' | 'INVENTORY_STAFF' | null;
      password_hash: string;
      store_type: string | null;
      store_name: string | null;
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
          ${storeNameSelect}
        FROM users u
        ${storeJoin}
        WHERE LOWER(u.email) = LOWER($1)
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

    const storeJoin = userColumns.storeIdColumn && storeColumns.joinable ? `LEFT JOIN stores s ON s.id = u.${this.quoteIdentifier(userColumns.storeIdColumn)}` : '';
    const storeTypeSelect = storeColumns.storeTypeColumn ? `${this.normalizedStoreTypeSql(`s.${this.quoteIdentifier(storeColumns.storeTypeColumn)}`)} AS store_type` : 'NULL AS store_type';
    const storeNameSelect = storeColumns.storeNameColumn ? `s.${this.quoteIdentifier(storeColumns.storeNameColumn)} AS store_name` : 'NULL AS store_name';

    return this.query<{
      id: number;
      full_name: string;
      email: string;
      role: string;
      store_id: number | null;
      store_type: string | null;
      store_name: string | null;
      staff_type: 'POS_STAFF' | 'INVENTORY_STAFF' | null;
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
          ${userColumns.staffTypeColumn ? `u.${this.quoteIdentifier(userColumns.staffTypeColumn)} AS staff_type` : 'NULL AS staff_type'}
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
        staff_type: 'POS_STAFF' | 'INVENTORY_STAFF' | null;
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
          ${storeNameSelect}
        FROM users u
        ${storeJoin}
        WHERE u.${this.quoteIdentifier(userColumns.roleColumn)} = 'STAFF'
          AND u.${this.quoteIdentifier(userColumns.storeIdColumn)} = $1
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
    staffType: 'POS_STAFF' | 'INVENTORY_STAFF';
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
          $7::text AS store_name
      `,
      [input.fullName, input.email, passwordHash, admin.store_id, input.staffType, admin.store_type, admin.store_name],
    );

    return rows[0];
  }

  private async getUserStoreScope(userId: number): Promise<AuthenticatedUser> {
    const schema = await this.getSchemaColumns();
    const userColumns = this.resolveUserColumns(schema.users);
    const storeColumns = this.resolveStoreColumns(schema.stores);

    if (!userColumns.fullNameColumn || !userColumns.roleColumn) {
      throw new InternalServerErrorException('Users table is missing required columns for store scoping.');
    }

    const storeJoin = userColumns.storeIdColumn && storeColumns.joinable ? `LEFT JOIN stores s ON s.id = u.${this.quoteIdentifier(userColumns.storeIdColumn)}` : '';
    const storeTypeSelect = storeColumns.storeTypeColumn ? `${this.normalizedStoreTypeSql(`s.${this.quoteIdentifier(storeColumns.storeTypeColumn)}`)} AS store_type` : 'NULL AS store_type';
    const storeNameSelect = storeColumns.storeNameColumn ? `s.${this.quoteIdentifier(storeColumns.storeNameColumn)} AS store_name` : 'NULL AS store_name';

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
    };
  }

  private resolveStoreColumns(columns: Set<string>) {
    const pick = (candidates: string[]) => candidates.find((candidate) => columns.has(candidate.toLowerCase())) ?? null;

    return {
      joinable: columns.has('id'),
      storeTypeColumn: pick(['store_type', 'type', 'store_kind']),
      storeNameColumn: pick(['store_name', 'name']),
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
