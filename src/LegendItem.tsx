import { ChartDataset } from "chart.js";
import React, { useState, CSSProperties } from "react";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

import checkmark from "./images/checkmark.svg";

export function LegendItem({
  dataset,
  chartRef,
}: {
  dataset: ChartDataset<"line">;
  chartRef: ChartJSOrUndefined<"line">;
}): React.ReactElement {
  const [visible, setVisible] = useState(!dataset.hidden);

  if (!dataset) {
    return <></>;
  }

  const bgColor = visible ? dataset.borderColor!.toString() : "";
  const style: CSSProperties = {
    backgroundColor: bgColor,
    borderColor: dataset.borderColor!.toString(),
  };

  return (
    <label
      onClick={() => {
        if (visible) {
          dataset.hidden = true;
          setVisible(false);
        } else {
          dataset.hidden = false;
          setVisible(true);
        }
        chartRef?.update();
      }}
    >
      <span style={style} className="checkbox">
        {visible && <img src={checkmark} alt="" />}
      </span>
      {dataset?.label}
    </label>
  );
}
