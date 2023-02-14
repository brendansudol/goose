import dgram from "dgram"

const HOST = "192.168.10.1"
const PORTS = { command: 8889, state: 8890, video: 11111 }

function initSocket(port: number) {
  const socket = dgram.createSocket("udp4")
  socket.bind(port)
  return socket
}

export function initDrone() {
  const drone = initSocket(PORTS.command)
  const droneState = initSocket(PORTS.state)
  const droneVideo = initSocket(PORTS.video)

  const sendCommand = (message: string) => {
    drone.send(message, 0, message.length, PORTS.command, HOST)
  }

  return { drone, droneState, droneVideo, sendCommand }
}
