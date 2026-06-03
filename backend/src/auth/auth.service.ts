import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthenticatedUser } from '../common/types';

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async login(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.databaseService.getLoginUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await this.databaseService.comparePassword(password, user.password_hash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { password_hash: _passwordHash, ...sanitizedUser } = user;

    return sanitizedUser;
  }
}
