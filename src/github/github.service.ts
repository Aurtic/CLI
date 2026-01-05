import { Injectable } from '@nestjs/common';
import * as core from "@actions/core";

@Injectable()
export class GithubService {

    async retrieveGithubIDToken() {
        try {
            let idToken = await core.getIDToken('api.v2.aurtic.com')
            return idToken;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

}
