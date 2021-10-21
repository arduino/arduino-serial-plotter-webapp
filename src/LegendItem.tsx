import React, { useState, CSSProperties } from "react";
import Highcharts from "highcharts";

import checkmark from "./images/checkmark.svg";

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
        {visible && <img src={checkmark} alt="" />}
      </span>
      {serie?.name}
    </label>
  );
}
