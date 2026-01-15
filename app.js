const http = require("http");
const WebSocket = require("ws");
const express = require("express");

const PORT = 3000;
const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Map();

app.get("/", (req, res) => res.send("WS server running"));

wss.on("connection", (ws, req) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "register" && data.device_code) {
        ws.device_code = data.device_code;
        clients.set(data.device_code, ws);
        ws.send(JSON.stringify({ type: "command", action: "bind" }));
        console.log("Registered:", data.device_code);
      }
    } catch (e) {
      console.log("Invalid JSON:", msg);
    }
  });

  ws.on("close", () => {
    if (ws.device_code) clients.delete(ws.device_code);
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));
