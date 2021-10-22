import React, { useState } from "react";
import Select from "react-select";
import { SerialPlotter } from "./utils";

export function MessageToBoard({
  config,
  websocket,
}: {
  config: SerialPlotter.Config;
  websocket: React.MutableRefObject<WebSocket | null>;
}): React.ReactElement {
  const [message, setMessage] = useState("");

  const [baudRate, setBaudrate] = useState(config.currentBaudrate);
  const [lineEnding, setLineEnding] = useState(config.currentLineEnding);

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

  const wsSend = (command: string, data: string) => {
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
      <div className="message-container">
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type Message"
        />
        <button
          className={message.length === 0 ? "disabled" : ""}
          disabled={message.length === 0}
          onClick={() => {
            wsSend(
              SerialPlotter.Protocol.Command.PLOTTER_SEND_MESSAGE,
              message + lineEnding
            );
            setMessage("");
          }}
        >
          Send
        </button>
        <Select
          className="singleselect lineending"
          classNamePrefix="select"
          defaultValue={
            lineendings[lineendings.findIndex((l) => l.value === lineEnding)]
          }
          name="lineending"
          options={lineendings}
          menuPlacement="top"
          onChange={(val) => {
            if (val) {
              setLineEnding(val.value);
              wsSend(
                SerialPlotter.Protocol.Command.PLOTTER_SET_LINE_ENDING,
                val.value
              );
            }
          }}
        />
      </div>
      <div>
        <div className="baud">
          <Select
            className="singleselect"
            classNamePrefix="select"
            defaultValue={
              baudrates[baudrates.findIndex((b) => b.value === baudRate)]
            }
            name="baudrate"
            options={baudrates}
            menuPlacement="top"
            onChange={(val) => {
              if (val) {
                setBaudrate(val.value);
                wsSend(
                  SerialPlotter.Protocol.Command.PLOTTER_SET_BAUDRATE,
                  val.value.toString()
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
