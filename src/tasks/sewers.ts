import { Quest, Task } from "grimoire-kolmafia";
import { chatPrivate, getClanName, wait } from "kolmafia";
import { $item, $location, get, set } from "libram";

import { args } from "../args";
import { getCurrent, throughSewers, updateClanStatus } from "../clan";
import { ForkoStrategy, Macro } from "../combat";

export const Sewers: Quest<Task> = {
  name: "Sewers",
  completed: () => throughSewers(),
  tasks: [
    {
      name: "Acquire Cagebait",
      completed: () =>
        get(`forko_${getCurrent()}_acquiredCagebait`, 0) > Date.now() - 1000 * 60 * 60,
      do: () => {
        chatPrivate(args.cagebait, `cage ${getClanName()}`);
        wait(60);
        set(`forko_${getCurrent()}_acquiredCagebait`, Date.now());
      },
    },
    {
      after: ["Acquire Cagebait"],
      name: "Explore",
      completed: () => false,
      prepare: () => {
        // Cap noncombat
      },
      acquire: [
        { item: $item`unfortunate dumplings`, price: 20000 },
        { item: $item`bottle of Ooze-O`, price: 20000 },
        { item: $item`oil of oiliness`, price: 10000 },
        { item: $item`gatorskin umbrella`, price: 10000 },
      ],
      outfit: {
        equip: [$item`gatorskin umbrella`, $item`hobo code binder`],
        modifier: "-combat",
        bonuses: new Map([[$item`mafia thumb ring`, 200]]),
      },
      choices: {
        197: 3, // Valve (turn)
        198: 3, // Grate (open)
        199: 2, // Ladder (skip)
        211: 1, // Cage (gnaw)
        212: 1, // Cage (gnaw)
      },
      combat: new ForkoStrategy(() => Macro.freeRun()),
      do: $location`A Maze of Sewer Tunnels`,
      post: () => updateClanStatus(),
    },
  ],
};
