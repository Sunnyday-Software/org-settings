import type {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods';

type CreateRepoRulesetParams = RestEndpointMethodTypes['repos']['createRepoRuleset']['parameters'];

export type PartialCreateRepoRulesetParams = Omit<CreateRepoRulesetParams, "owner" | "repo">;

const blockDirectPushToMain: PartialCreateRepoRulesetParams = {
    name: 'Block direct push to main',
    enforcement: 'active',
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

export const repoRuleSet : Array<PartialCreateRepoRulesetParams> = [blockDirectPushToMain]