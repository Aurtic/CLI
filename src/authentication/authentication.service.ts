import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

@Injectable()
export class AuthenticationService implements OnModuleInit {
    constructor(private readonly configService: ConfigService) { }

    async onModuleInit() {
        await ConfigModule.envVariablesLoaded;

        const configFilePath = this.getConfigFilePath();
        if (!fs.existsSync(configFilePath)) {
            return;
        }
        const configFileContent = fs.readFileSync(configFilePath, 'utf8');
        const configFile = JSON.parse(configFileContent);

        this.configService.set('ACCESS_TOKEN', configFile.access_token);
        this.configService.set('TENANT_ID', configFile.tenant_id || undefined);
    }

    getConfigFilePath(): string {
        return path.join(os.homedir(), '/.aurtic-cli-v2-config.yaml');
    }

    async getAccessTokenByUsernameAndPassword(username: string, password: string): Promise<string> {
        const response = await fetch(`${this.configService.get('API_URI')}/v1/oauth/token`, {
            method: 'POST',
            body: new URLSearchParams({
                username: username,
                password: password,
                grant_type: 'password',
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }

        const accessToken = data.access_token;

        const configFilePath = this.getConfigFilePath();
        fs.writeFileSync(configFilePath, JSON.stringify(data, null, 2));

        return accessToken;
    }

    async setTenantId(tenantId: string) {
        const request = await fetch(`${this.configService.get('API_URI')}/v1/tenants/${tenantId}`, {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${await this.getAccessToken()}`,
                'x-tenant-id': tenantId,
            },
        });

        const data = await request.json();
        if (!request.ok) {
            throw new Error(data.message);
        }

        const configFilePath = this.getConfigFilePath();
        const configFileContent = fs.readFileSync(configFilePath, 'utf8');
        const configFile = JSON.parse(configFileContent);
        configFile.tenant_id = tenantId;
        fs.writeFileSync(configFilePath, JSON.stringify(configFile, null, 2));

    }

    async getAccessTokenByGithub(githubToken: string): Promise<string> {
        const response = await fetch(`${this.configService.get('API_URI')}/v1/oauth/token`, {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'password',
                code: `github:${githubToken}`,
                username: 'github_actions',
                password: githubToken,
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }

        const accessToken = data.access_token;

        const configFilePath = this.getConfigFilePath();
        fs.writeFileSync(configFilePath, JSON.stringify(data, null, 2));

        return accessToken;
    }

    async getAccessToken(): Promise<string> {
        return this.configService.getOrThrow('ACCESS_TOKEN');
    }
}
