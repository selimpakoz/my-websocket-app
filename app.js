const http = require("http");
const WebSocket = require("ws");
const express = require("express");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// device_code => ws
const clients = new Map();

/* -------------------------------------------------
   HEALTH CHECK
------------------------------------------------- */
app.get("/", (_, res) => {
  res.send("WebSocket server running");
});

/* -------------------------------------------------
   ADMIN PANEL → PUSH
------------------------------------------------- */
app.post("/push", (req, res) => {
  const { device_code, action, message, broadcast } = req.body;

  if (!action) {
    return res.status(400).json({
      status: "error",
      message: "action zorunlu"
    });
  }

  // 🔊 HERKESE GÖNDER
  if (broadcast === true) {
    let sent = 0;

    clients.forEach((ws, code) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "command",
          action,
          message: message || null
        }));
        sent++;
      }
    });

    console.log(`[BROADCAST] action=${action} → ${sent} device`);
    return res.json({ status: "success", sent });
  }

  // 🎯 TEK CİHAZ
  if (!device_code) {
    return res.status(400).json({
      status: "error",
      message: "device_code gerekli (broadcast yoksa)"
    });
  }

  const ws = clients.get(device_code);

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return res.status(404).json({
      status: "error",
      message: "Device not connected"
    });
  }

  ws.send(JSON.stringify({
    type: "command",
    action,
    message: message || null
  }));

  console.log(`[PUSH] ${device_code} → ${action}`);

  res.json({ status: "success" });
});

/* -------------------------------------------------
   WEBSOCKET CONNECTION
------------------------------------------------- */
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "register" && data.device_code) {
        ws.device_code = data.device_code;
        clients.set(data.device_code, ws);

        console.log("Registered:", data.device_code);
      }

    } catch (err) {
      console.log("Invalid WS JSON");
    }
  });

  ws.on("close", () => {
    if (ws.device_code) {
      clients.delete(ws.device_code);
      console.log("Disconnected:", ws.device_code);
    }
  });

  ws.on("error", (err) => {
    console.log("WS error:", err.message);
  });
});

/* -------------------------------------------------
   START
------------------------------------------------- */
server.listen(PORT, () => {
  console.log(`HTTP + WS server running on ${PORT}`);
});
