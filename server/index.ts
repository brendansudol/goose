import express from "express"
import http from "http"
import throttle from "lodash.throttle"
import path from "path"
import { Server } from "socket.io"
import { initDrone } from "./utils/tello"

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const { drone, droneState, droneVideo, sendCommand } = initDrone()
sendCommand("command")
sendCommand("streamon")

app.use(express.static(path.join(__dirname, "../public")))

app.get("/", (_req, res) => {
  res.send("index.html")
})

app.get("/ping", (_req, res) => {
  return res.json({ ping: "pong!" })
})

io.on("connection", (socket) => {
  console.log("socket connected!")

  socket.on("command", (payload) => {
    sendCommand(payload.command)
  })
})

droneState.on(
  "message",
  throttle((msg: Buffer) => {
    const telemetry = msg.toString()
    io.emit("telemetry", { telemetry })
  }, 50)
)

let h264chunks: Buffer[] = []
let [numChunks, numChunkz]: [number, number] = [3, 0]
droneVideo.on("message", (data) => {
  const idx = data.indexOf(Buffer.from([0, 0, 0, 1]))

  if (idx < 0 || h264chunks.length === 0) {
    h264chunks.push(data)
    return
  }

  h264chunks.push(data.slice(0, idx))
  numChunkz += 1

  if (numChunkz === numChunks) {
    io.emit("video", { video: Buffer.concat(h264chunks) })
    h264chunks = []
    numChunkz = 0
  }

  h264chunks.push(data.slice(idx))
})

setInterval(() => {
  io.emit("time", { time: new Date().toJSON() })
}, 5_000)

server.listen(3000, () => {
  console.log("listening on *:3000")
})
