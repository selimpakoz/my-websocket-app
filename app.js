const http = require("http");
const WebSocket = require("ws");
const express = require("express");

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Map();

// -------------------------------------------------
// HTTP test
// -------------------------------------------------
app.get("/", (req, res) => {
  res.send("WS server running");
});


// -------------------------------------------------
// PUSH → SADECE PAIRING / BIND
// -------------------------------------------------
app.post("/push", (req, res) => {
  const { device_code } = req.body;

  if (!device_code) {
    return res.status(400).json({
      status: "error",
      message: "device_code gerekli"
    });
  }

  const ws = clients.get(device_code);

  if (ws && ws.readyState === WebSocket.OPEN) {

    ws.send(JSON.stringify({
      type: "command",
      action: "bind"
    }));

    console.log(`[BIND] ${device_code}`);

    return res.json({
      status: "success",
      message: "Bind command sent"
    });

  } else {
    console.log(`[BIND FAIL] ${device_code} not connected`);

    return res.status(404).json({
      status: "error",
      message: "Device not connected"
    });
  }
});


// -------------------------------------------------
// CONTENT UPDATED → SADECE SCENE / CONTENT UPDATE
// -------------------------------------------------
app.post("/content_updated", (req, res) => {
  const { device_code } = req.body;

  if (!device_code) {
    return res.status(400).json({
      status: "error",
      message: "device_code gerekli"
    });
  }

  const ws = clients.get(device_code);

  if (ws && ws.readyState === WebSocket.OPEN) {

    ws.send(JSON.stringify({
      type: "command",
      action: "content_updated"
    }));

    console.log(`[CONTENT UPDATED] ${device_code}`);

    return res.json({
      status: "success",
      message: "content_updated sent"
    });

  } else {
    console.log(`[CONTENT UPDATE FAIL] ${device_code} not connected`);

    return res.status(404).json({
      status: "error",
      message: "Device not connected"
    });
  }
});


// -------------------------------------------------
// WebSocket Connection
// -------------------------------------------------
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // DEVICE REGISTER
      if (data.type === "register" && data.device_code) {
        ws.device_code = data.device_code;
        clients.set(data.device_code, ws);

        console.log("Registered:", data.device_code);
      }

    } catch (err) {
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


// -------------------------------------------------
// Start Server
// -------------------------------------------------
server.listen(PORT, () => {
  console.log(`HTTP + WS server running on port ${PORT}`);
});
