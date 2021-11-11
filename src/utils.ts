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
    serialPort: string;
    connected: boolean;
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

let existingDatasetsMap: {
  [key: string]: ChartDataset<"line">;
} = {};

export const resetExistingDatasetsMap = () => {
  existingDatasetsMap = {};
};
export const resetDatapointCounter = () => {
  datapointCounter = 0;
};

export let datapointCounter = 0;

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
