import { Command, CommandRunner, Option } from 'nest-commander';
import { BuildsService } from './builds.service';
import { AuthenticationService } from '../authentication/authentication.service';

@Command({
    name: 'build',
    arguments: '<serviceId>',
    description: 'A parameter parser example'
})
export class BuildsCommand extends CommandRunner {
    constructor(
        private readonly buildsService: BuildsService,
        private readonly authenticationService: AuthenticationService
    ) {
        super();
    }

    @Option({
        flags: '-n, --name [string]',
        description: 'Build name',
        required: false,
    })
    parseName(val: string | undefined): string | undefined {
        return val?.trim() || undefined;
    }

    @Option({
        flags: '-t, --tenant [string]',
        description: 'Tenant ID to use',
    })
    parseTenantId(val: string): string {
        return val;
    }


    @Option({
        flags: '-d, --dockerfile [string]',
        description: 'Dockerfile path',
        defaultValue: './Dockerfile',
    })
    parseDockerfile(val: string): string {
        return val;
    }

    @Option({
        flags: '-p, --path [string]',
        description: 'Local build path',
        defaultValue: './',
    })
    parsePath(val: string): string {
        return val;
    }

    @Option({
        flags: '-v, --version [string]',
        description: 'Version name',
    })
    parseVersion(val?: string): string | undefined {
        return val;
    }

    @Option({
        flags: '-l, --local [boolean]',
        description: 'Build locally or remotely',
        defaultValue: false,
    })
    parseIsLocal(val: string): boolean {
        const value = JSON.parse(val);
        if (typeof value !== 'boolean') {
            throw new Error('Invalid boolean value');
        }
        return value;
    }

    @Option({
        flags: '-f, --follow [boolean]',
        description: 'Follow the build logs and await the result',
    })
    parseFollow(val: string): boolean {
        const value = JSON.parse(val);
        if (typeof value !== 'boolean') {
            throw new Error('Invalid boolean value');
        }
        return value;
    }


    async run(passedParams: string[], options: Record<string, any>): Promise<void> {
        const serviceId = passedParams[0];
        if (options.tenant) {
            await this.authenticationService.setTenantId(options.tenant);
        }
        if (options.local) {
            throw new Error('Local builds are not supported yet');
        } else {
            const build = await this.buildsService.buildStreaming(serviceId, options);
            if (options.follow) {
                await this.buildsService.followBuild(serviceId, build.id);
            }
        }
    }
}