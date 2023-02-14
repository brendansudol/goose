import dgram from "dgram"

const HOST = "192.168.10.1"
const PORTS = { command: 8889, state: 8890, video: 11111 }

function initSocket(port: number) {
  const socket = dgram.createSocket("udp4")
  socket.bind(port)
  return socket
}

export const drone = initSocket(PORTS.command)
export const droneState = initSocket(PORTS.state)

export function sendDroneCommand(message: string) {
  drone.send(message, 0, message.length, PORTS.command, HOST)
}

export function initDrone() {
  sendDroneCommand("command")
}
