import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationCommand } from './authentication.command';
import { GithubModule } from 'src/github/github.module';
import { AuthenticationGithubCommand } from './authentication.github.command';

@Module({
  imports: [ConfigModule, GithubModule],
  providers: [
    AuthenticationService, AuthenticationCommand, AuthenticationGithubCommand
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule { }
