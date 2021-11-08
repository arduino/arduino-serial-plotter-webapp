import React, { useState, useRef, useImperativeHandle } from "react";

import { Line } from "react-chartjs-2";

import { addDataPoints, parseSerialMessages, SerialPlotter } from "./utils";
import { Legend } from "./Legend";
import { Chart, ChartData, ChartOptions } from "chart.js";
import "chartjs-adapter-luxon";
import ChartStreaming from "chartjs-plugin-streaming";

import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";
import { MessageToBoard } from "./MessageToBoard";

Chart.register(ChartStreaming);

function _Chart(
  {
    config,
    websocket,
  }: {
    config: SerialPlotter.Config;
    websocket: React.MutableRefObject<WebSocket | null>;
  },
  ref: React.ForwardedRef<any>
): React.ReactElement {
  const chartRef = useRef<ChartJSOrUndefined<"line">>();

  const [, setForceUpdate] = useState(0);
  const [pause, setPause] = useState(false);
  const [dataPointThreshold] = useState(50);
  const [cubicInterpolationMode, setCubicInterpolationMode] = useState<
    "default" | "monotone"
  >(config.interpolate ? "monotone" : "default");
  const [initialData] = useState<ChartData<"line">>({
    datasets: [],
  });

  const [opts, setOpts] = useState<ChartOptions<"line">>({
    animation: false,
    maintainAspectRatio: false,
    normalized: true,
    parsing: false,
    datasets: {
      line: {
        pointRadius: 0,
      },
    },
    interaction: {
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: false, // tooltips are enabled on stop only
      },
      decimation: {
        enabled: true,
        algorithm: "min-max",
      },
      legend: {
        display: false,
      },
    },
    elements: {
      line: {
        tension: 0, // disables bezier curves
      },
    },
    scales: {
      y: {
        grid: {
          color: config.darkTheme ? "#2C353A" : "#ECF1F1",
        },
        ticks: {
          color: config.darkTheme ? "#DAE3E3" : "#2C353A",
        },
        grace: "5%",
      },
      x: {
        grid: {
          color: config.darkTheme ? "#2C353A" : "#ECF1F1",
        },
        display: true,
        ticks: {
          color: config.darkTheme ? "#DAE3E3" : "#2C353A",
          count: 5,
          callback: (value) => {
            return parseInt(value.toString(), 10);
          },
        },
        type: "linear",
        bounds: "data",

        // Other notable settings:
        // type: "timeseries"
        // time: {
        //   unit: "second",
        //   stepSize: 1,
        // },

        // type: "realtime"
        // duration: 10000,
        // delay: 500,
      },
    },
  });

  const togglePause = (newState: boolean) => {
    if (newState === pause) {
      return;
    }
    if (opts.scales!.x?.type === "realtime") {
      (chartRef.current as any).options.scales.x.realtime.pause = pause;
    }
    setPause(newState);
    (opts.plugins as any).tooltip.enabled = newState;
    setOpts(opts);
  };

  const setInterpolate = (interpolate: boolean) => {
    const newCubicInterpolationMode = interpolate ? "monotone" : "default";

    if (chartRef && chartRef.current) {
      for (let i = 0; i < chartRef.current.data.datasets.length; i++) {
        const dataset = chartRef.current.data.datasets[i];
        if (dataset) {
          dataset.cubicInterpolationMode = newCubicInterpolationMode;
        }
      }
      chartRef.current.update();
      setCubicInterpolationMode(newCubicInterpolationMode);
    }
  };

  useImperativeHandle(ref, () => ({
    addNewData(data: string[]) {
      if (pause) {
        return;
      }
      // upon message receival update the chart
      addDataPoints(
        parseSerialMessages(data),
        chartRef.current,
        opts,
        cubicInterpolationMode,
        dataPointThreshold,
        setForceUpdate
      );
    },
  }));

  return (
    <>
      <div className="chart-container">
        {chartRef.current && (
          <Legend
            chartRef={chartRef.current}
            setPause={togglePause}
            pause={pause}
          />
        )}
        <div className="canvas-container">
          <Line data={initialData} ref={chartRef as any} options={opts} />
        </div>
        <MessageToBoard
          config={config}
          cubicInterpolationMode={cubicInterpolationMode}
          setInterpolate={setInterpolate}
          websocket={websocket}
        />
      </div>
    </>
  );
}

export const ChartPlotter = React.forwardRef(_Chart);
