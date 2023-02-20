import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import io from "socket.io-client"
import JMuxer from "jmuxer"

const socket = io()

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected)
  const [lastTime, setLastTime] = useState<string>()
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleClick = useCallback(() => {
    socket.emit("command", { command: "takeoff" })
  }, [])

  const metricValues = useMemo(() => parseMetrics(SAMPLE_TELEMETRY), [])

  useEffect(() => {
    if (videoRef.current == null) {
      return
    }

    const jmuxer = new JMuxer({
      node: videoRef.current,
      mode: "video",
      flushingTime: 500,
    })

    socket.on("connect", () => {
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    socket.on("time", ({ time }) => {
      setLastTime(time)
    })

    socket.on("telemetry", (payload) => {
      console.log("telemetry: ", payload)
    })

    socket.on("video", (payload) => {
      console.log("video: ", payload)
      jmuxer.feed({ video: new Uint8Array(payload.video) })
    })

    return () => {
      socket.removeAllListeners()
    }
  }, [])

  return (
    <div className="mx-auto p-6 max-w-4xl min-h-screen">
      {/* header */}
      <div className="mb-8 flex flex-col items-center justify-center gap-2">
        <img src="/goose.png" width="80" height="48" />
        <div className="text-xl font-bold">goose</div>
        <div className="w-10 border-t-4 border-gray-900" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* video + controls */}
        <div className="col-span-2">
          {/* TODO: replace with video */}
          <div className="w-full h-80 px-4 py-2 bg-gray-900 rounded-lg shadow-lg text-center" />

          <div className="mt-8 flex gap-4 items-center">
            <div className="w-1/4 flex flex-col gap-4 items-center">
              <Button className="w-full">1</Button>
              <Button className="w-full">2</Button>
            </div>
            <div className="w-3/4 flex gap-4 justify-evenly">
              <div className="flex flex-col items-center">
                <div>
                  <Button>1</Button>
                </div>
                <div className="flex gap-10">
                  <Button>2</Button>
                  <Button>3</Button>
                </div>
                <div>
                  <Button>4</Button>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div>
                  <Button>1</Button>
                </div>
                <div className="flex gap-10">
                  <Button>2</Button>
                  <Button>3</Button>
                </div>
                <div>
                  <Button>4</Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* telemetry sidebar */}
        <div>
          <div className="grid grid-cols-1 divide-y divide-gray-900">
            {METRICS.map((metric) =>
              metricValues[metric.id] != null ? (
                <div key={metric.id} className="py-1 flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{metric.name}</div>
                  <div className="text-sm font-bold">{metric.fmt(metricValues[metric.id])}</div>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="mt-12 mb-4 w-14 border-t-4 border-gray-900" />
      <div className="text-sm">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl nec ultricies
        lacinia, nunc nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod,
        nisl nec ultricies lacinia, nunc nisl.
      </div>

      <video ref={videoRef} width="960" height="720" autoPlay muted />
    </div>
  )
}

function Button({
  className,
  children,
  onClick,
}: {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button className={`${BUTTON_BASE} ${className ?? ""}`} onClick={onClick}>
      {children}
    </button>
  )
}

function parseMetrics(payload: string) {
  const results: { [key: string]: number } = {}

  for (const metric of payload.split(";")) {
    const [key, value] = metric.split(":")
    const valueNumber = Number(value)
    if (!Number.isNaN(valueNumber)) results[key] = valueNumber
  }

  return results
}

const BUTTON_BASE =
  "text-sm px-5 py-3 text-gray-300 bg-gray-700 border border-gray-500 focus:outline-none hover:bg-gray-600 focus:ring-4 focus:ring-gray-700 rounded-full"

const SAMPLE_TELEMETRY =
  "pitch:-7;roll:-124;yaw:33;vgx:0;vgy:0;vgz:-1;templ:44;temph:46;tof:333;h:0;bat:85;baro:606.56;time:0;agx:-117.00;agy:857.00;agz:443.00;"

const METRICS: { id: string; name: string; fmt: (x: number) => string }[] = [
  { id: "pitch", name: "Pitch", fmt: (x) => `${x}°` },
  { id: "roll", name: "Roll", fmt: (x) => `${x}°` },
  { id: "yaw", name: "Yaw", fmt: (x) => `${x}°` },
  { id: "vgx", name: "Speed (x)", fmt: (x) => `${x} cm/s` },
  { id: "vgy", name: "Speed (y)", fmt: (x) => `${x} cm/s` },
  { id: "vgz", name: "Speed (z)", fmt: (x) => `${x} cm/s` },
  { id: "templ", name: "Temperature (low)", fmt: (x) => `${x}°C` },
  { id: "temph", name: "Temperature (high)", fmt: (x) => `${x}°C` },
  { id: "tof", name: "Time-of-flight", fmt: (x) => `${x} cm` },
  { id: "h", name: "Height", fmt: (x) => `${x} cm` },
  { id: "bat", name: "Battery", fmt: (x) => `${x}%` },
  { id: "baro", name: "Barometer", fmt: (x) => `${x} cm` },
  { id: "time", name: "Time", fmt: (x) => `${x} s` },
  { id: "agx", name: "Acceleration (x)", fmt: (x) => `${x} cm/s²` },
  { id: "agy", name: "Acceleration (y)", fmt: (x) => `${x} cm/s²` },
  { id: "agz", name: "Acceleration (z)", fmt: (x) => `${x} cm/s²` },
]

export default App
