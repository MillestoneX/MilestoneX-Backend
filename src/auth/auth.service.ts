import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthResponse, JwtPayload } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private users: any[] = []; // In-memory storage for demo purposes

  constructor(private jwtService: JwtService) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = this.users.find(user => user.email === registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = {
      id: Date.now().toString(),
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      walletAddress: registerDto.walletAddress,
    };

    this.users.push(user);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        walletAddress: user.walletAddress,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = this.users.find(user => user.email === loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        walletAddress: user.walletAddress,
      },
    };
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    return this.users.find(user => user.id === payload.sub);
  }
}