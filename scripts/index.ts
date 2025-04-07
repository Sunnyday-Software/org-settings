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
    permission: 'pull' | 'triage' | 'push' | 'maintain' | 'admin';
}

async function repoTeam({github, org, team_slug, owner, repo, permission}: AddRepoToTeamParams) {

    await github.rest.teams.addOrUpdateRepoPermissionsInOrg({
        org,
        team_slug,
        owner,
        repo,
        permission, // livello di permessi
    });

    console.log(`✅ Repository '${repo}' aggiunto con successo nel team '${team_slug}' (Permesso: ${permission}).`);

};


interface RulesetParams {
    github: InstanceType<typeof GitHub>;
    owner: string;
    repo: string;
}

import type {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods';
import {settingRepositories} from "./repositories";
import {settingTeams} from "./teams";

type CreateRepoRulesetParams = RestEndpointMethodTypes['repos']['createRepoRuleset']['parameters'];


async function repoRuleSet(currentRulesetsMapByName: Record<string, any>, {github, owner, repo}: RulesetParams) {

    const payload: CreateRepoRulesetParams = {
        owner,
        repo,
        name: 'Block direct push to main',
        enforcement: 'active', // attiva immediatamente la regola
        target: 'branch',
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
    if (currentRulesetsMapByName[payload.name]) {
        console.log('+ Updating ruleset...');
        const updatePayload = {
            ...payload,
            ruleset_id: currentRulesetsMapByName[payload.name].id
        };
        await github.rest.repos.updateRepoRuleset(updatePayload);
    } else {
        console.log('+ Creating ruleset...');
        await github.rest.repos.createRepoRuleset(payload);
    }
    console.log('✅ Ruleset impostata e attivata correttamente.');

};

async function getRepoRuleSet({github, owner, repo}: RulesetParams) {

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

};

export default async ({github, context}: ActionParams) => {
    let repositories: Array<any> = [];
    let page = 1;
    const per_page = 100;  // numero massimo che GitHub permette per richieste paginate
    let hasMorePages = true;

    console.log('📚 Elenco completo dei repository accessibili:');

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
        console.log(`Repo: ${repo.full_name}, owner: ${repo.owner.type} ${repo.owner.login}`);
    });

    console.log(`✅ Totale repository trovati: ${repositories.length}`);

    for (const s_repo of settingRepositories) {
        console.log(`Setting repo: ${s_repo.repo}--------------------------------------`)
        for(const s_team of settingTeams) {
            await repoTeam({
                github: github, org: s_repo.org, team_slug: s_team.name,
                owner: s_repo.owner, repo: s_repo.repo, permission: s_team.permission
            })
        }
        const currentRulesetList = await getRepoRuleSet({
            github: github, owner: s_repo.owner, repo: s_repo.repo
        })

        const currentRulesets = currentRulesetList?.reduce((acc, repo) => {
            acc[repo.name] = repo;
            return acc;
        }, {} as Record<string, typeof currentRulesetList[0]>);

        await repoRuleSet(currentRulesets || {}, {
            github: github, owner: s_repo.owner, repo: s_repo.repo
        })
    }



};

