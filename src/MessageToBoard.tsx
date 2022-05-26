import React, { useEffect, useState } from "react";
import Select from "react-select";
import { isEOL, MonitorSettings, PluggableMonitor } from "./utils";

export function MessageToBoard({
  config,
  wsSend,
}: {
  config: Partial<MonitorSettings>;
  wsSend: (
    clientCommand: PluggableMonitor.Protocol.ClientCommandMessage
  ) => void;
}): React.ReactElement {
  const [message, setMessage] = useState("");

  const [baudRate, setBaudrate] = useState(
    config?.pluggableMonitorSettings?.baudrate?.selectedValue
  );
  const [lineEnding, setLineEnding] = useState(
    config?.monitorUISettings?.lineEnding
  );
  const [disabled, setDisabled] = useState(
    !config?.monitorUISettings?.connected
  );

  useEffect(() => {
    setBaudrate(config?.pluggableMonitorSettings?.baudrate?.selectedValue);
  }, [config.pluggableMonitorSettings]);

  useEffect(() => {
    setLineEnding(config?.monitorUISettings?.lineEnding);
  }, [config?.monitorUISettings?.lineEnding]);

  useEffect(() => {
    setDisabled(!config?.monitorUISettings?.connected);
  }, [config?.monitorUISettings?.connected]);

  const lineendings = [
    { value: "", label: "No Line Ending" },
    { value: "\n", label: "New Line" },
    { value: "\r", label: "Carriage Return" },
    { value: "\r\n", label: "Both NL & CR" },
  ];

  const baudrates = config?.pluggableMonitorSettings?.baudrate?.values?.map(
    (baud) => ({
      value: baud,
      label: `${baud} baud`,
    })
  );

  return (
    <div className="message-to-board">
      <form
        className="message-container"
        onSubmit={(e) => {
          wsSend({
            command: PluggableMonitor.Protocol.ClientCommand.SEND_MESSAGE,
            data: message + lineEnding,
          });
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
            if (event && isEOL(event.value)) {
              setLineEnding(event.value);
              wsSend({
                command:
                  PluggableMonitor.Protocol.ClientCommand.CHANGE_SETTINGS,
                data: {
                  monitorUISettings: {
                    lineEnding: event.value,
                  },
                },
              });
            }
          }}
        />
      </form>

      <div>
        <div className="baud">
          {baudrates && (
            <Select
              className="singleselect"
              classNamePrefix="select"
              isDisabled={disabled}
              value={
                baudrates[baudrates.findIndex((b) => b.value === baudRate)]
              }
              name="baudrate"
              options={baudrates}
              menuPlacement="top"
              onChange={(val) => {
                if (val) {
                  setBaudrate(val.value);
                  wsSend({
                    command:
                      PluggableMonitor.Protocol.ClientCommand.CHANGE_SETTINGS,
                    data: {
                      pluggableMonitorSettings: {
                        baudrate: {
                          ...config?.pluggableMonitorSettings?.baudrate,
                          selectedValue: val.value,
                        },
                      },
                    },
                  });
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
