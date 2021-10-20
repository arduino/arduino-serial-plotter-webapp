import React, { useState, useEffect, CSSProperties } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Boost from "highcharts/modules/boost";
import {
  addDataPoints,
  generateRandomMessages,
  parseSerialMessages,
  SerialPlotter,
} from "./utils";

// enable performance boosting on highcharts
Boost(Highcharts);

export function Chart({
  config,
  websocket,
}: {
  config: SerialPlotter.Config;
  websocket: WebSocket | null;
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
      align: "left",
      verticalAlign: "top",
      itemStyle: { fontWeight: "normal", color: "inherit" },
      symbolWidth: 0,
      useHTML: true,
      labelFormatter: function () {
        const bgColor = this.visible
          ? `background-color:${this.options.color};`
          : "";
        const borderColor = `border-color:${this.options.color}`;
        const checkmark = this.visible
          ? `<svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 4.5L3.66667 7L9 1" stroke="white" stroke-width="2"/>
        </svg>`
          : "";

        return `<span style="${bgColor}${borderColor}" class="checkbox">${checkmark}</span> ${this.name}`;
      },
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
  if (websocket) {
    websocket.onmessage = (res) => {
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
    <div className="chart-container" style={{ width: "100%", height: "400px" }}>
      {options && (
        <>
          <div>
            <div className="legend">
              {series.map((serie, i) => (
                <LegendItem serie={chart?.series[i]} />
              ))}
            </div>
          </div>
          <HighchartsReact
            updateArgs={[true, false, false]}
            options={options}
            highcharts={Highcharts}
            callback={chartCreatedCallback}
          />

          {/* <button
            onClick={() => {
              setPause(!pause);
            }}
          >
            pause/resume
          </button> */}
        </>
      )}
    </div>
  );
}

export function LegendItem({
  serie,
}: {
  serie: Highcharts.Series | undefined;
}): React.ReactElement {
  const [visible, setVisible] = useState(serie?.visible);

  const bgColor = visible ? serie?.options.color?.toString() : "";
  const style: CSSProperties = {
    backgroundColor: bgColor,
    borderColor: serie?.options.color?.toString(),
  };

  return (
    <label
      onClick={() => {
        if (visible) {
          serie?.hide();
          setVisible(false);
        } else {
          serie?.show();
          setVisible(true);
        }
      }}
    >
      <span style={style} className="checkbox">
        {visible && (
          <svg
            width="10"
            height="9"
            viewBox="0 0 10 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1 4.5L3.66667 7L9 1" stroke="white" stroke-width="2" />
          </svg>
        )}
      </span>
      {serie?.name}
    </label>
  );
}
