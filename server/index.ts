import express from "express"
import http from "http"
import throttle from "lodash.throttle"
import path from "path"
import { Server } from "socket.io"
import { droneState, initDrone } from "./utils/tello"

const app = express()
const server = http.createServer(app)
const io = new Server(server)

initDrone()

app.use(express.static(path.join(__dirname, "../public")))

app.get("/", (_req, res) => {
  res.send("index.html")
})

app.get("/ping", (_req, res) => {
  return res.json({ ping: "pong!" })
})

io.on("connection", (socket) => {
  console.log("a user connected")
})

droneState.on(
  "message",
  throttle((msg: Buffer) => {
    const telemetry = msg.toString()
    io.emit("telemetry", { telemetry })
  }, 50)
)

setInterval(() => {
  io.emit("time", { time: new Date().toJSON() })
}, 5_000)

server.listen(3000, () => {
  console.log("listening on *:3000")
})
