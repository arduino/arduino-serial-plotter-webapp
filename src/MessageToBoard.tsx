import React, { useEffect, useState } from "react";
import Select from "react-select";
import { SerialPlotter } from "./utils";
import Switch from "react-switch";

export function MessageToBoard({
  config,
  cubicInterpolationMode,
  setInterpolate,
  websocket,
}: {
  config: SerialPlotter.Config;
  cubicInterpolationMode: "monotone" | "default";
  setInterpolate: (interpolate: boolean) => void;
  websocket: React.MutableRefObject<WebSocket | null>;
}): React.ReactElement {
  const [message, setMessage] = useState("");

  const [baudRate, setBaudrate] = useState(config.currentBaudrate);
  const [lineEnding, setLineEnding] = useState(config.currentLineEnding);

  useEffect(() => {
    setBaudrate(config.currentBaudrate);
  }, [config.currentBaudrate]);

  useEffect(() => {
    setLineEnding(config.currentLineEnding);
  }, [config.currentLineEnding]);

  const lineendings = [
    { value: "", label: "No Line Ending" },
    { value: "\n", label: "New Line" },
    { value: "\r", label: "Carriage Return" },
    { value: "\r\n", label: "Both NL & CR" },
  ];

  const baudrates = config.baudrates.map((baud) => ({
    value: baud,
    label: `${baud} baud`,
  }));

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
    <div className="message-to-board">
      <form
        className="message-container"
        onSubmit={(e) => {
          wsSend(
            SerialPlotter.Protocol.Command.PLOTTER_SEND_MESSAGE,
            message + lineEnding
          );
          setMessage("");
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type Message"
        />
        <button
          type="submit"
          className={message.length === 0 ? "disabled" : ""}
          disabled={message.length === 0}
        >
          Send
        </button>

        <Select
          className="singleselect lineending"
          classNamePrefix="select"
          value={
            lineendings[lineendings.findIndex((l) => l.value === lineEnding)]
          }
          name="lineending"
          options={lineendings}
          menuPlacement="top"
          onChange={(event) => {
            if (event) {
              setLineEnding(event.value);
              wsSend(
                SerialPlotter.Protocol.Command.PLOTTER_SET_LINE_ENDING,
                event.value
              );
            }
          }}
        />
      </form>
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
            wsSend(SerialPlotter.Protocol.Command.PLOTTER_SET_INTERPOLATE, val);
          }}
          checked={cubicInterpolationMode === "monotone"}
        />
      </label>
      <div>
        <div className="baud">
          <Select
            className="singleselect"
            classNamePrefix="select"
            value={baudrates[baudrates.findIndex((b) => b.value === baudRate)]}
            name="baudrate"
            options={baudrates}
            menuPlacement="top"
            onChange={(val) => {
              if (val) {
                setBaudrate(val.value);
                wsSend(
                  SerialPlotter.Protocol.Command.PLOTTER_SET_BAUDRATE,
                  val.value
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
