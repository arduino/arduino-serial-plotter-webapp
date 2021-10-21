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

  const [baudRate, setBaudrate] = useState("");

  const lineendings = [{ value: "none", label: "No line ending" }];

  const baudrates = config.baudrates.map((baud) => ({
    value: baud,
    label: `${baud} baud`,
  }));

  return (
    <div className="message-to-board">
      <div>
        <div className="baud">
          <Select
            className="singleselect"
            classNamePrefix="select"
            defaultValue={
              baudrates[
                baudrates.findIndex((b) => b.value === config.currentBaudrate)
              ]
            }
            name="baudrate"
            options={baudrates}
            menuPlacement="top"
          />
        </div>
        <div className="lineending">
          <Select
            className="singleselect"
            classNamePrefix="select"
            defaultValue={lineendings[0]}
            name="lineending"
            options={lineendings}
            menuPlacement="top"
          />
        </div>
      </div>
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
            if (
              websocket &&
              websocket?.current?.readyState === WebSocket.OPEN
            ) {
              websocket.current.send(
                JSON.stringify({
                  command: SerialPlotter.Protocol.Command.PLOTTER_SEND_MESSAGE,
                  data: message,
                })
              );
            }
            setMessage("");
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
