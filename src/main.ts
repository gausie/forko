import { Args, getTasks } from "grimoire-kolmafia";
import { sinceKolmafiaRevision } from "libram";

import { args } from "./args";
import { ForkoEngine } from "./engine/engine";
import { Sewers } from "./tasks/sewers";
import { TownSquare } from "./tasks/townsquare";
import { printClanStatus, setClan } from "./wl";

export function main(params: string) {
  sinceKolmafiaRevision(28425); // A recent version at time of refactor

  Args.fill(args, params);

  if (args.help) {
    Args.showHelp(args);
    return;
  }

  if (args.status) {
    for (const clan of args.clans) {
      setClan(clan, false);
      printClanStatus();
    }
  }

  const tasks = getTasks([Sewers, TownSquare]);

  const engine = new ForkoEngine(tasks);

  try {
    engine.run();
  } finally {
    engine.propertyManager.resetAll();
  }

  // print(`Starting "mining"! Stopping in ${stopTurncount - myTurncount()} turns.`);

  // wrapMain(args, () => {
  //   if (!mustStop(stopTurncount)) doSewers(stopTurncount);
  //   if (!mustStop(stopTurncount)) doTownsquare(stopTurncount);
  //   if (!mustStop(stopTurncount)) doEe(stopTurncount, 1);
  //   if (!mustStop(stopTurncount)) doBb(stopTurncount);
  //   if (!mustStop(stopTurncount)) doHeap(stopTurncount);
  //   if (!mustStop(stopTurncount)) doEe(stopTurncount, 2);
  //   if (!mustStop(stopTurncount)) doPld(stopTurncount);
  //   if (!mustStop(stopTurncount)) doAhbg(stopTurncount);
  //   if (!mustStop(stopTurncount)) doEe(stopTurncount, 3);
  // });
}
