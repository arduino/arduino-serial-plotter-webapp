import React, { useState, useImperativeHandle } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Boost from "highcharts/modules/boost";
import { addDataPoints, parseSerialMessages, SerialPlotter } from "./utils";
import { Legend } from "./Legend";

// enable performance boosting on highcharts
Boost(Highcharts);

function _Chart(
  {
    config,
  }: {
    config: SerialPlotter.Config;
  },
  ref: React.ForwardedRef<any>
): React.ReactElement {
  const [chart, setChart] = useState<Highcharts.Chart | null>(null);
  const [pause, setPause] = useState<boolean>(false);

  const [, setSeries] = useState<string[]>([]);

  const axisLabelsColor = config.darkTheme ? "#DAE3E3" : "#2C353A";
  const axisGridColor = config.darkTheme ? "#2C353A" : "#ECF1F1";

  const options: Highcharts.Options = {
    boost: {
      enabled: true,
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
  }, []);

  useImperativeHandle(ref, () => ({
    addNewData(data: string[]) {
      // upon message receival update the chart
      if (chart) {
        addDataPoints(parseSerialMessages(data), chart, setSeries, pause);
      }
    },
  }));

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

export const Chart = React.forwardRef(_Chart);
