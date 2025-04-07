import * as core from '@actions/core';
import * as github from '@actions/github';

import {Context} from '@actions/github/lib/context';
import {GitHub} from '@actions/github/lib/utils';
const managedRepos = [
    "docker-project-images",
    "docker-project-manager"
]
/**
 * Check https://github.com/marketplace/actions/github-script
 */

interface ActionParams {
    github: InstanceType<typeof GitHub>;
    context: Context;
}

interface AddRepoToTeamParams {
    github: InstanceType<typeof GitHub>;
    org: string;
    team_slug: string;                   // Slug del nome del team
    owner: string;                       // Nome dell'organizzazione
    repo: string;                        // Nome del repository
    permission: 'pull' | 'triage' | 'push' | 'maintain' | 'admin' ;
}

async function repoTeam({github, org, team_slug, owner, repo, permission}: AddRepoToTeamParams) {
    try {
        await github.rest.teams.addOrUpdateRepoPermissionsInOrg({
            org,
            team_slug,
            owner,
            repo,
            permission, // livello di permessi
        });

        console.log(`✅ Repository '${repo}' aggiunto con successo nel team '${team_slug}' (Permesso: ${permission}).`);
    } catch (error) {
        console.error('⚠️ Errore:', error);
    }
};



interface RulesetParams {
    github: InstanceType<typeof GitHub>;
    owner: string;
    repo: string;
}

import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

type CreateRepoRulesetParams = RestEndpointMethodTypes['repos']['createRepoRuleset']['parameters'];


async function repoRuleSet(currentRulesetsMapByName: Record<string, any>,{ github, owner, repo }: RulesetParams)  {
    try {
        const payload : CreateRepoRulesetParams= {
            owner,
            repo,
            name: 'Block direct push to main',
            enforcement: 'active', // attiva immediatamente la regola
            target: 'branch' ,
            conditions: {
                ref_name: {
                    include: ['refs/heads/main'],
                    exclude: [],
                },
            },
            rules: [
                {type: "deletion"},
                {type: "non_fast_forward"},
                {type: "update"},
                {type: "creation"},
                {type: "required_linear_history"}
            ]
        }
        if (currentRulesetsMapByName[repo]) {
            console.log('+ Updating ruleset...');
            const updatePayload = {
                ...payload,
                ruleset_id: currentRulesetsMapByName[repo].id
            };
            await github.rest.repos.updateRepoRuleset(updatePayload);
        }else {
            console.log('+ Creating ruleset...');
            await github.rest.repos.createRepoRuleset(payload);
        }
        console.log('✅ Ruleset impostata e attivata correttamente.');
    } catch (error) {
        console.error('⚠️ Errore:', error);
    }
};

async function getRepoRuleSet({ github, owner, repo }: RulesetParams)  {
    try {
        const {data: repoRulesets} = await github.rest.repos.getRepoRulesets({
            owner,
            repo,
            per_page: 100,
            page: 1,
            headers: {
                "x-github-api-version": "2022-11-28",
            },
        });

        return repoRulesets;
    } catch (error) {
        console.error('⚠️ Errore:', error);
    }
};

export default async ({github, context}: ActionParams) => {
    let repositories: Array<any> = [];
    let page = 1;
    const per_page = 100;  // numero massimo che GitHub permette per richieste paginate
    let hasMorePages = true;

    console.log('📚 Elenco completo dei repository accessibili:');

    try {
        while (hasMorePages) {
            const {data: reposInPage} = await github.rest.repos.listForAuthenticatedUser({
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

        await repoTeam({
            github:github, org: 'Sunnyday-Software', team_slug: 'developers',
            owner: 'Sunnyday-Software', repo: 'docker-project-images', permission: 'push'
        })
        await repoTeam({
            github:github, org: 'Sunnyday-Software', team_slug: 'maintainers',
            owner: 'Sunnyday-Software', repo: 'docker-project-images', permission: 'maintain'
        })

        const currentRulesetList = await getRepoRuleSet({
            github: github, owner: 'Sunnyday-Software', repo: 'docker-project-images'
        })

        const currentRulesets  = currentRulesetList?.reduce((acc, repo) => {
            acc[repo.name] = repo;
            return acc;
        }, {} as Record<string, typeof currentRulesetList[0]>);

        console.log(currentRulesets)

        await repoRuleSet(currentRulesets||{},{
            github:github, owner: 'Sunnyday-Software', repo: 'docker-project-images'})
    } catch (error) {
        console.error('⚠️ Errore durante la ricezione dei repository:', error);
    }
};

