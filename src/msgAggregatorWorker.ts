// Worker.ts
// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.addEventListener("message", (event) => {
  const { command, message } = event.data;

  if (command === "cleanup") {
    buffer = "";
    discardFirstLine = true;
  }

  if (message) {
    ctx.postMessage(parseSerialMessages(message));
  }
});

let buffer = "";
let discardFirstLine = true;
const separator = "\r?\n";
const delimiter = "[, \t]+"; // Serial Plotter protocol supports Comma, Space & Tab characters as delimiters
var separatorRegex = new RegExp(`(${separator})`, "g");
var delimiterRegex = new RegExp(delimiter, "g");

export const parseSerialMessages = (
  messages: string[]
): {
  datasetNames: string[];
  parsedLines: { [key: string]: number }[];
} => {
  // when the serial is real fast, the first line can be incomplete and contain incomplete messages
  // so we need to discard it and start aggregating from the first encountered separator
  let joinMessages = messages.join("");
  if (discardFirstLine) {
    separatorRegex.lastIndex = 0; // Reset lastIndex to ensure match happens from beginning of string
    const separatorMatch = separatorRegex.exec(joinMessages);
    if (separatorMatch && separatorMatch.index > -1) {
      joinMessages = joinMessages.substring(
        separatorMatch.index + separatorMatch[0].length
      );
      discardFirstLine = false;
    } else {
      return {
        datasetNames: [],
        parsedLines: [],
      };
    }
  }

  //add any leftover from the buffer to the first line
  const messagesAndBuffer = ((buffer || "") + joinMessages)
    .split(separatorRegex)
    .filter((message) => message.length > 0);

  // remove the previous buffer
  buffer = "";
  separatorRegex.lastIndex = 0;
  // check if the last message contains the delimiter, if not, it's an incomplete string that needs to be added to the buffer
  if (!separatorRegex.test(messagesAndBuffer[messagesAndBuffer.length - 1])) {
    buffer = messagesAndBuffer[messagesAndBuffer.length - 1];
    messagesAndBuffer.splice(-1);
  }

  const datasetNames: { [key: string]: boolean } = {};
  const parsedLines: { [key: string]: number }[] = [];

  // for each line, explode variables
  separatorRegex.lastIndex = 0;
  messagesAndBuffer
    .filter((message) => !separatorRegex.test(message))
    .forEach((message) => {
      const parsedLine: { [key: string]: number } = {};

      // Part Separator symbols i.e. Space, Tab & Comma are fully supported
      // SerialPlotter protocol specifies 3 message formats. The following 2 formats are supported
      // Value only format: <value1> <value2> <value3>
      // Label-Value format: name1:<value1>,name2:<value2>,name3:<value3>

      // if we find a colon, we assume the latter is being used
      let tokens: string[] = [];
      if (message.indexOf(":") > 0) {
        message.split(delimiterRegex).forEach((keyValue: string) => {
          let [key, value] = keyValue.split(":");
          key = key && key.trim();
          value = value && value.trim();
          if (key && key.length > 0 && value && value.length > 0) {
            tokens.push(...[key, value]);
          }
        });
      } else {
        // otherwise they are unlabelled
        const values = message.split(delimiterRegex);
        values.forEach((value, i) => {
          if (value.length) {
            tokens.push(...[`value ${i + 1}`, value]);
          }
        });
      }

      for (let i = 0; i < tokens.length - 1; i = i + 2) {
        const varName = tokens[i];
        const varValue = parseFloat(tokens[i + 1]);

        //skip line endings
        if (varName.length === 0) {
          continue;
        }

        // add the variable to the map of variables
        datasetNames[varName] = true;

        parsedLine[varName] = varValue;
      }
      parsedLines.push(parsedLine);
    });

  return { parsedLines, datasetNames: Object.keys(datasetNames) };
};

export {};
