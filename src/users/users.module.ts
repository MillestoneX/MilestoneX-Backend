import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { User } from './entities/user.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
})
export class UsersModule {}
