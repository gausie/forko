import { abort, getClanId, getClanName, myAscensions, myId, visitUrl } from "kolmafia";
import { Clan, get, set } from "libram";

type ClanStatus = {
  id: number;
  defeated: string[];
  sewers: boolean;
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
  return {
    id,
    defeated,
    sewers,
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
