/**
 * Production entry point for cPanel (Phusion Passenger), which needs a startup file instead of
 * `next start`. Serves the already-built app from .next; it never builds or runs in dev mode.
 * Passenger supplies the port it routes to, so PORT is only used when started by hand.
 */
const { createServer } = require("node:http");
const next = require("next");

const DEFAULT_PORT = 3000;
const port = Number(process.env.PORT) || DEFAULT_PORT;

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`notes-web listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start notes-web:", err);
    process.exit(1);
  });
