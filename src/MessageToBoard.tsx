import React, { useState } from "react";
import { SerialPlotter } from "./utils";

export function MessageToBoard({
  config,
  websocket,
}: {
  config: SerialPlotter.Config;
  websocket: WebSocket | null;
}): React.ReactElement {
  const [message, setMessage] = useState("");

  return (
    <div className="message-to-board">
      <div className="baud">baud</div>
      <div className="line-ending">line-ending</div>
      <div className="message-container">
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button
          onClick={() => {
            if (websocket && websocket.readyState === WebSocket.OPEN) {
              websocket.send(
                JSON.stringify({
                  command: SerialPlotter.Protocol.Command.PLOTTER_SEND_MESSAGE,
                  data: message,
                })
              );
            }
            setMessage("");
          }}
        >
          send
        </button>
      </div>
    </div>
  );
}
