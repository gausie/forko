import { Args } from "grimoire-kolmafia";
import { myAdventures } from "kolmafia";

export const args = Args.create(
  "forko",
  "Forko! Forko! Forko!",
  {
    turns: Args.number({
      help: "Turns to stop running after",
      default: myAdventures() * 1.1 + 50,
    }),
    status: Args.boolean({
      help: "Show current status for clans",
      default: false,
    }),
    turbo: Args.boolean({
      help: "Run as fast as possible",
      default: false,
    }),
    clans: Args.strings({
      help: "Clans in which to farm",
      default: [],
    }),
    cagebait: Args.string({
      help: "Cagebait bot to use",
      default: "ASSBot",
    }),
  },
  {
    positionalArgs: ["turns"],
  },
);
