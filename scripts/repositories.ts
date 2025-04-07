import {
  SettingsCreateRepoRulesetParams,
  settingsDefaultRepoRules,
} from "./rulesets";

export type SettingsRepository = {
  org: string;
  owner: string;
  repo: string;
  repoRules: Array<SettingsCreateRepoRulesetParams>;
};
const ORG = "Sunnyday-Software";

function SDSOrg(repo: string): SettingsRepository {
  return {
    org: ORG,
    owner: ORG,
    repo: repo,
    repoRules: settingsDefaultRepoRules,
  };
}

export const settingRepositories: Array<SettingsRepository> = [
  SDSOrg("docker-project-images"),
  SDSOrg("docker-project-manager"),
];
