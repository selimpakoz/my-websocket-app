const http = require("http");
const WebSocket = require("ws");
const express = require("express");

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Map();

// --- Basic HTTP test ---
app.get("/", (req, res) => res.send("WS server running"));

// --- CI3 push endpoint ---
app.post("/push", (req, res) => {
  const { device_code, action } = req.body;

  if (!device_code || !action) {
    return res.status(400).json({ status: "error", message: "device_code ve action gerekli" });
  }

  const ws = clients.get(device_code);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "command", action }));
    console.log(`Sent '${action}' to ${device_code}`);
    return res.json({ status: "success", message: "Command sent" });
  } else {
    console.log(`Device ${device_code} not connected`);
    return res.status(404).json({ status: "error", message: "Device not connected" });
  }
});

// --- WebSocket connection ---
wss.on("connection", (ws, req) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "register" && data.device_code) {
        ws.device_code = data.device_code;
        clients.set(data.device_code, ws);
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

// --- Start server ---
server.listen(PORT, () => console.log(`HTTP + WS server running on port ${PORT}`));
