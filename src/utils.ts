import { ChartOptions } from "chart.js";
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

export const generateRandomMessages = () => {
  const messages: string[] = [];

  for (let i = 0; i < 1; i++) {
    const variables = [];
    for (let j = 1; j < 9; j++) {
      // generate a random serie name
      variables.push(`${Math.floor(Math.random() * 10)}`);
    }
    let line = variables.join(" ");

    messages.push(line + "\r\n");
  }

  return messages;
};

let buffer = "";

export const parseSerialMessages = (
  messages: string[],
  separator = "\r\n"
): { [key: string]: number[] } => {
  var re = new RegExp(`(${separator})`, "g");
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

  const newVars: { [key: string]: number[] } = {};

  // for each line, explode variables
  messagesAndBuffer
    .filter((message) => message !== separator)
    .forEach((message) => {
      //there are two supported formats:
      // format1: <value1> <value2> <value3>
      // format2: name1:<value1>,name2:<value2>,name3:<value3>

      // if we find a comma, we assume the latter is being used
      let tokens: string[] = [];
      if (message.indexOf(",") > 0) {
        message.split(",").forEach((keyValue: string) => {
          let [key, value] = keyValue.split(":");
          key = key.trim();
          value = value.trim();
          if (key.length > 0 && value.length > 0) {
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

        if (!newVars[varName]) {
          newVars[varName] = [];
        }

        newVars[varName].push(varValue);
      }
    });

  return newVars;
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
const existingSeries: string[] = [];

let datapointCounter = 0;

export const addDataPoints = (
  series: { [key: string]: number[] },
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
    // add missing series
    existingSeries.length < 8 &&
      Object.keys(series).forEach((serieName) => {
        if (!existingSeries.includes(serieName)) {
          chart.data.datasets.push({
            data: [],
            label: serieName,
            borderColor: lineColors[existingSeries.length],
            backgroundColor: lineColors[existingSeries.length],
            borderWidth: 1,
            pointRadius: 0,
            cubicInterpolationMode,
          });

          existingSeries.push(serieName);
          setForceUpdate(existingSeries.length);
        }
      });

    const xAxis =
      opts.scales!.x?.type === "realtime" ? Date.now() : datapointCounter++;

    for (let s = 0; s < chart.data.datasets.length; s++) {
      const serie = chart.data.datasets[s];
      const serieToPopulate = series[serie.label || ""] || null;

      if (serieToPopulate) {
        for (let i = 0; i < serieToPopulate.length; i++) {
          serie.data.push({ x: xAxis, y: serieToPopulate[i] });
        }
        // remove old data if the series is longer than DATAPOINT_THRESHOLD
        if (
          serie.data.length > dataPointThreshold &&
          chart?.options?.scales?.x?.type !== "realtime"
        ) {
          serie.data.splice(0, serie.data.length - dataPointThreshold);
        }
      }
    }
    chart.update();
  }
};
