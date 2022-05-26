import { useEffect, useState, useCallback, useRef } from "react";
import { ChartPlotter } from "./ChartPlotter";
import { namedVariablesMulti } from "./fakeMessagsGenerators";
import { EOL, isEOL, MonitorSettings, PluggableMonitor } from "./utils";

export default function App() {
  const [config, setConfig] = useState<Partial<MonitorSettings | null>>(null);
  const [websocketIsConnected, setWebsocketIsConnected] = useState(false);

  const websocket = useRef<WebSocket | null>(null);

  const chartRef = useRef<any>();

  const onMiddlewareMessage = useCallback(
    (message: PluggableMonitor.Protocol.Message) => {
      // if there is no command
      if (PluggableMonitor.Protocol.isDataMessage(message)) {
        chartRef && chartRef.current && chartRef.current.addNewData(message);
        return;
      }

      if (PluggableMonitor.Protocol.isMiddlewareCommandMessage(message)) {
        const { darkTheme, serialPort, connected } =
          message.data.monitorUISettings || {};

        let updateTitle = false;
        let serialNameTitle = config?.monitorUISettings?.serialPort;
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
    [config?.monitorUISettings?.serialPort]
  );

  // as soon as the wsPort is set, create a websocket connection
  useEffect(() => {
    if (!config?.monitorUISettings?.wsPort) {
      return;
    }

    console.log(
      `opening ws connection on localhost:${config?.monitorUISettings?.wsPort}`
    );
    websocket.current = new WebSocket(
      `ws://localhost:${config?.monitorUISettings?.wsPort}`
    );
    setWebsocketIsConnected(true);

    const wsCurrent = websocket.current;
    return () => {
      console.log("closing ws connection");
      wsCurrent.close();
    };
  }, [config?.monitorUISettings?.wsPort]);

  useEffect(() => {
    if (websocketIsConnected && websocket.current) {
      websocket.current.onmessage = (res: any) => {
        const message: PluggableMonitor.Protocol.Message = JSON.parse(res.data);
        onMiddlewareMessage(message);
      };
    }
  }, [websocketIsConnected, onMiddlewareMessage]);

  // at bootstrap read params from the URL
  useEffect(() => {
    if (config === null) {
      const urlParams = new URLSearchParams(window.location.search);

      const urlSettings: MonitorSettings = {
        pluggableMonitorSettings: {
          baudrate: {
            id: "baudrate",
            label: "Baudrate",
            type: "enum",
            values: (urlParams.get("baudrates") || "").split(","),
            selectedValue: urlParams.get("baudrate") || "9600",
          },
        },
        monitorUISettings: {
          lineEnding: isEOL(urlParams.get("lineEnding"))
            ? (urlParams.get("lineEnding") as EOL)
            : "\r\n",
          darkTheme: urlParams.get("darkTheme") === "true",
          wsPort: parseInt(urlParams.get("wsPort") || "3030"),
          interpolate: urlParams.get("interpolate") === "true",
          serialPort: urlParams.get("serialPort") || "/serial/port/address",
          connected: urlParams.get("connected") === "true",
          generate: urlParams.get("generate") === "true",
        },
      };

      onMiddlewareMessage({
        command:
          PluggableMonitor.Protocol.MiddlewareCommand.ON_SETTINGS_DID_CHANGE,
        data: urlSettings,
      });
    }
  }, [config, onMiddlewareMessage]);

  // If in "generate" mode, create fake data
  useEffect(() => {
    if (config?.monitorUISettings?.generate) {
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
