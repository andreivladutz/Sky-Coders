import { Terminal } from "xterm";
import "xterm/css/xterm.css";

import CST from "../CST";
import GameWindow from "../ui/GameWindow";

export default class CharacterTerminal {
  private terminal: Terminal;
  private terminalWindow: GameWindow;

  private readonly PROMPT_TEXT = "\r\n$ ";

  private currentTerminalRow: number;

  // Size percentages for the screen positioning
  private windowWidthPercentage: number;
  private windowHeightPercentage: number;
  private windowParentWidthPercentage: number;
  private windowParentHeightPercentage: number;

  constructor() {
    this.terminal = new Terminal();
    this.terminal.open(document.body);

    this.registerWindowResizing();
    this.runTerminal();

    // The div window "containing" the terminal
    this.terminalWindow = new GameWindow(
      document.getElementById(CST.TERMINAL.WINDOW_ID) as HTMLDivElement
    );
  }

  private processCommand(command: string) {
    console.log("The user inserted " + command);
  }

  // First message and start listening for key strokes
  private runTerminal() {
    this.terminal.write("Hello from \x1B[1;3;31mxterm.js\x1B[0m");
    this.prompt();

    this.currentTerminalRow = 1;

    this.terminal.onKey(this.processKeyStroke);
  }

  // New line and prompt symbol
  private prompt() {
    this.terminal.write(this.PROMPT_TEXT);
  }

  // Handler called when a key event is fired on the terminal
  private processKeyStroke = (e: { key: string; domEvent: KeyboardEvent }) => {
    const printable =
      !e.domEvent.altKey && !e.domEvent.ctrlKey && !e.domEvent.metaKey;

    let term = this.terminal;
    // Terminal buffer, private property
    let privateBuffer = (term as any)._core.buffer;
    let publicBuffer = (term as any).buffer.active;

    if (e.domEvent.key === "Enter") {
      // Get the command from the line on return
      let currentLine: string = publicBuffer
        .getLine(this.currentTerminalRow)
        .translateToString(true)
        .substr(2);

      this.processCommand(currentLine.trimRight());

      this.prompt();
      this.currentTerminalRow = this.currentTerminalRow + 1;

      return;
    } else if (e.domEvent.key === "Backspace") {
      // Do not delete the prompt
      if (privateBuffer.x > 2) {
        this.backspaceCharacter();
      }
    } else if (printable) {
      // Don t let the user write past the end of the row
      if (
        publicBuffer
          .getLine(this.currentTerminalRow)
          .translateToString(true)
          .trimRight().length >=
        this.terminal.cols - 1
      ) {
        return;
      }

      // Write the printable character to the terminal
      term.write(e.key);
    }

    // Don' t let the user navigate past the carret or the last line
    privateBuffer.x = Math.min(
      Math.max(2, privateBuffer.x),
      this.terminal.cols - 1
    );

    if (e.domEvent.key === "ArrowDown") {
      if (privateBuffer.y === this.terminal.rows - 1) {
        return;
      }

      this.currentTerminalRow++;
    } else if (e.domEvent.key === "ArrowUp") {
      term.writeln("");
    } else if (
      e.domEvent.key === "ArrowRight" &&
      publicBuffer
        .getLine(this.currentTerminalRow)
        .getCell(publicBuffer.cursorX)
        .getChars() === ""
    ) {
      privateBuffer.x = privateBuffer.x - 1;
    }
  };

  // On window resize, clear the current row if the new window has less columns than before
  private clearRow(oldCols: number) {
    for (let i = 1; i < oldCols; i++) {
      this.backspaceCharacter();
    }
  }

  private backspaceCharacter() {
    this.terminal.write("\b \b");
  }

  // Resize terminal on window resize, but debounce the resize
  private registerWindowResizing() {
    let debounceTimeout = null;

    window.addEventListener("resize", () => {
      if (debounceTimeout) {
        return;
      }

      debounceTimeout = setTimeout(() => {
        this.repositionTerminalWindow();

        debounceTimeout = null;
      }, CST.TERMINAL.DEBOUNCE_TIME);
    });

    this.repositionTerminalWindow();
  }

  private computeWindowPercentages() {
    let div = document.getElementById(CST.TERMINAL.ID);
    let divParent = div.parentElement;

    let computedStyle = getComputedStyle(div);
    let parentComputedStyle = getComputedStyle(divParent);

    this.windowHeightPercentage = parseInt(
      computedStyle.getPropertyValue("height")
    );
    this.windowWidthPercentage = parseInt(
      computedStyle.getPropertyValue("width")
    );

    this.windowParentWidthPercentage = parseInt(
      parentComputedStyle.getPropertyValue("width")
    );
    this.windowParentHeightPercentage = parseInt(
      parentComputedStyle.getPropertyValue("height")
    );
  }

  // Resize and reposition the terminal window corectly
  private repositionTerminalWindow() {
    if (!this.windowHeightPercentage) {
      this.computeWindowPercentages();
    }
    let bodyStyle = getComputedStyle(document.body);

    let bodyHeight = parseInt(bodyStyle.getPropertyValue("height"));
    let bodyWidth = parseInt(bodyStyle.getPropertyValue("width"));

    let realHeight =
      (this.windowHeightPercentage *
        (this.windowParentHeightPercentage * bodyHeight)) /
      10000;
    let realWidth =
      (this.windowWidthPercentage *
        (this.windowParentWidthPercentage * bodyWidth)) /
      10000;

    this.terminal.element.style.width = realWidth + "px";
    this.terminal.element.style.height = realHeight + "px";

    this.terminal.element.style.left = (bodyWidth - realWidth) / 2 + "px";
    this.terminal.element.style.top = (bodyHeight - realHeight) / 2 + "px";

    let characterSize = (this.terminal as any)._core.viewport._renderService
      ._renderer.dimensions;

    let oldCols = this.terminal.cols;

    this.terminal.resize(
      Math.floor(realWidth / characterSize.actualCellWidth) - 1,
      Math.floor(realHeight / characterSize.actualCellHeight)
    );

    if (this.terminal.cols < oldCols) {
      this.clearRow(oldCols);
    }
  }

  public open(): this {
    this.terminalWindow.openWindow();

    return this;
  }
}
