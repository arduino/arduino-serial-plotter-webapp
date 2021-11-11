// Worker.ts
// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

// Respond to message from parent thread
ctx.addEventListener("message", (event) => {
  const { command, data } = event.data;

  if (command === "cleanup") {
    buffer = "";
  }

  if (data) {
    ctx.postMessage(parseSerialMessages(data));
  }
});

let buffer = "";
const separator = "\r\n";
var re = new RegExp(`(${separator})`, "g");

export const parseSerialMessages = (
  messages: string[]
): {
  datasetNames: string[];
  parsedLines: { [key: string]: number }[];
} => {
  //add any leftover from the buffer to the first line
  const messagesAndBuffer = (buffer + messages.join(""))
    .split(re)
    .filter((message) => message.length > 0);

  // remove the previous buffer
  buffer = "";
  // check if the last message contains the delimiter, if not, it's an incomplete string that needs to be added to the buffer
  if (messagesAndBuffer[messagesAndBuffer.length - 1] !== separator) {
    buffer = messagesAndBuffer[messagesAndBuffer.length - 1];
    messagesAndBuffer.splice(-1);
  }

  const datasetNames: { [key: string]: boolean } = {};
  const parsedLines: { [key: string]: number }[] = [];

  // for each line, explode variables
  messagesAndBuffer
    .filter((message) => message !== separator)
    .forEach((message) => {
      const parsedLine: { [key: string]: number } = {};

      //there are two supported formats:
      // format1: <value1> <value2> <value3>
      // format2: name1:<value1>,name2:<value2>,name3:<value3>

      // if we find a comma, we assume the latter is being used
      let tokens: string[] = [];
      if (message.indexOf(",") > 0) {
        message.split(",").forEach((keyValue: string) => {
          let [key, value] = keyValue.split(":");
          key = key && key.trim();
          value = value && value.trim();
          if (key && key.length > 0 && value && value.length > 0) {
            tokens.push(...[key, value]);
          }
        });
      } else {
        // otherwise they are spaces
        const values = message.split(/\s/);
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
