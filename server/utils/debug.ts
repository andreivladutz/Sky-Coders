import { UserType } from "../models/User";
import CreateDebug, { Debugger } from "debug";

export class NamespaceDebugger {
  debug: Debugger;

  constructor(namespace: string) {
    this.debug = CreateDebug(namespace);
  }

  public userHas(user: UserType, msg: string) {
    this.debug(`User ${user.name}, id: ${user.id}, has ${msg}`);
  }
}
