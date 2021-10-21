import React, { useEffect, useState, useCallback, useRef } from "react";
import { Chart } from "./Chart";
import { MessageToBoard } from "./MessageToBoard";
import { SerialPlotter } from "./utils";

export default function App() {
  const [config, setConfig] = useState<SerialPlotter.Config | null>(null);

  const websocket = useRef<WebSocket | null>(null);

  const onMiddlewareMessage = useCallback(
    (message: SerialPlotter.Protocol.Message) => {
      if (
        message.command ===
        SerialPlotter.Protocol.Command.MIDDLEWARE_CONFIG_CHANGED
      ) {
        // set document dark theme
        const { darkTheme } = message.data as SerialPlotter.Config;
        if (darkTheme) {
          document.body.classList.add("dark");
        } else {
          document.body.classList.remove("dark");
        }
        setConfig(message.data);
      }
    },
    [setConfig]
  );

  // as soon as the wsPort is set, create a websocket connection
  React.useEffect(() => {
    if (!config?.wsPort) {
      return;
    }

    websocket.current = new WebSocket(`ws://localhost:${config?.wsPort}`);
    websocket.current.onmessage = (res: any) => {
      const message: SerialPlotter.Protocol.Message = JSON.parse(res.data);
      onMiddlewareMessage(message);
    };
    const wsCurrent = websocket.current;

    return () => {
      wsCurrent.close();
    };
  }, [config?.wsPort, onMiddlewareMessage]);

  // at bootstrap read params from the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const urlSettings: SerialPlotter.Config = {
      currentBaudrate: parseInt(urlParams.get("currentBaudrate") || "9600"),
      baudrates: (urlParams.get("baudrates") || "")
        .split(",")
        .map((baud: string) => parseInt(baud)),
      darkTheme: urlParams.get("darkTheme") === "true",
      wsPort: parseInt(urlParams.get("wsPort") || "3030"),
      generate: urlParams.get("generate") === "true",
    };

    if (config === null) {
      onMiddlewareMessage({
        command: SerialPlotter.Protocol.Command.MIDDLEWARE_CONFIG_CHANGED,
        data: urlSettings,
      });
    }
  }, [onMiddlewareMessage, config]);

  return (
    (config && (
      <>
        <Chart config={config} websocket={websocket} />
        <MessageToBoard config={config} websocket={websocket} />
      </>
    )) ||
    null
  );
}
