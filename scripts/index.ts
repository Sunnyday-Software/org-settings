import { Context } from "@actions/github/lib/context";
import { GitHub } from "@actions/github/lib/utils";
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { settingRepositories } from "./repositories";
import { settingTeams } from "./teams";
import { SettingsCreateRepoRulesetParams } from "./rulesets";
import { runtime, RT, RTOrgInfo, RTTeamInfo } from "./runtime";

const managedRepos = ["docker-project-images", "docker-project-manager"];

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
  team_slug: string; // Slug del nome del team
  owner: string; // Nome dell'organizzazione
  repo: string; // Nome del repository
  permission: "pull" | "triage" | "push" | "maintain" | "admin";
}

async function repoTeam({
  github,
  org,
  team_slug,
  owner,
  repo,
  permission,
}: AddRepoToTeamParams) {
  await github.rest.teams.addOrUpdateRepoPermissionsInOrg({
    org,
    team_slug,
    owner,
    repo,
    permission, // livello di permessi
  });

  console.log(
    `✅ Repository '${repo}' aggiunto con successo nel team '${team_slug}' (Permesso: ${permission}).`,
  );
}

interface RulesetParams {
  github: InstanceType<typeof GitHub>;
  owner: string;
  repo: string;
}

type CreateRepoRulesetParams =
  RestEndpointMethodTypes["repos"]["createRepoRuleset"]["parameters"];

function enrichRuleset(org: string, p: CreateRepoRulesetParams) {
  if (runtime.orgsMap.has(org)) {
    const rtOrgInfo = runtime.orgsMap.get(org)!;
    if (p.conditions?.ref_name?.include?.includes("refs/heads/testing")) {
      if (rtOrgInfo.teams.has("maintainers")) {
        const testingTeam = rtOrgInfo.teams.get("maintainers")!;
        p.bypass_actors = [
          {
            actor_id: testingTeam.id,
            actor_type: "Team",
            bypass_mode: "always",
          },
        ];
      }
    }
  }
}

async function repoRuleSet(
  currentRulesetsMapByName: Record<string, any>,
  settingsCreateRepoRulesetParams: SettingsCreateRepoRulesetParams,
  { github, owner, repo }: RulesetParams,
) {
  const payload: CreateRepoRulesetParams = {
    owner,
    repo,
    ...settingsCreateRepoRulesetParams,
  } as CreateRepoRulesetParams;

  if (currentRulesetsMapByName[payload.name]) {
    console.log("+ Updating ruleset...");
    const updatePayload = {
      ...payload,
      ruleset_id: currentRulesetsMapByName[payload.name].id,
    };
    enrichRuleset(owner, updatePayload);
    await github.rest.repos.updateRepoRuleset(updatePayload);
  } else {
    console.log("+ Creating ruleset...");
    enrichRuleset(owner, payload);
    await github.rest.repos.createRepoRuleset(payload);
  }
  console.log("✅ Ruleset impostata e attivata correttamente.");
}

async function getRepoRuleSet({ github, owner, repo }: RulesetParams) {
  const { data: repoRulesets } = await github.rest.repos.getRepoRulesets({
    owner,
    repo,
    per_page: 100,
    page: 1,
    headers: {
      "x-github-api-version": "2022-11-28",
    },
  });

  return repoRulesets;
}

export default async ({ github, context }: ActionParams) => {
  let repositories: Array<any> = [];
  let page = 1;
  const per_page = 100; // numero massimo che GitHub permette per richieste paginate
  let hasMorePages = true;

  console.log("📚 Elenco completo dei repository accessibili:");

  while (hasMorePages) {
    const { data: reposInPage } =
      await github.rest.repos.listForAuthenticatedUser({
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

  repositories.forEach((repo) => {
    console.log(
      `Repo: ${repo.full_name}, owner: ${repo.owner.type} ${repo.owner.login}`,
    );
  });

  console.log(`✅ Totale repository trovati: ${repositories.length}`);

  // Ottiene tutti i valori unici della proprietà org,
  const orgList = [
    ...new Set(
      settingRepositories
        .filter((repo) => repo.org != null && repo.org.trim().length > 0)
        .map((repo) => repo.org),
    ),
  ];

  for (const org of orgList) {
    const { data: teams } = await github.rest.teams.list({
      org: org,
      per_page: 100,
    });
    console.log(`Teams in ${org}:`);
    for (const team of teams) {
      console.log(`Team: ${team.name}, id: ${team.id}`);
      const rtOrgInfo = runtime.orgsMap.getOrInsert(
        org,
        () => new RTOrgInfo(org),
      );
      rtOrgInfo.teams.getOrInsert(
        team.name,
        () => new RTTeamInfo(team.name, team.permission, team.id),
      );
    }
  }

  //verifico che tutte le organizzazioni possiedano i teams
  for (const org of orgList) {
    if (!runtime.orgsMap.has(org)) {
      throw new Error(
        `Organizzazione ${org} non possiede nessun team definito`,
      );
    }
    const rtOrgInfo = runtime.orgsMap.get(org)!;
    settingTeams.forEach((team) => {
      if (!rtOrgInfo.teams.has(team.name))
        throw new Error(
          `Organizzazione ${org} non possiede il team ${team.name}`,
        );
    });
  }

  //configurazione dei repo

  for (const s_repo of settingRepositories) {
    console.log(
      `Setting repo: ${s_repo.repo}--------------------------------------`,
    );
    for (const s_team of settingTeams) {
      await repoTeam({
        github: github,
        org: s_repo.org,
        team_slug: s_team.name,
        owner: s_repo.owner,
        repo: s_repo.repo,
        permission: s_team.permission,
      });
    }
    const currentRulesetList = await getRepoRuleSet({
      github: github,
      owner: s_repo.owner,
      repo: s_repo.repo,
    });

    const currentRulesets = currentRulesetList?.reduce(
      (acc, repo) => {
        acc[repo.name] = repo;
        return acc;
      },
      {} as Record<string, (typeof currentRulesetList)[0]>,
    );

    for (const s_repoRule of s_repo.repoRules) {
      await repoRuleSet(currentRulesets || {}, s_repoRule, {
        github: github,
        owner: s_repo.owner,
        repo: s_repo.repo,
      });
    }
  }
};
