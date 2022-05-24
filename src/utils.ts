import { ChartDataset, ChartOptions } from "chart.js";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

export interface PluggableMonitorSetting {
  // The setting identifier
  readonly id?: string;
  // A human-readable label of the setting (to be displayed on the GUI)
  readonly label?: string;
  // The setting type (at the moment only "enum" is avaiable)
  readonly type?: string;
  // The values allowed on "enum" types
  readonly values?: string[];
  // The selected value
  selectedValue: string;
}
type PluggableMonitorSettings = Record<string, PluggableMonitorSetting>;

export type EOL = "" | "\n" | "\r" | "\r\n";

export function isEOL(str: any): str is EOL {
  const eol = ["", "\n", "\r", "\r\n"];
  return typeof str === "string" && eol.includes(str);
}

interface MonitorModelState {
  autoscroll: boolean;
  timestamp: boolean;
  lineEnding: EOL;
  interpolate: boolean;
  darkTheme: boolean;
  wsPort: number;
  serialPort: string;
  connected: boolean;
  generate?: boolean;
}

export interface MonitorSettings {
  pluggableMonitorSettings: PluggableMonitorSettings;
  monitorUISettings: Partial<MonitorModelState>;
}

export namespace PluggableMonitor {
  export namespace Protocol {
    export enum ClientCommand {
      SEND_MESSAGE = "SEND_MESSAGE",
      CHANGE_SETTINGS = "CHANGE_SETTINGS",
    }

    export enum MiddlewareCommand {
      ON_SETTINGS_DID_CHANGE = "ON_SETTINGS_DID_CHANGE",
    }

    export type ClientCommandMessage = {
      command: ClientCommand;
      data: Partial<MonitorSettings> | string;
    };
    type MiddlewareCommandMessage = {
      command: MiddlewareCommand;
      data: Partial<MonitorSettings>;
    };
    type DataMessage = {
      command: unknown;
      data: string[];
    };

    export type Message =
      | ClientCommandMessage
      | MiddlewareCommandMessage
      | DataMessage;

    export function isClientCommandMessage(
      message: Message
    ): message is ClientCommandMessage {
      return (
        typeof message.command === "string" &&
        Object.keys(ClientCommand).includes(message.command)
      );
    }
    export function isMiddlewareCommandMessage(
      message: Message
    ): message is MiddlewareCommandMessage {
      return (
        typeof message.command === "string" &&
        Object.keys(MiddlewareCommand).includes(message.command)
      );
    }
    export function isDataMessage(message: Message): message is DataMessage {
      return Array.isArray(message.data);
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
        if (
          !existingDatasetNames.includes(datasetName) &&
          existingDatasetNames.length < 8
        ) {
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
          // remove the whole dataset from the chart and the map
          delete existingDatasetsMap[dataset.label!];
          chart.data.datasets.splice(s, 1);
          setForceUpdate(-1);
        }
      }
    }
    chart.update();
  }
};
