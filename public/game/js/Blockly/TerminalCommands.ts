import CharacterTerminal from "./CharacterTerminal";
import CST from "../CST";
import GameManager from "../online/GameManager";

const COLORS = CST.TERMINAL.COLORS;

export default class TerminalCommands {
  private terminal: CharacterTerminal;
  private cmdsLangFile = GameManager.getInstance().langFile.terminal.cmds;

  constructor(terminal: CharacterTerminal) {
    this.terminal = terminal;
  }

  private handleUnknownCmd = (cmd: string) => {
    this.terminal.printLine(
      `${this.terminal.coloredText(this.cmdsLangFile.error, COLORS.RED)} ${
        this.cmdsLangFile.unkownCmd
      } ${cmd}`
    );
  };

  // cmd1####longest descr
  // cmd2######short descr
  private handleHelpCmd = () => {
    for (let [cmd, [_, description]] of Object.entries(this.COMMANDS)) {
      if (!description) {
        continue;
      }

      let line = this.terminal.coloredText(cmd, CST.TERMINAL.BACKGROUND.GRAY);

      let spacePadding =
        Math.floor(this.terminal.lineWidth / 1.5) -
        cmd.length -
        description.length;
      // Pad the line with spaces
      for (let spNo = 1; spNo <= spacePadding; spNo++) {
        line += " ";
      }

      this.terminal.printLine(line + description);
    }
  };

  private handleClearCmd = () => {
    setTimeout(() => {
      this.terminal.clearTerminal();
    }, 0);
  };

  private handleCiciCmd = () => {
    this.terminal.printLine("Cici is the best!", COLORS.MAGENTA);
  };

  private readonly COMMANDS: {
    [key: string]: [() => void, string];
  } = {
    help: [this.handleHelpCmd, this.cmdsLangFile.help.help],
    clear: [this.handleClearCmd, this.cmdsLangFile.help.clear],
    cici: [this.handleCiciCmd, ""],
  };

  // Verify if any command matches the cmd and run the handler
  public handleCommand(cmd: string) {
    for (let [command, [handler, _]] of Object.entries(this.COMMANDS)) {
      if (cmd === command) {
        return handler();
      }
    }

    this.handleUnknownCmd(cmd);
  }

  // output the Blockly-generated code
  public outputRunningCode(code: string[]) {
    if (!code || !code[0]) {
      return;
    }

    this.terminal.printLine(this.cmdsLangFile.msg.runningCode);

    for (let codeLine of code) {
      this.terminal.printLine(codeLine, COLORS.GREEN);
    }

    this.terminal.prompt();
  }

  // Output of print cmd
  public codePrint(text: string) {
    this.terminal.printLine(
      `${this.terminal.coloredText(
        this.cmdsLangFile.msg.textOutput,
        COLORS.YELLOW
      )}: ${text}`
    );
  }

  // Report an error caught inside the code
  public reportCodeError(e: Error) {
    this.terminal.printLine(this.cmdsLangFile.msg.errorCaught, COLORS.RED);
    this.terminal.printLine(`${e.message}`, COLORS.RED);
  }
}
