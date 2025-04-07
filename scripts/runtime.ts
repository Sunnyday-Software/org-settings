/*
Queste strutture servono a memorizzare valori che sono richiesti a GitHub
 */

import { ExtMap } from "./utils";

export class RTTeamInfo {
  name: string;
  permission: string;
  id: number;
  constructor(name: string, permission: string, id: number) {
    this.name = name;
    this.permission = permission;
    this.id = id;
  }
}

export class RTOrgInfo {
  name: string;
  teams: ExtMap<string, RTTeamInfo>;
  constructor(name: string) {
    this.name = name;
    this.teams = new ExtMap<string, RTTeamInfo>();
  }
}

export type RT = {
  orgsMap: ExtMap<string, RTOrgInfo>;
};

export const runtime: RT = {
  orgsMap: new ExtMap<string, RTOrgInfo>(),
};
