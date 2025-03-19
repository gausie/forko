import {
  abort,
  getClanId,
  getClanName,
  myAscensions,
  myId,
  print,
  printHtml,
  visitUrl,
} from "kolmafia";
import { Clan, get, set } from "libram";

import { extractInt } from "./lib";

type ClanStatus = {
  id: number;
  defeated: string[];
  sewers: boolean;
  grates: number;
  valves: number;
};

function parseClanStatus(): ClanStatus | null {
  const page = visitUrl("clan_raidlogs.php");
  if (page.length === 0) return null;
  const id = Number(page.match(/<!--hoid:(\d+)-->/)?.[1] ?? "0");
  if (id <= 0) abort("Failed to parse raid id");
  const defeated = ["Ol' Scratch", "Frosty", "Oscus", "Zombo", "Chester", "Hodgman"].filter(
    (boss) => new RegExp(`defeated +${boss}`).test(page),
  );
  const sewers = page.includes(`(#${myId()}) made it through the sewer`);

  const grates = extractInt(/opened (a|[0-9]+) sewer grate/g, page);
  const valves = extractInt(/lowered the water level( [0-9]+ times?)? \(([0-9]+) turn/g, page, 2);

  return {
    id,
    defeated,
    sewers,
    grates,
    valves,
  };
}

export function joinClan(clanName: string) {
  Clan.join(clanName);
  const { id } = updateClanStatus();
  set(`_forko_current`, `${getClanId()}:${id}:${myAscensions()}`);
}

export function getCurrent() {
  const current = get(`_forko_current`, "");
  if (current === "") abort("Joined a clan without using joinClan?");
  return current;
}

export function updateClanStatus() {
  const status = parseClanStatus();
  if (!status) abort(`No dungeon access in ${getClanName()}.`);
  set(`_forko_${getClanId()}:${status.id}:${myAscensions()}`, JSON.stringify(status));
  return status;
}

export function getClanStatus(): ClanStatus {
  try {
    return JSON.parse(get(`_forko_${getCurrent()}`, ""));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    abort(`Failed to get clan status for ${getCurrent()}.`);
  }
}

export function throughSewers() {
  return getClanStatus().sewers;
}

export function printStatus() {
  const status = getClanStatus();
  printHtml(`<b>Hobopolis cleared. ${status.defeated.length} boss(es) defeated.</b>`);

  visitUrl("clan_basement.php?whiteboard=1")
    .match("<textarea[^>]*name=whiteboard[^>]*>([^<]*)</textarea>")?.[1]
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .forEach((l) => print(l));

  print(`Sewers at ${status.grates} grates, ${status.valves} valves`);
  print();
}
