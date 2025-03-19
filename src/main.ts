import { getClanName, myTurncount, print, userConfirm } from "kolmafia";

import { mustStop, stopAt, wrapMain } from "./lib";
import { doAhbg } from "./tasks/ahbg";
import { doBb } from "./tasks/bb";
import { doEe } from "./tasks/ee";
import { doHeap } from "./tasks/heap";
import { doPld } from "./tasks/pld";
import { doSewers } from "./tasks/sewers";
import { doTownsquare } from "./tasks/townsquare";

export function main(args: string) {
  const stopTurncount = stopAt(args);

  if (["Bonus Adventures From Hell"].includes(getClanName())) {
    print(`Clan ${getClanName()} is on blacklist.`, "red");
    return;
  }

  if (!userConfirm(`You are in clan ${getClanName()}. Is this right?`)) {
    print("Wrong clan.", "red");
    return;
  }

  print(`Starting "mining"! Stopping in ${stopTurncount - myTurncount()} turns.`);

  wrapMain(args, () => {
    if (!mustStop(stopTurncount)) doSewers(stopTurncount);
    if (!mustStop(stopTurncount)) doTownsquare(stopTurncount);
    if (!mustStop(stopTurncount)) doEe(stopTurncount, 1);
    if (!mustStop(stopTurncount)) doBb(stopTurncount);
    if (!mustStop(stopTurncount)) doHeap(stopTurncount);
    if (!mustStop(stopTurncount)) doEe(stopTurncount, 2);
    if (!mustStop(stopTurncount)) doPld(stopTurncount);
    if (!mustStop(stopTurncount)) doAhbg(stopTurncount);
    if (!mustStop(stopTurncount)) doEe(stopTurncount, 3);
  });
}
