import { UserType } from "../models/User";
import CreateDebug, { Debugger } from "debug";

import * as dotenv from "dotenv";
import * as path from "path";

let dotenvInited = false;

export class NamespaceDebugger {
  debug: Debugger;
  public static allowedNamespaces: string[];

  constructor(namespace: string) {
    if (!dotenvInited && !process.env.DEBUG) {
      dotenv.config({
        path: path.join(__dirname, "/../../config/.env"),
      });

      dotenvInited = true;

      if (!process.env.DEBUG) {
        process.env.DEBUG = "";
      }
    }

    if (!NamespaceDebugger.allowedNamespaces) {
      NamespaceDebugger.allowedNamespaces = process.env.DEBUG.split(",");
    }

    this.debug = CreateDebug(namespace);

    for (let allowedNsp of NamespaceDebugger.allowedNamespaces) {
      if (allowedNsp.trim() === namespace) {
        this.debug.enabled = true;
      }
    }
  }

  public userHas(user: UserType, msg: string) {
    this.debug(`User ${user.name}, id: ${user.id}, has ${msg}`);
  }
}
