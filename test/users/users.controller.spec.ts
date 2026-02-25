import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { AuthService } from '../../src/auth/auth.service';
import { UpdateUserDto } from '../../src/users/dtos/update-user.dto';
import { ChangePasswordDto } from '../../src/users/dtos/change