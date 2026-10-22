import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; accessCode: string }) {
    return this.authService.login(body?.email || '', body?.accessCode || '');
  }

  @Post('logout')
  logout(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '') || '';
    this.authService.logout(token);
    return { message: 'Logged out.' };
  }

  @Post('register')
  register(@Body() body: { name: string; email: string }) {
    return this.authService.register(body?.name || '', body?.email || '');
  }

  @Post('forgot-code')
  forgotCode(@Body() body: { email: string }) {
    return this.authService.forgotAccessCode(body?.email || '');
  }

  // Validate session (called by frontend on load to restore session)
  @Get('me')
  getMe(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '') || '';
    if (!token) throw new UnauthorizedException('No session token.');
    const user = this.authService.validateToken(token);
    if (!user) throw new UnauthorizedException('Session expired or invalid. Please log in again.');
    const { accessCode: _ac, ...safeUser } = user;
    return { user: safeUser };
  }
}

@Controller('api/admin')
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  private requireAdmin(auth: string): void {
    const token = (auth || '').replace('Bearer ', '');
    const user = this.authService.validateToken(token);
    if (!user || user.role !== 'admin') {
      throw new UnauthorizedException('Admin access required.');
    }
  }

  @Get('users')
  listUsers(@Headers('authorization') auth: string) {
    this.requireAdmin(auth);
    return this.authService.listUsers();
  }

  @Get('pending')
  getPending(@Headers('authorization') auth: string) {
    this.requireAdmin(auth);
    return this.authService.getPendingUsers().map(({ accessCode: _ac, ...u }) => u);
  }

  @Post('approve/:id')
  approve(@Param('id') id: string, @Headers('authorization') auth: string) {
    this.requireAdmin(auth);
    return this.authService.approveUser(id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Headers('authorization') auth: string) {
    this.requireAdmin(auth);
    return this.authService.deleteUser(id);
  }

  @Patch('users/:id/deactivate')
  deactivate(@Param('id') id: string, @Headers('authorization') auth: string) {
    this.requireAdmin(auth);
    return this.authService.deactivateUser(id);
  }

  @Patch('users/:id/reactivate')
  reactivate(@Param('id') id: string, @Headers('authorization') auth: string) {
    this.requireAdmin(auth);
    return this.authService.reactivateUser(id);
  }

  @Patch('users/:id/reset-code')
  resetCode(@Param('id') id: string, @Headers('authorization') auth: string) {
    this.requireAdmin(auth);
    return this.authService.resetAccessCode(id);
  }
}
