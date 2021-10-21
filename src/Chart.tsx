import React, { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Boost from "highcharts/modules/boost";
import {
  addDataPoints,
  generateRandomMessages,
  parseSerialMessages,
  SerialPlotter,
} from "./utils";
import { Legend } from "./Legend";

// enable performance boosting on highcharts
Boost(Highcharts);

export function Chart({
  config,
  websocket,
}: {
  config: SerialPlotter.Config;
  websocket: React.MutableRefObject<WebSocket | null>;
}): React.ReactElement {
  const [chart, setChart] = useState<Highcharts.Chart | null>(null);
  const [pause, setPause] = useState<boolean>(false);

  const [series, setSeries] = useState<string[]>([]);

  const axisLabelsColor = config.darkTheme ? "#DAE3E3" : "#2C353A";
  const axisGridColor = config.darkTheme ? "#2C353A" : "#ECF1F1";

  const options: Highcharts.Options = {
    boost: {
      enabled: true,
      // usePreallocated: true,
      useGPUTranslations: true,
      // Chart-level boost when there are more than 5 series in the chart
      seriesThreshold: 0,
    },
    chart: {
      animation: false,
      backgroundColor: "transparent",
      style: {
        color: "inherit",
      },
    },
    yAxis: {
      title: { text: "" },
      labels: { style: { color: axisLabelsColor } },
      gridLineColor: axisGridColor,
    },
    xAxis: {
      labels: { style: { color: axisLabelsColor } },
      gridLineColor: axisGridColor,
      gridLineWidth: 1,
    },
    title: { text: "" },
    tooltip: {
      style: {
        zIndex: 100,
      },
    },
    legend: {
      enabled: false,
    },
    credits: {
      enabled: false,
    },
    series: [],
  };

  const chartCreatedCallback = React.useCallback((chart: Highcharts.Chart) => {
    setChart(chart);

    const chartRefreshInterval = setInterval(() => {
      chart.redraw();
    }, 32);
    return () => {
      clearInterval(chartRefreshInterval);
    };
  }, []);

  // as soon as the websocket changes, subscribe to messages
  if (websocket.current) {
    websocket.current.onmessage = (res) => {
      const message: SerialPlotter.Protocol.Message = JSON.parse(res.data);

      if (
        !pause &&
        chart &&
        message.command === SerialPlotter.Protocol.Command.SERIAL_OUTPUT_STREAM
      )
        // upon message receival update the chart
        addDataPoints(parseSerialMessages(message.data), chart, setSeries);
    };
  }

  // This function gets called only in development mode
  useEffect(() => {
    if (config.generate) {
      const randomValuesInterval = setInterval(() => {
        const messages = generateRandomMessages();
        if (!pause && chart) {
          addDataPoints(parseSerialMessages(messages), chart, setSeries);
        }
      }, 32);
      return () => {
        clearInterval(randomValuesInterval);
      };
    }
  }, [pause, config, chart]);

  return (
    <div className="chart-container">
      {options && (
        <>
          <Legend
            series={chart?.series || []}
            setPause={setPause}
            pause={pause}
          />
          <div
            className="chart-container"
            style={{ width: "100%", height: "400px" }}
          >
            <HighchartsReact
              updateArgs={[true, false, false]}
              options={options}
              highcharts={Highcharts}
              callback={chartCreatedCallback}
            />
          </div>
        </>
      )}
    </div>
  );
}
