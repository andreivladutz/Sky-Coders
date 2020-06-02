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
