import React from "react";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";
import { LegendItem } from "./LegendItem";

export function Legend({
  chartRef,
  pause,
  setPause,
}: {
  chartRef: ChartJSOrUndefined<"line">;
  pause: boolean;
  setPause: (pause: boolean) => void;
}): React.ReactElement {
  return (
    <div className="legend">
      <div>
        {chartRef?.data.datasets.map((dataset, i) => (
          <LegendItem dataset={dataset} key={i} chartRef={chartRef} />
        ))}
      </div>
      <div className="actions">
        <button
          className="pause-button"
          onClick={() => {
            setPause(!pause);
          }}
        >
          {(pause && "RUN") || "STOP"}
        </button>
        <button
          className="clear-button"
          onClick={() => {
            if (chartRef && Array.isArray(chartRef.data.datasets)) {
              for (let dataI in chartRef?.data.datasets) {
                chartRef.data.datasets[dataI].data = [];
              }
            }
            chartRef?.update();
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.25 10.5H13.5C13.3011 10.5 13.1103 10.421 12.9697 10.2803C12.829 10.1397 12.75 9.94891 12.75 9.75C12.75 9.55109 12.829 9.36032 12.9697 9.21967C13.1103 9.07902 13.3011 9 13.5 9H20.25C20.4489 9 20.6397 9.07902 20.7803 9.21967C20.921 9.36032 21 9.55109 21 9.75C21 9.94891 20.921 10.1397 20.7803 10.2803C20.6397 10.421 20.4489 10.5 20.25 10.5Z"
              fill="#4E5B61"
            />
            <path
              d="M20.25 6H13.5C13.3011 6 13.1103 5.92098 12.9697 5.78033C12.829 5.63968 12.75 5.44891 12.75 5.25C12.75 5.05109 12.829 4.86032 12.9697 4.71967C13.1103 4.57902 13.3011 4.5 13.5 4.5H20.25C20.4489 4.5 20.6397 4.57902 20.7803 4.71967C20.921 4.86032 21 5.05109 21 5.25C21 5.44891 20.921 5.63968 20.7803 5.78033C20.6397 5.92098 20.4489 6 20.25 6Z"
              fill="#4E5B61"
            />
            <path
              d="M20.25 15H3.75C3.55109 15 3.36032 14.921 3.21967 14.7803C3.07902 14.6397 3 14.4489 3 14.25C3 14.0511 3.07902 13.8603 3.21967 13.7197C3.36032 13.579 3.55109 13.5 3.75 13.5H20.25C20.4489 13.5 20.6397 13.579 20.7803 13.7197C20.921 13.8603 21 14.0511 21 14.25C21 14.4489 20.921 14.6397 20.7803 14.7803C20.6397 14.921 20.4489 15 20.25 15Z"
              fill="#4E5B61"
            />
            <path
              d="M20.25 19.5H3.75C3.55109 19.5 3.36032 19.421 3.21967 19.2803C3.07902 19.1397 3 18.9489 3 18.75C3 18.5511 3.07902 18.3603 3.21967 18.2197C3.36032 18.079 3.55109 18 3.75 18H20.25C20.4489 18 20.6397 18.079 20.7803 18.2197C20.921 18.3603 21 18.5511 21 18.75C21 18.9489 20.921 19.1397 20.7803 19.2803C20.6397 19.421 20.4489 19.5 20.25 19.5Z"
              fill="#4E5B61"
            />
            <path
              d="M10.2829 9.9674C10.3532 10.0371 10.409 10.1201 10.4471 10.2115C10.4852 10.3029 10.5048 10.4009 10.5048 10.4999C10.5048 10.5989 10.4852 10.6969 10.4471 10.7883C10.409 10.8797 10.3532 10.9627 10.2829 11.0324C10.2132 11.1027 10.1303 11.1585 10.0389 11.1966C9.94748 11.2346 9.84945 11.2542 9.75044 11.2542C9.65143 11.2542 9.5534 11.2346 9.46201 11.1966C9.37062 11.1585 9.28766 11.1027 9.21794 11.0324L6.75044 8.5649L4.28294 11.0324C4.21322 11.1027 4.13027 11.1585 4.03888 11.1966C3.94748 11.2346 3.84945 11.2542 3.75044 11.2542C3.65143 11.2542 3.5534 11.2346 3.46201 11.1966C3.37062 11.1585 3.28766 11.1027 3.21794 11.0324C3.14765 10.9627 3.09185 10.8797 3.05377 10.7883C3.0157 10.6969 2.99609 10.5989 2.99609 10.4999C2.99609 10.4009 3.0157 10.3029 3.05377 10.2115C3.09185 10.1201 3.14765 10.0371 3.21794 9.9674L5.68544 7.4999L3.21794 5.0324C3.07671 4.89117 2.99737 4.69962 2.99737 4.4999C2.99737 4.30017 3.07671 4.10862 3.21794 3.96739C3.35917 3.82617 3.55072 3.74683 3.75044 3.74683C3.95017 3.74683 4.14171 3.82617 4.28294 3.96739L6.75044 6.4349L9.21794 3.96739C9.28787 3.89747 9.37089 3.842 9.46226 3.80415C9.55362 3.76631 9.65155 3.74683 9.75044 3.74683C9.84934 3.74683 9.94726 3.76631 10.0386 3.80415C10.13 3.842 10.213 3.89747 10.2829 3.96739C10.3529 4.03732 10.4083 4.12034 10.4462 4.21171C10.484 4.30307 10.5035 4.401 10.5035 4.4999C10.5035 4.59879 10.484 4.69672 10.4462 4.78808C10.4083 4.87945 10.3529 4.96247 10.2829 5.0324L7.81544 7.4999L10.2829 9.9674Z"
              fill="#4E5B61"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
