export type SettingsRepository = {
    org: string;
    owner: string
    repo: string
};
const ORG = 'Sunnyday-Software'

function SDSOrg(repo: string): SettingsRepository {
    return {
        org: ORG,
        owner: ORG,
        repo: repo
    }
}

export const settingRepositories: Array<SettingsRepository> = [
        SDSOrg( 'docker-project-images'),
        SDSOrg( 'docker-project-manager')
];