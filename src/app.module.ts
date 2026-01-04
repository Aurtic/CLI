import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BuildsModule } from './builds/builds.module';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from './authentication/authentication.module';
import { GithubModule } from './github/github.module';
import path from 'node:path';

const dirname = path.join(__dirname, '../.env');
console.log(dirname);

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: dirname,
    }),
    BuildsModule,
    AuthenticationModule,
    GithubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
