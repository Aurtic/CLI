import { CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';
import { AuthenticationService } from './authentication.service';
import { GithubService } from 'src/github/github.service';
import { ConfigService } from '@nestjs/config';

@SubCommand({
    name: 'github',
    description: 'Login using GitHub (actions) OpenID Connect credentials'
})
export class AuthenticationGithubCommand extends CommandRunner {
    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly configService: ConfigService,
        private readonly githubService: GithubService,
    ) {
        super();
    }

    async run(passedParams: string[], options: Record<string, any>): Promise<void> {
        const githubToken = await this.githubService.retrieveGithubIDToken();
        if (!githubToken) {
            throw new Error('Failed to retrieve GitHub ID token, you are probably not authenticated in GitHub Actions (forgot to set: permissions.write = true in your workflow file) or are running this command locally');
        }

        await this.authenticationService.getAccessTokenByGithub(githubToken);

        console.log(`Logged in successfully using GitHub (actions) OpenID Connect credentials`);
    }
}