import { ChartDataset, ChartOptions } from "chart.js";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

export namespace SerialPlotter {
  export type Config = {
    currentBaudrate: number;
    currentLineEnding: string;
    baudrates: number[];
    darkTheme: boolean;
    wsPort: number;
    interpolate: boolean;
    generate?: boolean;
  };
  export namespace Protocol {
    export enum Command {
      PLOTTER_SET_BAUDRATE = "PLOTTER_SET_BAUDRATE",
      PLOTTER_SET_LINE_ENDING = "PLOTTER_SET_LINE_ENDING",
      PLOTTER_SET_INTERPOLATE = "PLOTTER_SET_INTERPOLATE",
      PLOTTER_SEND_MESSAGE = "PLOTTER_SEND_MESSAGE",
      MIDDLEWARE_CONFIG_CHANGED = "MIDDLEWARE_CONFIG_CHANGED",
    }
    export type CommandMessage = {
      command: SerialPlotter.Protocol.Command;
      data?: any;
    };
    export type StreamMessage = string[];
    export type Message = CommandMessage | StreamMessage;

    export function isCommandMessage(
      msg: CommandMessage | StreamMessage
    ): msg is CommandMessage {
      return (msg as CommandMessage).command !== undefined;
    }
  }
}

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

      // TODO: this drops messages that arrive too fast (keeping only the first one). Is this a problem?
      if (parsedLines.length > 0) {
        return;
      }

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

const lineColors = [
  "#0072B2",
  "#D55E00",
  "#009E73",
  "#E69F00",
  "#CC79A7",
  "#56B4E9",
  "#F0E442",
  "#95A5A6",
];
const existingDatasetsMap: {
  [key: string]: ChartDataset<"line">;
} = {};

let datapointCounter = 0;

export const addDataPoints = (
  parsedMessages: {
    datasetNames: string[];
    parsedLines: { [key: string]: number }[];
  },
  chart: ChartJSOrUndefined,
  opts: ChartOptions<"line">,
  cubicInterpolationMode: "default" | "monotone",
  dataPointThreshold: number,
  setForceUpdate: React.Dispatch<any>
) => {
  if (!chart) {
    return;
  }

  // if the chart has been crated, can add data to it
  if (chart && chart.data.datasets) {
    const { datasetNames, parsedLines } = parsedMessages;

    const existingDatasetNames = Object.keys(existingDatasetsMap);

    // add missing datasets to the chart
    existingDatasetNames.length < 8 &&
      datasetNames.forEach((datasetName) => {
        if (!existingDatasetNames.includes(datasetName)) {
          const newDataset = {
            data: [],
            label: datasetName,
            borderColor: lineColors[existingDatasetNames.length],
            backgroundColor: lineColors[existingDatasetNames.length],
            borderWidth: 1,
            pointRadius: 0,
            cubicInterpolationMode,
          };

          existingDatasetsMap[datasetName] = newDataset;
          chart.data.datasets.push(newDataset);
          existingDatasetNames.push(datasetName);

          // used to force a re-render in the parent component
          setForceUpdate(existingDatasetNames.length);
        }
      });

    // iterate every parsedLine, adding each variable to the corrisponding variable in the dataset
    // if a dataset has not variable in the line, fill it with and empty value
    parsedLines.forEach((parsedLine) => {
      const xAxis =
        opts.scales!.x?.type === "realtime" ? Date.now() : datapointCounter++;

      // add empty values to datasets that are missing in the parsedLine
      Object.keys(existingDatasetsMap).forEach((datasetName) => {
        const newPoint =
          datasetName in parsedLine
            ? {
                x: xAxis,
                y: parsedLine[datasetName],
              }
            : null;

        newPoint && existingDatasetsMap[datasetName].data.push(newPoint);
      });
    });

    const oldDataValue = datapointCounter - dataPointThreshold;
    for (let s = 0; s < chart.data.datasets.length; s++) {
      const dataset = chart.data.datasets[s];

      let delCount = 0;
      for (let i = 0; i < dataset.data.length; i++) {
        if (dataset.data[i] && (dataset.data[i] as any).x < oldDataValue) {
          delCount++;
        } else {
          dataset.data.splice(0, delCount);
          break; // go to the next dataset
        }

        // purge the data if we need to remove all points
        if (dataset.data.length === delCount) {
          dataset.data = [];
        }
      }
    }
    chart.update();
  }
};
