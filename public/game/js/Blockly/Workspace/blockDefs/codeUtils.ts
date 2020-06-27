import Blockly, { Generator } from "blockly";

// Remove excessive identation from the code
export function removeIdentation(string: string) {
  let splitStrings = string.split("\n");

  let leadingSpaceCount =
    splitStrings[1].length - splitStrings[1].trimStart().length;

  return splitStrings.reduce((accStr: string, currString: string) => {
    // Make sure that what we are removing from the begining of the line is really whitespace
    // Otherwise don't remove anything
    if (currString.length - currString.trim().length < leadingSpaceCount) {
      return accStr + currString + "\n";
    }

    return accStr + currString.substr(leadingSpaceCount) + "\n";
  });
}

// Add the defined orders of the javascript generator
interface JSGenerator extends Generator {
  ORDER_ATOMIC: number; // 0 "" ...
  ORDER_NEW: number; // new
  ORDER_MEMBER: number; // . []
  ORDER_FUNCTION_CALL: number; // ()
  ORDER_INCREMENT: number; // ++
  ORDER_DECREMENT: number; // --
  ORDER_BITWISE_NOT: number; // ~
  ORDER_UNARY_PLUS: number; // +
  ORDER_UNARY_NEGATION: number; // -
  ORDER_LOGICAL_NOT: number; // !
  ORDER_TYPEOF: number; // typeof
  ORDER_VOID: number; // void
  ORDER_DELETE: number; // delete
  ORDER_AWAIT: number; // await
  ORDER_EXPONENTIATION: number; // **
  ORDER_MULTIPLICATION: number; // *
  ORDER_DIVISION: number; // /
  ORDER_MODULUS: number; // %
  ORDER_SUBTRACTION: number; // -
  ORDER_ADDITION: number; // +
  ORDER_BITWISE_SHIFT: number; // << >> >>>
  ORDER_RELATIONAL: number; // < <= > >=
  ORDER_IN: number; // in
  ORDER_INSTANCEOF: number; // instanceof
  ORDER_EQUALITY: number; // == != === !==
  ORDER_BITWISE_AND: number; // &
  ORDER_BITWISE_XOR: number; // ^
  ORDER_BITWISE_OR: number; // |
  ORDER_LOGICAL_AND: number; // &&
  ORDER_LOGICAL_OR: number; // ||
  ORDER_CONDITIONAL: number; // ?:
  ORDER_ASSIGNMENT: number; // = += -= **= *= /= %= <<= >>= ...
  ORDER_YIELD: number; // yield
  ORDER_COMMA: number; // ,
  ORDER_NONE: number; // (...)
}

// Just define Blockly as having JavaScript
class BlocklyWithGenerator {
  JavaScript: JSGenerator;
}

export type BlocklyJS = BlocklyWithGenerator & typeof Blockly;
