const http = require("http");
const WebSocket = require("ws");
const express = require("express");

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Map();

app.get("/", (req, res) => res.send("WS server running"));


app.post("/push", (req, res) => {
  const { device_code, action, message } = req.body;

  if (!device_code || !action) {
    return res.status(400).json({
      status: "error",
      message: "device_code ve action gerekli"
    });
  }

  const ws = clients.get(device_code);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "command",
      action,             
      message: message || null
    }));

    console.log(`[PUSH] ${device_code} → action=${action}`);

    return res.json({
      status: "success",
      message: "Command sent"
    });

  } else {
    console.log(`[PUSH FAIL] ${device_code} not connected`);
    return res.status(404).json({
      status: "error",
      message: "Device not connected"
    });
  }
});


wss.on("connection", (ws, req) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);


      if (data.type === "register" && data.device_code) {
        ws.device_code = data.device_code;
        clients.set(data.device_code, ws);

        console.log("Registered:", data.device_code);

        ws.send(JSON.stringify({
          type: "command",
          action: "register",
          message: "Cihaz tanımlandı, içerikler yükleniyor"
        }));
      }

    } catch (e) {
      console.log("Invalid JSON:", msg);
    }
  });

  ws.on("close", () => {
    if (ws.device_code) {
      clients.delete(ws.device_code);
      console.log("Client disconnected:", ws.device_code);
    }
  });

  ws.on("error", (err) => {
    console.log("WS error:", err.message);
  });
});

server.listen(PORT, () =>
  console.log(`HTTP + WS server running on port ${PORT}`)
);
