import React, { useEffect, useRef, useState } from "react";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";
import { LegendItem } from "./LegendItem";
import { MonitorSettings, PluggableMonitor } from "./utils";
import { Scrollbars } from "react-custom-scrollbars";
import Switch from "react-switch";

export function Legend({
  chartRef,
  pause,
  config,
  cubicInterpolationMode,
  wsSend,
  setPause,
  setInterpolate,
}: {
  chartRef: ChartJSOrUndefined<"line">;
  pause: boolean;
  config: Partial<MonitorSettings>;
  cubicInterpolationMode: "monotone" | "default";
  wsSend: (
    clientCommand: PluggableMonitor.Protocol.ClientCommandMessage
  ) => void;
  setPause: (pause: boolean) => void;
  setInterpolate: (interpolate: boolean) => void;
}): React.ReactElement {
  const scrollRef = useRef<Scrollbars>(null);

  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);

  const checkScrollArrows = () => {
    if (
      scrollRef.current &&
      scrollRef.current.getClientWidth() < scrollRef.current.getScrollWidth()
    ) {
      setShowScrollLeft(true);
      setShowScrollRight(true);
      if (scrollRef.current.getScrollLeft() === 0) setShowScrollLeft(false);
      if (
        scrollRef.current.getScrollLeft() +
          scrollRef.current.getClientWidth() >=
        scrollRef.current.getScrollWidth()
      )
        setShowScrollRight(false);
    } else {
      setShowScrollLeft(false);
      setShowScrollRight(false);
    }
  };

  useEffect(() => {
    checkScrollArrows();
  }, [chartRef, pause, setPause, config]);

  useEffect(() => {
    window.addEventListener("resize", checkScrollArrows);
    return () => {
      window.removeEventListener("resize", checkScrollArrows);
    };
  }, []);
  return (
    <div className="legend">
      <div className="scroll-wrap">
        {showScrollLeft && (
          <button
            className="scroll-button left"
            onClick={() => {
              scrollRef.current?.scrollLeft(
                scrollRef.current.getScrollLeft() - 100
              );
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 14.9375C8.971 14.9375 10.409 14.5013 11.6321 13.6841C12.8551 12.8668 13.8084 11.7052 14.3714 10.3462C14.9343 8.98718 15.0816 7.49175 14.7946 6.04902C14.5076 4.60628 13.7993 3.28105 12.7591 2.24089C11.719 1.20074 10.3937 0.492387 8.95098 0.205409C7.50825 -0.0815684 6.01282 0.0657188 4.65379 0.628645C3.29477 1.19157 2.13319 2.14486 1.31594 3.36795C0.498701 4.59104 0.0624998 6.029 0.0624997 7.5C0.0624995 9.47255 0.846091 11.3643 2.24089 12.7591C3.63569 14.1539 5.52745 14.9375 7.5 14.9375ZM4.99781 7.12281L8.18531 3.93531C8.2347 3.88552 8.29345 3.846 8.35819 3.81903C8.42293 3.79205 8.49237 3.77817 8.5625 3.77817C8.63263 3.77817 8.70207 3.79205 8.7668 3.81903C8.83154 3.846 8.8903 3.88552 8.93969 3.93531C8.98948 3.9847 9.029 4.04346 9.05597 4.10819C9.08294 4.17293 9.09683 4.24237 9.09683 4.3125C9.09683 4.38263 9.08294 4.45207 9.05597 4.51681C9.029 4.58154 8.98948 4.6403 8.93969 4.68969L6.12406 7.5L8.93969 10.3103C9.03972 10.4103 9.09592 10.546 9.09592 10.6875C9.09592 10.829 9.03972 10.9647 8.93969 11.0647C8.83965 11.1647 8.70397 11.2209 8.5625 11.2209C8.42102 11.2209 8.28535 11.1647 8.18531 11.0647L4.99781 7.87719C4.94802 7.8278 4.9085 7.76904 4.88152 7.70431C4.85455 7.63957 4.84067 7.57013 4.84067 7.5C4.84067 7.42987 4.85455 7.36043 4.88152 7.29569C4.9085 7.23096 4.94802 7.1722 4.99781 7.12281Z"
                fill="#424242"
              />
            </svg>
          </button>
        )}
        <Scrollbars
          ref={scrollRef}
          className="scrollbar"
          renderTrackVertical={(props) => <div {...props} className="track" />}
          renderTrackHorizontal={(props) => (
            <div {...props} className="track" />
          )}
          style={{
            height: "29px",
            marginRight: "17px",
            marginLeft: "-5px",
          }}
          onScroll={checkScrollArrows}
        >
          <div className="chart-names">
            {chartRef?.data.datasets.map((dataset, i) => (
              <LegendItem dataset={dataset} key={i} chartRef={chartRef} />
            ))}
          </div>
        </Scrollbars>
        {showScrollRight && (
          <button
            className="scroll-button right"
            onClick={() =>
              scrollRef.current?.scrollLeft(
                scrollRef.current.getScrollLeft() + 100
              )
            }
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 0.0625C6.029 0.0625 4.59104 0.498702 3.36795 1.31594C2.14486 2.13319 1.19158 3.29477 0.628649 4.65379C0.0657225 6.01282 -0.0815647 7.50825 0.205413 8.95098C0.49239 10.3937 1.20074 11.719 2.2409 12.7591C3.28105 13.7993 4.60629 14.5076 6.04902 14.7946C7.49175 15.0816 8.98718 14.9343 10.3462 14.3714C11.7052 13.8084 12.8668 12.8551 13.6841 11.6321C14.5013 10.409 14.9375 8.971 14.9375 7.5C14.9375 5.52745 14.1539 3.63569 12.7591 2.24089C11.3643 0.846091 9.47255 0.0625 7.5 0.0625ZM10.0022 7.87719L6.81469 11.0647C6.7653 11.1145 6.70655 11.154 6.64181 11.181C6.57707 11.2079 6.50763 11.2218 6.4375 11.2218C6.36737 11.2218 6.29793 11.2079 6.2332 11.181C6.16846 11.154 6.1097 11.1145 6.06032 11.0647C6.01052 11.0153 5.971 10.9565 5.94403 10.8918C5.91706 10.8271 5.90317 10.7576 5.90317 10.6875C5.90317 10.6174 5.91706 10.5479 5.94403 10.4832C5.971 10.4185 6.01052 10.3597 6.06032 10.3103L8.87594 7.5L6.06032 4.68969C5.96028 4.58965 5.90408 4.45397 5.90408 4.3125C5.90408 4.17103 5.96028 4.03535 6.06032 3.93531C6.16035 3.83528 6.29603 3.77908 6.4375 3.77908C6.57898 3.77908 6.71465 3.83528 6.81469 3.93531L10.0022 7.12281C10.052 7.1722 10.0915 7.23096 10.1185 7.29569C10.1454 7.36043 10.1593 7.42987 10.1593 7.5C10.1593 7.57013 10.1454 7.63957 10.1185 7.70431C10.0915 7.76904 10.052 7.8278 10.0022 7.87719Z"
                fill="#2C353A"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="actions">
        <label className="interpolate">
          <span>Interpolate</span>
          <Switch
            checkedIcon={false}
            uncheckedIcon={false}
            height={20}
            width={37}
            handleDiameter={14}
            offColor="#C9D2D2"
            onColor="#008184"
            onChange={(val) => {
              setInterpolate(val);
              // send new interpolation mode to middleware
              wsSend({
                command:
                  PluggableMonitor.Protocol.ClientCommand.CHANGE_SETTINGS,
                data: {
                  monitorUISettings: {
                    interpolate: val,
                  },
                },
              });
            }}
            checked={cubicInterpolationMode === "monotone"}
          />
        </label>
        <button
          disabled={!config?.monitorUISettings?.connected}
          className="pause-button"
          title={
            config?.monitorUISettings?.connected
              ? undefined
              : "Serial disconnected"
          }
          onClick={() => {
            if (!config?.monitorUISettings?.connected) return;
            setPause(!pause);
          }}
        >
          {((pause || !config?.monitorUISettings?.connected) && "RUN") ||
            "STOP"}
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
