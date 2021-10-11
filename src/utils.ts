export namespace SerialPlotter {
  export type Config = {
    currentBaudrate: number;
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
      SERIAL_OUTPUT_STREAM = "SERIAL_OUTPUT_STREAM",
    }
    export type Message = {
      command: SerialPlotter.Protocol.Command;
      data?: any;
    };
  }
}

export const generateRandomMessages = () => {
  const messages: string[] = [];

  for (let i = 0; i < 1; i++) {
    const variables = [];
    for (let j = 1; j < 9; j++) {
      // generate a random serie name
      variables.push(`serie_${j}\t${Math.floor(Math.random() * 10)}`);
    }
    let line = variables.join(" ");

    messages.push(line + "\r\n");
  }

  return messages;
};

let buffer = "";
export const parseSerialMessages = (
  messages: string[],
  separator = "\n"
): { [key: string]: number[] } => {
  //add any leftover from the buffer to the first line
  messages[0] = buffer + messages[0];

  // add the last message to the buffer if incomplete
  if (
    messages[messages.length - 1].charAt(
      messages[messages.length - 1].length - 1
    ) !== separator
  ) {
    buffer = messages[messages.length - 1];
    messages.splice(-1);
  } else {
    buffer = "";
  }

  const newVars: { [key: string]: number[] } = {};

  // for each line, explode variables
  messages.forEach((message) => {
    //there are two supported formats:
    // format1: <value1> <value2> <value3>
    // format2: name1:<value1>,name2:<value2>,name3:<value3>

    // if we find a comma, we assume the latter is being used
    let tokens: string[] = [];
    if (message.indexOf(",") > 0) {
      message.split(/\s/).forEach((keyValue: string) => {
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
        tokens.push(...[`value ${i}`, value]);
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

const DATAPOINT_THRESHOLD = 10000;
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
  chart: Highcharts.Chart
) => {
  // if the chart has been crated, can add data to it
  if (chart) {
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
    } else {
    }
    // redraw the chart after all new points have been added
    chart.redraw();
  }
};
