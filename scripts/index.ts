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

export default async ({ github, context }: ActionParams) => {
    let repositories: Array<any> = [];
    let page = 1;
    const per_page = 100;  // numero massimo che GitHub permette per richieste paginate
    let hasMorePages = true;

    console.log('📚 Elenco completo dei repository accessibili:');

    try {
        while (hasMorePages) {
            const { data: reposInPage } = await github.rest.repos.listForAuthenticatedUser({
                per_page,
                page,
            });

            repositories = repositories.concat(reposInPage);

            if (reposInPage.length < per_page) {
                hasMorePages = false; // Siamo all'ultima pagina
            } else {
                page++;
            }
        }

        repositories.forEach(repo => {
            console.log(`- ${repo.full_name}`);
        });

        console.log(`✅ Totale repository trovati: ${repositories.length}`);
    } catch (error) {
        console.error('⚠️ Errore durante la ricezione dei repository:', error);
    }
};
