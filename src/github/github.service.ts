import { Injectable } from '@nestjs/common';
import core from "@actions/core";

@Injectable()
export class GithubService {

    async retrieveGithubIDToken() {
        try {
            let idToken = await core.getIDToken()
            return idToken;
        } catch (error) {
            return null;
        }
    }

}
