import dgram from "dgram"
import EventEmitter from "events"

type TelloConfig = {
  address: string
  commandPort: number
  telemetryPort: number
  videoPort: number
}

interface TelemetryEvent {
  type: "telemetry"
  data: string
}

interface VideoEvent {
  type: "video"
  rawData: Buffer
}

interface TelloEventMap {
  telemetry: TelemetryEvent
  video: VideoEvent
}

export class Tello {
  private config: TelloConfig
  private eventEmitter: EventEmitter = new EventEmitter()
  private commandSocket: dgram.Socket
  private telemetrySocket: dgram.Socket
  private videoSocket: dgram.Socket

  constructor(config: TelloConfig = DEFAULT_CONFIG) {
    this.config = config
    this.commandSocket = initSocket(config.commandPort)
    this.telemetrySocket = initSocket(config.telemetryPort)
    this.videoSocket = initSocket(config.videoPort)
  }

  public async start() {
    await this.send("command")
    await this.send("streamon")

    this.telemetrySocket.on("message", (msg: Buffer) => {
      this.emitSafe("telemetry", {
        type: "telemetry",
        data: msg.toString(),
      })
    })

    this.videoSocket.on("message", (data: Buffer) => {
      this.emitSafe("video", {
        type: "video",
        rawData: data,
      })
    })
  }

  public addListener<K extends keyof TelloEventMap>(
    type: K,
    listener: (event: TelloEventMap[K]) => void
  ) {
    this.eventEmitter.addListener(type, listener)
  }

  public removeListener<K extends keyof TelloEventMap>(
    type: K,
    listener: (event: TelloEventMap[K]) => void
  ) {
    this.eventEmitter.removeListener(type, listener)
  }

  public send(command: string): Promise<string> {
    const { address, commandPort } = this.config
    return new Promise((resolve, reject) => {
      this.commandSocket.send(command, commandPort, address, (err) => {
        if (err) reject(err)
      })

      const timeoutId = setTimeout(() => {
        reject(`timeout for command "${command}"`)
      }, 3_000)

      this.commandSocket.once("message", (msg) => {
        clearTimeout(timeoutId)
        resolve(msg.toString().trim())
      })
    })
  }

  private emitSafe<K extends keyof TelloEventMap>(type: K, event: TelloEventMap[K]) {
    this.eventEmitter.emit(type, event)
  }
}

class VideoUtils {
  static FRAME_START = 0x00
  static KEY_FRAME = 0x80

  static isFrameStart(buf: Buffer) {
    return buf.readUInt8(1) === VideoUtils.FRAME_START
  }

  static isFrameEnd(buf: Buffer) {
    const subSequence = buf.readUInt8(1)
    return subSequence >> 4 === 8 && (subSequence & 0x0f) > 0
  }

  static isKeyframe(buf: Buffer) {
    return buf.readUInt8(1) === VideoUtils.KEY_FRAME
  }
}

const DEFAULT_CONFIG: TelloConfig = {
  address: "192.168.10.1",
  commandPort: 8889,
  telemetryPort: 8890,
  videoPort: 11111,
}

function initSocket(port: number) {
  const socket = dgram.createSocket("udp4")
  socket.bind(port)
  return socket
}
