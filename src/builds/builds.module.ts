import { Module } from '@nestjs/common';
import { BuildsService } from './builds.service';
import { BuildsCommand } from './builds.command';
import { BuildsZipService } from './builds.zip.service';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '../authentication/authentication.module';

@Module({
  imports: [ConfigModule, AuthenticationModule],
  providers: [BuildsService, BuildsZipService, BuildsCommand]
})
export class BuildsModule { }
