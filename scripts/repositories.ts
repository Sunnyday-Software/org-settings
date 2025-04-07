export type SettingsRepository = {
    org: string;
    owner: string
    repo: string
};
const ORG='Sunnyday-Software'

export const settingRepositories: Array<SettingsRepository> = [
    {
        org: ORG,
        owner: ORG,
        repo: 'docker-project-images'
    },
    {
        org: ORG,
        owner: ORG,
        repo: 'docker-project-manager'
    }
];