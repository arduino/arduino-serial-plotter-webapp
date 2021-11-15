import React, { useEffect, useState } from "react";
import Select from "react-select";
import { SerialPlotter } from "./utils";

export function MessageToBoard({
  config,
  wsSend,
}: {
  config: SerialPlotter.Config;
  wsSend: (command: string, data: string | number | boolean) => void;
}): React.ReactElement {
  const [message, setMessage] = useState("");

  const [baudRate, setBaudrate] = useState(config.currentBaudrate);
  const [lineEnding, setLineEnding] = useState(config.currentLineEnding);
  const [disabled, setDisabled] = useState(!config.connected);

  useEffect(() => {
    setBaudrate(config.currentBaudrate);
  }, [config.currentBaudrate]);

  useEffect(() => {
    setLineEnding(config.currentLineEnding);
  }, [config.currentLineEnding]);

  useEffect(() => {
    setDisabled(!config.connected);
  }, [config.connected]);

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
          className="message-to-board-input"
          type="text"
          disabled={disabled}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type Message"
        />
        <button
          type="submit"
          className={"message-to-board-send-button"}
          disabled={message.length === 0 || disabled}
        >
          Send
        </button>

        <Select
          className="singleselect lineending"
          classNamePrefix="select"
          isDisabled={disabled}
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

      <div>
        <div className="baud">
          <Select
            className="singleselect"
            classNamePrefix="select"
            isDisabled={disabled}
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
