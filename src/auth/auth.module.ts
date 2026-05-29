import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthChallengeController } from './auth-challenge.controller';
import { AuthVerifyController } from './auth-verify.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    UsersModule,
  ],
  controllers: [AuthChallengeController, AuthVerifyController],
})
export class AuthModule {}
