import { Injectable } from '@nestjs/common';
import core from "@actions/core";

@Injectable()
export class GithubService {

    async retrieveGithubIDToken() {
        let idToken = await core.getIDToken()
        return idToken;
    }

}
