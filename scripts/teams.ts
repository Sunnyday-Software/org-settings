/*
    Questo è un elenco dei team conosciuti dallo script.
    I team vanno gestiti a mano per quanto riguarda l'elenco degli utenti
 */
export type SettingsTeam = {
  name: string;
  permission: "pull" | "triage" | "push" | "maintain" | "admin";
};

const developers: SettingsTeam = {
  name: "developers",
  permission: "push",
};

const maintainers: SettingsTeam = {
  name: "maintainers",
  permission: "maintain",
};

export const settingTeams: Array<SettingsTeam> = [developers, maintainers];
