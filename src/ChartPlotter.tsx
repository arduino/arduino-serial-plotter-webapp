import React, {
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
  useCallback,
} from "react";

import { Line } from "react-chartjs-2";

import { addDataPoints, SerialPlotter } from "./utils";
import { Legend } from "./Legend";
import { Chart, ChartData, ChartOptions } from "chart.js";
import "chartjs-adapter-luxon";
import ChartStreaming from "chartjs-plugin-streaming";

import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";
import { MessageToBoard } from "./MessageToBoard";

// eslint-disable-next-line
import Worker from "worker-loader!./msgAggregatorWorker";
import { Snackbar } from "@arduino/arc";

Chart.register(ChartStreaming);
const worker = new Worker();

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
  const [connected, setConnected] = useState(config.connected);
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
        pointHoverRadius: 0,
      },
    },
    interaction: {
      intersect: false,
    },
    plugins: {
      tooltip: {
        caretPadding: 9,
        enabled: false, // tooltips are enabled on stop only
        bodyFont: {
          family: "Open Sans",
        },
        titleFont: {
          family: "Open Sans",
        },
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
          font: {
            family: "Open Sans",
          },
        },
        grace: "5%",
      },
      x: {
        grid: {
          color: config.darkTheme ? "#2C353A" : "#ECF1F1",
        },
        display: true,
        ticks: {
          font: {
            family: "Open Sans",
          },
          color: config.darkTheme ? "#DAE3E3" : "#2C353A",
          count: 5,
          callback: (value) => {
            return parseInt(value.toString(), 10);
          },
          align: "center",
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

  const enableTooltips = useCallback(
    (newState: boolean) => {
      (opts.plugins as any).tooltip.enabled = newState;
      opts.datasets!.line!.pointHoverRadius = newState ? 3 : 0;
      setOpts(opts);
      chartRef.current?.update();
    },
    [opts]
  );

  useEffect(() => {
    if (!config.connected) {
      setConnected(false);
      // when disconnected, force tooltips to be enabled
      enableTooltips(true);
      return;
    }

    // when the connection becomes connected, need to cleanup the previous state
    if (!connected && config.connected) {
      // cleanup buffer state
      worker.postMessage({ command: "cleanup" });
      setConnected(true);

      // restore the tooltips state (which match the pause state when connected)
      enableTooltips(pause);
    }
  }, [config.connected, connected, pause, enableTooltips]);

  const togglePause = (newState: boolean) => {
    if (newState === pause) {
      return;
    }
    if (opts.scales!.x?.type === "realtime") {
      (chartRef.current as any).options.scales.x.realtime.pause = pause;
    }
    setPause(newState);
    worker.postMessage({ command: "cleanup" });
    enableTooltips(newState);
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
      worker.postMessage({ data });
    },
  }));

  useEffect(() => {
    const addData = (event: MessageEvent<any>) => {
      addDataPoints(
        event.data,
        chartRef.current,
        opts,
        cubicInterpolationMode,
        dataPointThreshold,
        setForceUpdate
      );
    };
    worker.addEventListener("message", addData);

    return () => {
      worker.removeEventListener("message", addData);
    };
  }, [cubicInterpolationMode, opts, dataPointThreshold]);

  const wsSend = (command: string, data: string | number | boolean) => {
    if (websocket && websocket?.current?.readyState === WebSocket.OPEN) {
      websocket.current.send(
        JSON.stringify({
          command,
          data,
        })
      );
    }
  };

  return (
    <>
      <div className="chart-container">
        <Legend
          chartRef={chartRef.current}
          pause={pause}
          config={config}
          cubicInterpolationMode={cubicInterpolationMode}
          wsSend={wsSend}
          setPause={togglePause}
          setInterpolate={setInterpolate}
        />
        <div className="canvas-container">
          <Line data={initialData} ref={chartRef as any} options={opts} />
        </div>
        <MessageToBoard config={config} wsSend={wsSend} />

        {!connected && (
          <Snackbar
            anchorOrigin={{
              horizontal: "center",
              vertical: "bottom",
            }}
            autoHideDuration={7000}
            className="snackbar"
            closeable
            isOpen
            message="Board disconnected"
            theme={config.darkTheme ? "dark" : "light"}
            turnOffAutoHide
          />
        )}
      </div>
    </>
  );
}

export const ChartPlotter = React.forwardRef(_Chart);
