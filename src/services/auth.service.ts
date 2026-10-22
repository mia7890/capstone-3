import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserRole, UserStatus } from '../types/models';

// Simple in-memory session store: sessionToken -> userId
const activeSessions = new Map<string, string>();

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateAccessCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateSessionToken(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

@Injectable()
export class AuthService {
  private readonly usersPath = path.join(process.cwd(), 'data', 'users.json');

  private loadUsers(): User[] {
    const dir = path.dirname(this.usersPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.usersPath)) {
      // Seed the admin account
      const admin: User = {
        id: 'admin-001',
        name: 'Mr. Ventura',
        email: 'ventura@loopplace.ph',
        role: 'admin',
        status: 'active',
        accessCode: '000000',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
      };
      const staff1: User = {
        id: 'staff-001',
        name: 'Admin Carla',
        email: 'carla@loopplace.ph',
        role: 'staff',
        status: 'active',
        accessCode: '111111',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
      };
      const staff2: User = {
        id: 'staff-002',
        name: 'Admin Jomar',
        email: 'jomar@loopplace.ph',
        role: 'staff',
        status: 'active',
        accessCode: '222222',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.usersPath, JSON.stringify([admin, staff1, staff2], null, 2), 'utf-8');
      return [admin, staff1, staff2];
    }
    try {
      return JSON.parse(fs.readFileSync(this.usersPath, 'utf-8')) as User[];
    } catch {
      return [];
    }
  }

  private saveUsers(users: User[]): void {
    const dir = path.dirname(this.usersPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.usersPath, JSON.stringify(users, null, 2), 'utf-8');
  }

  getAllUsers(): User[] {
    return this.loadUsers();
  }

  // POST /api/auth/login  — { email, accessCode }
  login(email: string, accessCode: string): { token: string; user: Omit<User, 'accessCode'> } {
    const users = this.loadUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.accessCode === accessCode.trim(),
    );
    if (!user) throw new UnauthorizedException('Email or access code is incorrect.');
    if (user.status === 'pending') throw new UnauthorizedException('Your account is still pending admin approval.');
    if (user.status === 'deactivated') throw new UnauthorizedException('Your account has been deactivated. Contact the admin.');
    const token = generateSessionToken();
    activeSessions.set(token, user.id);
    const { accessCode: _ac, ...safeUser } = user;
    return { token, user: safeUser };
  }

  // POST /api/auth/logout — invalidate session
  logout(token: string): void {
    activeSessions.delete(token);
  }

  // POST /api/auth/register — { name, email } — creates pending account
  register(name: string, email: string): { message: string } {
    const users = this.loadUsers();
    const trimmedEmail = email.toLowerCase().trim();
    const exists = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (exists) {
      if (exists.status === 'pending') throw new BadRequestException('A registration request with this email is already pending.');
      throw new BadRequestException('An account with this email already exists.');
    }
    const newUser: User = {
      id: generateId(),
      name: name.trim(),
      email: trimmedEmail,
      role: 'staff',
      status: 'pending',
      accessCode: '',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.saveUsers(users);
    return { message: 'Registration submitted. Please wait for the admin to approve your account. You will receive your access code once approved.' };
  }

  // POST /api/auth/forgot-code — send access code to registered email
  forgotAccessCode(email: string): { message: string; accessCodePreview: string } {
    const users = this.loadUsers();
    const trimmed = (email || '').toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === trimmed);
    if (!user) {
      throw new BadRequestException('No registered account found with that email address.');
    }
    if (user.status === 'pending') {
      throw new BadRequestException('Your account is still awaiting Admin approval.');
    }
    if (user.status === 'deactivated') {
      throw new BadRequestException('Your account has been deactivated by the Admin.');
    }
    return {
      message: `Your 6-digit access code has been sent to ${user.email}.`,
      accessCodePreview: user.accessCode,
    };
  }

  // Validate session token and return user (for protected routes)
  validateToken(token: string): User | null {
    const userId = activeSessions.get(token);
    if (!userId) return null;
    const users = this.loadUsers();
    return users.find((u) => u.id === userId) || null;
  }

  // GET /api/admin/users — all users (admin only)
  listUsers(): User[] {
    return this.loadUsers();
  }

  // GET /api/admin/pending — pending registrations (admin only)
  getPendingUsers(): User[] {
    return this.loadUsers().filter((u) => u.status === 'pending');
  }

  // POST /api/admin/approve/:id — approve user, generate access code
  approveUser(userId: string): { user: User; accessCode: string; message: string } {
    const users = this.loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new BadRequestException('User not found.');
    const code = generateAccessCode();
    users[idx].status = 'active';
    users[idx].accessCode = code;
    users[idx].approvedAt = new Date().toISOString();
    this.saveUsers(users);
    // In a real system, email would be sent here
    // For demo, the code is returned in the response (admin sees it and tells the staff)
    return {
      user: users[idx],
      accessCode: code,
      message: `${users[idx].name} approved. Access code: ${code} — Share this with the staff member.`,
    };
  }

  // DELETE /api/admin/users/:id — remove user
  deleteUser(userId: string): { message: string } {
    const users = this.loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new BadRequestException('User not found.');
    if (users[idx].role === 'admin') throw new BadRequestException('Cannot delete the admin account.');
    // Invalidate their sessions
    for (const [token, uid] of activeSessions.entries()) {
      if (uid === userId) activeSessions.delete(token);
    }
    const name = users[idx].name;
    users.splice(idx, 1);
    this.saveUsers(users);
    return { message: `${name}'s account has been deleted.` };
  }

  // PATCH /api/admin/users/:id/deactivate
  deactivateUser(userId: string): { message: string } {
    const users = this.loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new BadRequestException('User not found.');
    if (users[idx].role === 'admin') throw new BadRequestException('Cannot deactivate the admin account.');
    users[idx].status = 'deactivated';
    // Invalidate sessions
    for (const [token, uid] of activeSessions.entries()) {
      if (uid === userId) activeSessions.delete(token);
    }
    this.saveUsers(users);
    return { message: `${users[idx].name}'s account has been deactivated.` };
  }

  // PATCH /api/admin/users/:id/reactivate
  reactivateUser(userId: string): { user: User; accessCode: string; message: string } {
    const users = this.loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new BadRequestException('User not found.');
    const code = generateAccessCode();
    users[idx].status = 'active';
    users[idx].accessCode = code;
    this.saveUsers(users);
    return {
      user: users[idx],
      accessCode: code,
      message: `${users[idx].name} reactivated. New access code: ${code}`,
    };
  }

  // PATCH /api/admin/users/:id/reset-code
  resetAccessCode(userId: string): { accessCode: string; message: string } {
    const users = this.loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new BadRequestException('User not found.');
    const code = generateAccessCode();
    users[idx].accessCode = code;
    this.saveUsers(users);
    return { accessCode: code, message: `New access code for ${users[idx].name}: ${code}` };
  }
}
