import app from "./server";
import websocket from "./websocketServer";

export default {
  fetch: app.fetch,
  websocket,
};
