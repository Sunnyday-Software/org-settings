import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

type CreateRepoRulesetParams =
  RestEndpointMethodTypes["repos"]["createRepoRuleset"]["parameters"];

export type SettingsCreateRepoRulesetParams = Omit<
  CreateRepoRulesetParams,
  "owner" | "repo"
>;

export const settingsRepoRule_blockDirectPushToMain: SettingsCreateRepoRulesetParams =
  {
    name: "Block direct push to main",
    enforcement: "active",
    target: "branch",
    conditions: {
      ref_name: {
        include: ["refs/heads/main"],
        exclude: [],
      },
    },
    rules: [
      { type: "deletion" },
      { type: "non_fast_forward" },
      { type: "update" },
      { type: "creation" },
      { type: "required_linear_history" },
    ],
  };

export const settingsRepoRule_blockDirectPushToTesting: SettingsCreateRepoRulesetParams =
  {
    name: "Block direct push to testing",
    enforcement: "active",
    target: "branch",
    conditions: {
      ref_name: {
        include: ["refs/heads/testing"],
        exclude: [],
      },
    },
    rules: [
      { type: "deletion" },
      { type: "non_fast_forward" },
      { type: "update" },
      { type: "creation" },
      { type: "required_linear_history" },
    ],
  };
export const settingsDefaultRepoRules: Array<SettingsCreateRepoRulesetParams> =
  [
    settingsRepoRule_blockDirectPushToMain,
    settingsRepoRule_blockDirectPushToTesting,
  ];
