import React, { useEffect, useState, useCallback, useRef } from "react";
import { ChartPlotter } from "./ChartPlotter";
import { namedVariablesMulti } from "./fakeMessagsGenerators";
import { SerialPlotter } from "./utils";

export default function App() {
  const [config, setConfig] = useState<SerialPlotter.Config | null>(null);

  const websocket = useRef<WebSocket | null>(null);

  const chartRef = useRef<any>();

  const onMiddlewareMessage = useCallback(
    (
      message:
        | SerialPlotter.Protocol.StreamMessage
        | SerialPlotter.Protocol.CommandMessage
    ) => {
      // if there is no command
      if (!SerialPlotter.Protocol.isCommandMessage(message)) {
        chartRef && chartRef.current && chartRef.current.addNewData(message);
        return;
      }

      if (
        message.command ===
        SerialPlotter.Protocol.Command.MIDDLEWARE_CONFIG_CHANGED
      ) {
        const { darkTheme, serialPort, connected } =
          message.data as SerialPlotter.Config;

        let updateTitle = false;
        let serialNameTitle = config?.serialPort;
        if (typeof serialPort !== "undefined") {
          serialNameTitle = serialPort;
          updateTitle = true;
        }

        let connectedTitle = connected === false ? " (disconnected)" : "";
        if (typeof connected !== "undefined") {
          connectedTitle = connected === false ? " (disconnected)" : "";
          updateTitle = true;
        }

        if (updateTitle) {
          document.title = `${serialNameTitle}${connectedTitle}`;
        }

        if (typeof darkTheme !== "undefined") {
          darkTheme
            ? document.body.classList.add("dark")
            : document.body.classList.remove("dark");
        }
        setConfig((c) => ({ ...c, ...message.data }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, setConfig]
  );

  // as soon as the wsPort is set, create a websocket connection
  React.useEffect(() => {
    if (!config?.wsPort) {
      return;
    }

    console.log(`opening ws connection on localhost:${config?.wsPort}`);
    websocket.current = new WebSocket(`ws://localhost:${config?.wsPort}`);
    websocket.current.onmessage = (res: any) => {
      const message: SerialPlotter.Protocol.Message = JSON.parse(res.data);
      onMiddlewareMessage(message);
    };
    const wsCurrent = websocket.current;

    return () => {
      console.log("closing ws connection");
      wsCurrent.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.wsPort]);

  // at bootstrap read params from the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const urlSettings: SerialPlotter.Config = {
      currentBaudrate: parseInt(urlParams.get("currentBaudrate") || "9600"),
      currentLineEnding: urlParams.get("lineEnding") || "\n",
      baudrates: (urlParams.get("baudrates") || "")
        .split(",")
        .map((baud: string) => parseInt(baud)),
      darkTheme: urlParams.get("darkTheme") === "true",
      wsPort: parseInt(urlParams.get("wsPort") || "3030"),
      interpolate: urlParams.get("interpolate") === "true",
      serialPort: urlParams.get("serialPort") || "/serial/port/address",
      connected: urlParams.get("connected") === "true",
      generate: urlParams.get("generate") === "true",
    };

    if (config === null) {
      onMiddlewareMessage({
        command: SerialPlotter.Protocol.Command.MIDDLEWARE_CONFIG_CHANGED,
        data: urlSettings,
      });
    }
  }, [config, onMiddlewareMessage]);

  // If in "generate" mode, create fake data
  useEffect(() => {
    if (config?.generate) {
      const randomValuesInterval = setInterval(() => {
        const messages = namedVariablesMulti();
        onMiddlewareMessage(messages);
      }, 32);
      return () => {
        clearInterval(randomValuesInterval);
      };
    }
  }, [config, onMiddlewareMessage]);

  return (
    (config && (
      <ChartPlotter config={config} ref={chartRef} websocket={websocket} />
    )) ||
    null
  );
}
