import { Quest, Task } from "grimoire-kolmafia";
import {
  abort,
  ceil,
  cliExecute,
  Effect,
  Element,
  haveEffect,
  myBuffedstat,
  numericModifier,
  print,
  round,
  toFloat,
  visitUrl,
} from "kolmafia";
import { $effect, $element, $item, $location, $skill, $stat, getRemainingLiver } from "libram";

import { ForkoStrategy, Macro } from "../combat";
import { extractInt, getImage, memoizeTurncount, turboMode } from "../lib";

type MonsterPart = {
  type: Element;
  name: string;
  regex: RegExp;
  intrinsic: Effect;
};

const monsterParts: MonsterPart[] = [
  {
    type: $element`hot`,
    name: "hot",
    regex: /pairs? of charred hobo boots/,
    intrinsic: $effect`Spirit of Cayenne`,
  },
  {
    type: $element`cold`,
    name: "cold",
    regex: /pairs? of frozen hobo eyes/,
    intrinsic: $effect`Spirit of Peppermint`,
  },
  {
    type: $element`stench`,
    name: "stench",
    regex: /piles? of stinking hobo guts/,
    intrinsic: $effect`Spirit of Garlic`,
  },
  {
    type: $element`sleaze`,
    name: "sleaze",
    regex: /hobo crotch/,
    intrinsic: $effect`Spirit of Bacon Grease`,
  },
  {
    type: $element`spooky`,
    name: "spooky",
    regex: /creepy hobo skull/,
    intrinsic: $effect`Spirit of Wormwood`,
  },
  { type: $element`none`, name: "physical", regex: /hobo skin/, intrinsic: $effect`none` },
];

class PartPlan {
  type: MonsterPart;
  count = 0;

  constructor(type: MonsterPart) {
    this.type = type;
  }
}

const currentParts = memoizeTurncount(() => {
  const result = new Map<MonsterPart, number>();
  const text = visitUrl("clan_hobopolis.php?place=3&action=talkrichard&whichtalk=3");
  for (const part of monsterParts.values()) {
    const partRe = new RegExp(`<b>(a|[0-9]+)</b> ${part.regex.source}`, "g");
    result.set(part, extractInt(partRe, text));
  }
  return result;
});

let plan: PartPlan[] = [];

function buildPlan() {
  // Assume we're at the end of our current image and estimate. This will be conservative.
  const imagesRemaining = 11 - getImage($location`Hobopolis Town Square`);
  let hobosRemaining = (imagesRemaining - 1) * 100;
  // Make a plan: how many total scarehobos do we need to make to kill that many?
  // Start with the part with the fewest (should be 0).
  currentParts.forceUpdate();
  const partCounts = [...currentParts().entries()];
  partCounts.sort((x, y) => x[1] - y[1]);
  plan = partCounts.map(([part]: [MonsterPart, number]) => new PartPlan(part));
  for (const [idx, [, partCount]] of partCounts.entries()) {
    if (hobosRemaining > 0 && idx < partCounts.length - 1) {
      const [, nextPartCount] = partCounts[idx + 1];
      const killsToNext = nextPartCount - partCount;
      // Each part we add to our goal kills this many hobos - for the part with lowest, it's 9.
      // The part with the second lowest, it's 2 hobos plus 1 scarehobo or 10.
      const scarehoboFactor = idx + 9;
      const partsThisRound = Math.min(
        ceil(hobosRemaining / toFloat(scarehoboFactor) - 0.001),
        killsToNext,
      );
      for (let idx2 = 0; idx2 <= idx; idx2++) {
        plan[idx2].count += partsThisRound;
      }
      hobosRemaining -= partsThisRound * scarehoboFactor;
    }
  }

  if (hobosRemaining > 0) {
    print(`Remaining after: ${hobosRemaining}`);
    for (const partPlan of plan) {
      partPlan.count += ceil((hobosRemaining * 3) / 7 / 6);
    }
  }

  for (const partPlan of plan) {
    print(`PLAN: For part ${partPlan.type.name}, get ${partPlan.count} more parts.`);
  }
}

function overkillMacro(part: MonsterPart) {
  switch (part.type) {
    case $element`cold`:
    case $element`stench`:
    case $element`spooky`:
    case $element`sleaze`: {
      const predictedDamage =
        (32 + 0.5 * myBuffedstat($stat`Mysticality`)) *
        (1 + numericModifier("spell damage percent") / 100);
      if (predictedDamage < 505) {
        abort(`Predicted spell damage ${round(predictedDamage)} is not enough to overkill hobos.`);
      }
      if (haveEffect(part.intrinsic) === 0) {
        cliExecute(part.intrinsic.default);
      }
      return Macro.stasis()
        .if_("monstername sausage goblin", Macro.skill($skill`Saucegeyser`).repeat())
        .skill($skill`Stuffed Mortar Shell`)
        .externalIf(!turboMode(), Macro.skill($skill`Cannelloni Cannon`).repeat())
        .item($item`seal tooth`);
    }
    case $element`hot`: {
      return Macro.stasis()
        .skill($skill`Saucegeyser`)
        .repeat();
    }
    case $element`none`: {
      return Macro.stasis()
        .skill($skill`Lunging Thrust-Smack`)
        .repeat();
    }
    default:
      return Macro.abortWithWarning("Unknown part type");
  }
}

const closeToDone = () =>
  getImage($location`Hobopolis Town Square`) >= 11 || getRemainingLiver() < 0;

export const TownSquare: Quest<Task> = {
  name: "Town Square",
  completed: () => /exposureesplanade([0-9]+)o?.gif/.test(visitUrl("clan_hobopolis.php?place=8")),
  tasks: [
    {
      name: "Initial scarehobo check",
      completed: () => false,
      limit: { tries: 1 },
      do: () => {
        visitUrl("clan_hobopolis.php?preaction=simulacrum&place=3&qty=1&makeall=1");
        buildPlan();
        visitUrl("clan_hobopolis.php?preaction=simulacrum&place=3&qty=1&makeall=1");
      },
    },
    ...[...monsterParts.values()].map((monsterPart) => ({
      name: "Acquire cold parts",
      choices: {
        230: 0, // Show binder adventure in browser.
        200: 0, // Show Hodgman in browser.
        272: 2, // Skip marketplace.
        225: 3, // Skip tent.
      },
      ready: () => (plan.find((p) => p.type.type === monsterPart.type)?.count ?? 0) > 0,
      outfit: {
        modifier: ["familiar weight", "-0.05 ml 0 min"],
      },
      combat: new ForkoStrategy(() => overkillMacro(monsterPart)),
      do: $location`Hobopolis Town Square`,
      completed: () =>
        /exposureesplanade([0-9]+)o?.gif/.test(visitUrl("clan_hobopolis.php?place=8")),
      post: () => {
        if (!closeToDone()) return;
        visitUrl("clan_hobopolis.php?preaction=simulacrum&place=3&qty=1&makeall=1");
        buildPlan();
      },
    })),
  ],
};
