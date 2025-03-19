import { Engine, Task } from "grimoire-kolmafia";

export class ForkoEngine extends Engine {
  constructor(tasks: Task[]) {
    super(tasks);
  }
}
