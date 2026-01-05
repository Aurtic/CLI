import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'node:path';
import { BuildsZipService } from './builds.zip.service';
import ora from 'ora';
import { AuthenticationService } from '../authentication/authentication.service';

@Injectable()
export class BuildsService implements OnApplicationBootstrap {

    async onApplicationBootstrap() {
        await ConfigModule.envVariablesLoaded;
    }

    constructor(
        private readonly configService: ConfigService,
        private readonly buildsZipService: BuildsZipService,
        private readonly authenticationService: AuthenticationService,
    ) { }

    async followBuild(serviceId: string, buildId: string): Promise<void> {
        const spinner = ora('Building...');
        spinner.start();

        const getBuild = async (i = 0) => {
            const uri = this.configService.getOrThrow('API_URI');
            let request;
            try {
                request = await fetch(`${uri}/v1/services/${serviceId}/builds/${buildId}`, {
                    method: 'GET',
                    headers: {
                        'authorization': `Bearer ${await this.authenticationService.getAccessToken()}`,
                    },
                });
            } catch (e) {
                if (i > 10) {
                    throw e;
                }
                
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                spinner.text = `Retrying... to connect (${i + 1}/10)`;

                return getBuild(i + 1);
            }
            const respose = await request.json();
            if (!request.ok) {
                throw new Error(respose.message);
            }
            return respose;
        }

        const recursion = async () => {
            let build;
            try {
                build = await getBuild();
            } catch (error) {
                spinner.text = 'Error while retrieving build status...';
                spinner.fail();
                throw error;
            }
            if (build.succeeded) {
                spinner.text = 'Build completed successfully.';
                spinner.succeed();
                return;
            }
            if (build.processed) {
                spinner.text = 'Build failed.';
                spinner.fail();
                throw new Error('Build failed...');
            }
            if (!build.processing) {
                spinner.text = 'Awaiting for building to start...';
            } else {
                if (build.result) {
                    spinner.text = 'Building...\n\n' + build.result
                        .slice(-10)
                        .join("\n");
                } else {
                    spinner.text = 'Building...';
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            return recursion();
        }

        await recursion();
    }

    async buildStreaming(serviceId: string, opts: {
        dockerfile?: string,
        path?: string,
        name?: string,
        version?: string,
    }) {
        const spinner = ora('Building...');
        spinner.start();

        const fullPath = path.resolve(path.join(process.cwd(), opts.path ?? './'));
        spinner.text = 'Building zip...';

        let zip: Buffer;
        try {
            zip = await this.buildsZipService.buildZip(fullPath, opts.dockerfile);
        } catch (error) {
            spinner.text = 'Failed to build zip...';
            spinner.fail();
            throw error;
        }

        spinner.text = 'Uploading files to server...';

        const uri = this.configService.getOrThrow('API_URI');

        const multiPartFormData = new FormData();
        multiPartFormData.append('file', new Blob([Buffer.from(zip)]));

        const params = new URLSearchParams({
            provider: 'docker',
        });

        if (opts.name) {
            params.set('name', opts.name);
        }

        if (opts.version) {
            params.set('version', opts.version);
        }

        try {
            const request = await fetch(`${uri}/v1/services/${serviceId}/builds/streaming?${params.toString()}`, {
                method: 'POST',
                body: multiPartFormData,
                headers: {
                    'authorization': `Bearer ${await this.authenticationService.getAccessToken()}`,
                },
            });

            const result = await request.json();
            if (!request.ok) {
                spinner.text = 'Upload failed...';
                spinner.fail();
                throw new Error(result.message);
            }

            spinner.text = 'Upload completed...';
            spinner.succeed();
            return result;
        } catch (error) {
            spinner.text = 'Upload failed...';
            spinner.fail();
            throw error;
        }
    }

}
