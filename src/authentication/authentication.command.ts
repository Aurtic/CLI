import { Command, CommandRunner, InquirerService, Option } from 'nest-commander';
import { AuthenticationService } from './authentication.service';

@Command({
    name: 'login',
    arguments: '<username>',
    description: 'Login using username and password credentials'
})
export class AuthenticationCommand extends CommandRunner {
    constructor(
        private readonly inquirerService: InquirerService,
        private readonly authenticationService: AuthenticationService
    ) {
        super();
    }

    @Option({
        flags: '-p, --password [string]',
        description: 'Password',
    })
    parsePassword(val: string): string {
        return val;
    }


    async run(passedParams: string[], options: Record<string, any>): Promise<void> {
        const username = passedParams[0];
        let password = options.password;

        if (!password) {
            const result = await this.inquirerService.inquirer.prompt({
                type: 'password',
                message: 'Enter your password: ',
                name: 'password',
            });
            password = result.password;
        }

        const accessToken = await this.authenticationService.getAccessTokenByUsernameAndPassword(username, password);

        console.log(accessToken);
    }
}