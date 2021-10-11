# Serial Plotter WebApp

This is a SPA that receives data points over WebSocket and prints graphs. The purpose is to provide a visual and live representation of data printed to the Serial Port.

The application is designed to be as agnostic as possible regarding how and where it runs. For this reason, it accepts different settings when it's launched in order to configure the look&feel and the connection parameters.


## Main Tech/framework used

- React: as the backbone of the application
- Highcharts.js: to display data
- WebSockets: to provide a fast communication mechanism between a middle layer and the Serial Plotter (see section [How it works](#how-it-works))
- Npm: as the registry

## How it works

- As soon as the application is bootstrapped it reads the [URL parameters](#config-parameters) and uses them to set the initial state and create the WebSocket connection
- When the WebSocket connection is created, data points are collected, parsed, and printed to the chart
- The app can also send messages back to the boards via WebSocket

### Config Parameters

The Serial Plotter Web App is initialized passing a number of parameters in the URL, in the form of of QueryString (eg: http://localhost:3000?currentBaudrate=100&baudrates=100,200&darkTheme=true&wsPort=5000&generate=true).

| Name | Description | Type (default) |
|-|-|-|
| currentBaudrate | currently selected baudrate | Number(9600)|
| baudrates | populate the baudrates menu | String[]/Comma separated strings ([])|
| darkTheme | whether to use the dark version of the plotter | Boolean(false) |
| wsPort | websocket port used for communication | Number(3030) |
| generate | generate fake datapoints to print random charts (dev purposes only)| Boolean(false) |

It is possible to update the state of the serial plotter by sending the above parameters via WebSocket in the form of a JSON-stringified object, using the `MIDDLEWARE_CONFIG_CHANGED` [Command](#websocket-communication-protocol).

### Websocket Communication Protocol

Beside of the initial configuration, which is passed in via URL parameters, the communication between the app and the middlewere is implemented over WebSocket.

It's possible to send a generic JSON-stringified message from and to the Serial Plotter App, as long as it adhere the following format:

```json
{
  command: <a valid command, see below>;
  data: <the value for the command>;
}
```

The command/data fields follow the specification:

| Command Field | Data field format | Initiator | Description |
|-|-|-|-|
| "PLOTTER_SET_BAUDRATE" | number | Serial Plotter | request the Middleware to change the baudrate|
| "PLOTTER_SET_LINE_ENDING" | string | Serial Plotter|  request the Middleware to change the lineending for the messages sent from the middleware to the board|
| "PLOTTER_SEND_MESSAGE" | text | Serial Plotter | send a message to the middleware. The message will be sent over to the board |
| "MIDDLEWARE_CONFIG_CHANGED" | Object (see [config parameters](#config-parameters) ) | Middleware | Send an updated configuration from the middleware to the Serial Plotter. Used to update the state, eg: changing the color theme at runtime |
| "SERIAL_OUTPUT_STREAM" | string | Middleware | the raw data coming from the serial port that is sent by the middleware to the serial plotter |

Example of a message ready to be sent from the Serial Plotter App to the Middleware

```typescript
const websocketMessage = JSON.stringify({command: "PLOTTER_SET_BAUDRATE", data: 9600})
```

## Development

- `npm i` to install dependencies
- `npm start` to run the application in development mode @ [http://localhost:3000](http://localhost:3000)

## Deployment

Usually, there is no need to build the app manually: as soon as a new version of the `package.json` is merged into `main` branch, the CI runs and deploys the package to npm.