import { useEffect, useState, useCallback, useRef } from "react";
import { ChartPlotter } from "./ChartPlotter";
import { namedVariablesMulti } from "./fakeMessagsGenerators";
import { EOL, isEOL, MonitorSettings, PluggableMonitor } from "./utils";

export default function App() {
  const [config, setConfig] = useState<Partial<MonitorSettings | null>>(null);

  const [webSocketPort, setWebsocketPort] = useState<number>();
  const [serialPort, setSerialPort] = useState<string>();

  const [websocketIsConnected, setWebsocketIsConnected] = useState(false);

  const websocket = useRef<WebSocket | null>(null);

  const chartRef = useRef<any>();

  const wsSend = useCallback(
    (clientCommand: PluggableMonitor.Protocol.ClientCommandMessage) => {
      if (websocket.current?.readyState === WebSocket.OPEN) {
        websocket.current.send(JSON.stringify(clientCommand));
      }
    },
    []
  );

  const onMiddlewareMessage = useCallback(
    (message: PluggableMonitor.Protocol.Message) => {
      // if there is no command
      if (PluggableMonitor.Protocol.isDataMessage(message)) {
        chartRef && chartRef.current && chartRef.current.addNewData(message);
        return;
      }

      if (PluggableMonitor.Protocol.isMiddlewareCommandMessage(message)) {
        const {
          autoscroll,
          timestamp,
          lineEnding,
          interpolate,
          darkTheme,
          wsPort,
          serialPort: serialPortExtracted,
          connected,
          generate,
          dataPointThreshold,
        } = message.data.monitorUISettings || {};

        let updateTitle = false;
        let serialNameTitle = serialPort;
        if (typeof serialPortExtracted !== "undefined") {
          serialNameTitle = serialPortExtracted;
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

        // ** we should not set a "setting" as undefined FROM THE IDE,
        // ** more specifically we will not overwrite a given "setting" if we receive a message from the IDE that doesn't include it,
        // ** we only overwrite a given "setting" if we recieve a value for it (that's not undefined) from the IDE

        const { id, label, type, values, selectedValue } =
          message.data.pluggableMonitorSettings?.baudrate || {};

        setConfig((prevConfig) => ({
          pluggableMonitorSettings: {
            baudrate: {
              id:
                typeof id === "undefined"
                  ? prevConfig?.pluggableMonitorSettings?.baudrate?.id
                  : id,
              label:
                typeof label === "undefined"
                  ? prevConfig?.pluggableMonitorSettings?.baudrate?.label
                  : label,
              type:
                typeof type === "undefined"
                  ? prevConfig?.pluggableMonitorSettings?.baudrate?.type
                  : type,
              values:
                typeof values === "undefined"
                  ? prevConfig?.pluggableMonitorSettings?.baudrate?.values
                  : values,
              selectedValue:
                typeof selectedValue === "undefined"
                  ? prevConfig?.pluggableMonitorSettings?.baudrate
                      ?.selectedValue || "9600"
                  : selectedValue,
            },
          },
          monitorUISettings: {
            autoscroll:
              typeof autoscroll === "undefined"
                ? prevConfig?.monitorUISettings?.autoscroll
                : autoscroll,
            timestamp:
              typeof timestamp === "undefined"
                ? prevConfig?.monitorUISettings?.timestamp
                : timestamp,
            lineEnding:
              typeof lineEnding === "undefined"
                ? prevConfig?.monitorUISettings?.lineEnding
                : lineEnding,
            interpolate:
              typeof interpolate === "undefined"
                ? prevConfig?.monitorUISettings?.interpolate
                : interpolate,
            darkTheme:
              typeof darkTheme === "undefined"
                ? prevConfig?.monitorUISettings?.darkTheme
                : darkTheme,
            connected:
              typeof connected === "undefined"
                ? prevConfig?.monitorUISettings?.connected
                : connected,
            generate:
              typeof generate === "undefined"
                ? prevConfig?.monitorUISettings?.generate
                : generate,
            dataPointThreshold:
              typeof dataPointThreshold === "undefined"
                ? prevConfig?.monitorUISettings?.dataPointThreshold
                : dataPointThreshold,
          },
        }));

        if (typeof serialPortExtracted !== "undefined") {
          setSerialPort(serialPortExtracted);
        }
        if (typeof wsPort !== "undefined") {
          setWebsocketPort(wsPort);
        }
      }
    },
    [serialPort]
  );

  // as soon as the wsPort is set, create a websocket connection
  useEffect(() => {
    if (!webSocketPort) {
      return;
    }

    console.log(`opening ws connection on localhost:${webSocketPort}`);
    websocket.current = new WebSocket(`ws://localhost:${webSocketPort}`);
    setWebsocketIsConnected(true);

    const wsCurrent = websocket.current;
    return () => {
      console.log("closing ws connection");
      wsCurrent.close();
    };
  }, [webSocketPort]);

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
            selectedValue: urlParams.get("currentBaudrate") || "9600",
          },
        },
        monitorUISettings: {
          lineEnding: isEOL(urlParams.get("lineEnding"))
            ? (urlParams.get("lineEnding") as EOL)
            : "\n",
          darkTheme: urlParams.get("darkTheme") === "true",
          wsPort: parseInt(urlParams.get("wsPort") || "3030"),
          interpolate: urlParams.get("interpolate") === "true",
          serialPort: urlParams.get("serialPort") || "/serial/port/address",
          connected: urlParams.get("connected") === "true",
          generate: urlParams.get("generate") === "true",
          dataPointThreshold: parseInt(
            urlParams.get("dataPointThreshold") || "50"
          ),
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
      <ChartPlotter config={config} wsSend={wsSend} ref={chartRef} />
    )) ||
    null
  );
}
