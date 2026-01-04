import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationCommand } from './authentication.command';

@Module({
  imports: [ConfigModule],
  providers: [AuthenticationService, AuthenticationCommand],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
