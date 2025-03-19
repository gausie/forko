import { Args, getTasks } from "grimoire-kolmafia";
import { sinceKolmafiaRevision } from "libram";

import { args } from "./args";
import { joinClan, printStatus } from "./clan";
import { ForkoEngine } from "./engine/engine";
import { BurnbarrelBoulevard } from "./tasks/burnbarrelBoulevard";
import { ExposureEsplanade } from "./tasks/exposureEsplanade";
import { Sewers } from "./tasks/sewers";
import { TownSquare } from "./tasks/townSquare.js";

export function main(params: string) {
  sinceKolmafiaRevision(28425); // A recent version at time of refactor

  Args.fill(args, params);

  if (args.help) {
    Args.showHelp(args);
    return;
  }

  if (args.status) {
    for (const clan of args.clans) {
      joinClan(clan);
      printStatus();
    }
  }

  const tasks = getTasks([Sewers, TownSquare, ExposureEsplanade, BurnbarrelBoulevard]);

  const engine = new ForkoEngine(tasks);

  try {
    engine.run();
  } finally {
    engine.propertyManager.resetAll();
  }
}
