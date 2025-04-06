import * as core from '@actions/core';
import * as github from '@actions/github';

import { Context } from '@actions/github/lib/context';
import { GitHub } from '@actions/github/lib/utils';

/**
 * Check https://github.com/marketplace/actions/github-script
 */

interface ActionParams {
    github: InstanceType<typeof GitHub>;
    context: Context;
}

export default async ({github, context}: ActionParams
) =>  {
    const { data: repositories }= await github.rest.repos.listForAuthenticatedUser({
        per_page: 10,
    });

    console.log(`Repository accessibili tramite il token attuale:`);
    repositories.forEach(repo => console.log(`- ${repo.full_name}`));


}