export namespace SerialPlotter {
  export type Config = {
    currentBaudrate: number;
    currentLineEnding: string;
    baudrates: number[];
    darkTheme: boolean;
    wsPort: number;
    generate?: boolean;
  };
  export namespace Protocol {
    export enum Command {
      PLOTTER_SET_BAUDRATE = "PLOTTER_SET_BAUDRATE",
      PLOTTER_SET_LINE_ENDING = "PLOTTER_SET_LINE_ENDING",
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

const DATAPOINT_THRESHOLD = 5_000;
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
export const addDataPoints = (
  series: { [key: string]: number[] },
  chart: Highcharts.Chart,
  setSeries: React.Dispatch<React.SetStateAction<string[]>>,
  pause: boolean
) => {
  // if the chart has been crated, can add data to it
  if (chart && !pause) {
    // add missing series
    Object.keys(series).forEach((serieName) => {
      if (!existingSeries.includes(serieName) && existingSeries.length < 7) {
        chart.addSeries(
          {
            name: serieName,
            turboThreshold: 1,
            marker: { symbol: "circle" },
            data: [],
            type: "line",
            boostThreshold: 1,
            color: lineColors[chart.series.length],
          },
          false,
          false
        );
        existingSeries.push(serieName);
      }
    });
    setSeries(existingSeries);

    let full = false;

    for (let s = 0; s < chart.series.length; s++) {
      const serie = chart.series[s];
      const serieToPopulate = series[serie.getName()];

      if (serieToPopulate) {
        for (const value of serieToPopulate) {
          const shift = serie.getValidPoints().length > DATAPOINT_THRESHOLD; // shift if the series is longer than DATAPOINT_THRESHOLD
          serie.addPoint(value, false, shift);
        }
      }

      if (serie && serie.points && serie.points.length >= DATAPOINT_THRESHOLD) {
        full = true;
      }
    }
    if (full) {
      chart.xAxis[0].setExtremes(undefined, undefined);
    }
    // redraw the chart after all new points have been added
    chart.redraw();
  }
};
