# Serial Plotter WebApp

[![Test TypeScript status](https://github.com/arduino/arduino-serial-plotter-webapp/actions/workflows/test-typescript-npm.yml/badge.svg)](https://github.com/arduino/arduino-serial-plotter-webapp/actions/workflows/test-typescript-npm.yml)

This is a SPA that receives data points over WebSocket and prints graphs. The purpose is to provide a visual and live representation of data printed to the Serial Port.

The application is designed to be as agnostic as possible regarding how and where it runs. For this reason, it accepts different settings when it's launched in order to configure the look&feel and the connection parameters.


## Main Tech/framework used

- React: as the backbone of the application
- Chart.js: to display data
- WebSockets: to provide a fast communication mechanism between a middle layer and the Serial Plotter (see section [How it works](#how-it-works))
- Npm: as the registry

## How it works

- As soon as the application is bootstrapped it reads the [URL parameters](#config-parameters) and uses them to set the initial state and create the WebSocket connection
- When the WebSocket connection is created, data points are collected, parsed, and printed to the chart
- The app can also send messages and change some configuration sending appropriate commands via WebSocket

### Config Parameters

The Serial Plotter Web App is initialized by passing a number of parameters in the URL, in the form of a QueryString (eg: http://localhost:3000?darkTheme=true&wsPort=5000&generate=true).

It is possible to update the state of the serial plotter by sending configuration via WebSocket in the form of a JSON-stringified object see the [Command](#websocket-communication-protocol) section below.

### Websocket Communication Protocol

Besides the initial configuration, which is passed in via URL parameters, the communication between the app and the middleware is implemented over WebSocket.

It's possible to send JSON-stringified messages between the Serial Plotter App and the Middleware, as long as they adhere to the following format:

```
{
  command: <a valid command, see below>,
  data: <the value for the command>
}
```

There are 4 different messages that can be sent/received:

1. **Data Messages**: a message sent from the Middleware to the Serial Plotter App. This is the actual data received by the pluggable monitor that needs to be displayed in the Serial Plotter App.

    example: 
    ```
    {
      command: "", // empty
      data: string[] // the data received from the pluggable monitor
    }
    ```

2. **Middleware Commands**: a command sent from the server to the Serial Plotter App to communicate a change in the settings

    example:
    ```
    {
      command: "ON_SETTINGS_DID_CHANGE",
      data: Partial<MonitorSettings> // see section below
    }
    ```

3. **Client Commands - Send Message**: a command sent by the client to deliver a string to the connected board

    example:
    ```
    {
      command: "SEND_MESSAGE",
      data: string
    }
    ```

4. **Client Commands - Change Settings**: a command sent by the client to change some settings in the UI or in the connected board

    example:
    ```
    {
      command: "CHANGE_SETTINGS",
      data: Partial<MonitorSettings> // see section below
    }
    ```

#### Monitor Settings

Settings changes, sent and received in the Serial Plotter App, must have the following object structure

```
Partial<MonitorSettings> = {
  pluggableMonitorSettings: PluggableMonitorSettings;
  monitorUISettings: Partial<MonitorModelState>;
}
```

That means a Setting Message can contain `pluggableMonitorSettings` and/or `monitorUISettings`.

Let's take a look at the difference between the two:

1. **pluggableMonitorSettings**: a map of settings specific for the board attached to the pluggable monitor. Since every board has different capabilities, the settings are different and the structure is a map of key/value pairs. The `value` is an object with the following structure:

    ```
    {
      // The setting identifier
      readonly id?: string;
      // A human-readable label of the setting (to be displayed on the GUI)
      readonly label?: string;
      // The setting type (at the moment only "enum" is available)
      readonly type?: string;
      // The values allowed on "enum" types
      readonly values?: string[];
      // The selected value
      selectedValue: string;
    }
    ```

    example: 
    ```
    pluggableMonitorSettings: {
      baudrate: {
        id: "baudrate",
        label: "Baudrate",
        type: "enum",
        values: ["300","9600", "115200"],
        selectedValue: "9600"
      },
      otherSetting: {
        id: "otherSetting",
        label: "Other Setting",
        type: "enum",
        values: ["A","B", "C"],
        selectedValue: "B"
      }
    }

    ```

2. **monitorUISettings**: settings that are used in the UIs of the Serial Plotter App. 
These are sent to the middleware to be stored and propagated to other clients.

    When a client connected to the same websocket change one of the following settings, the change should be stored in the backend (for future re-use) and immediately propagated to all connected clients in order to update their UIs.

    `monitorUISettings` is an object with the following structure:
    ```
    {
      // used by the serial monitors to stick at the bottom of the window
      autoscroll: boolean;
      // used by the serial monitors to show the timestamp next to the actual data
      timestamp: boolean;
      // used by the clients to store the information about the last EOL used when sending a message to the board
      lineEnding: EOL;
      // used by the Serial Plotter App to interpolate the chart
      interpolate: boolean;
      // the theme the user choosed
      darkTheme: boolean;
      // the current websocket port where the communication happens
      wsPort: number;
      // the port the pluggable monitor in the middleware is connected to
      serialPort: string;
      // the connection status of the pluggable monitor to the actual board
      connected: boolean;
    }
    ```

## Development

- `npm i` to install dependencies
- `npm test` to run automated tests
- `npm start` to run the application in development mode @ [http://localhost:3000](http://localhost:3000)

## Deployment

Usually, there is no need to build the app manually: as soon as a new version of the `package.json` is merged into `main` branch, the CI runs and deploys the package to npm.

## Security

If you think you found a vulnerability or other security-related bug in this project, please read our [security policy](https://github.com/arduino/arduino-serial-plotter-webapp/security/policy) and report the bug to our Security Team 🛡️ Thank you!

e-mail contact: security@arduino.cc
