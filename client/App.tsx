import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import io from "socket.io-client"
import JMuxer from "jmuxer"

const socket = io()

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected)
  const [lastTime, setLastTime] = useState<string>()
  const [telemetry, setTelemetry] = useState<{ [id: string]: number }>()
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleClick = useCallback(() => {
    socket.emit("command", { command: "takeoff" })
  }, [])

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
      setTelemetry(parseTelemetry(payload.telemetry))
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
          <div className="aspect-ratio aspect-ratio--6x4">
            <video
              className="aspect-ratio--object bg-gray-900 rounded-lg shadow-lg"
              ref={videoRef}
              autoPlay
              loop
              muted
            />
          </div>

          <div className="mt-8 flex gap-4 items-center">
            <div className="w-1/4 flex flex-col gap-5 items-center">
              <Button className="px-5 py-4 w-full">take off</Button>
              <Button className="px-5 py-3 w-full">land</Button>
            </div>
            <div className="w-3/4 flex gap-4 justify-evenly">
              <div className="flex flex-col items-center">
                <div>
                  <IconButton type="UP" />
                </div>
                <div className="flex gap-10">
                  <IconButton type="ROTATE_LEFT" />
                  <IconButton type="ROTATE_RIGHT" />
                </div>
                <div>
                  <IconButton type="DOWN" />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div>
                  <IconButton type="FORWARD" />
                </div>
                <div className="flex gap-10">
                  <IconButton type="LEFT" />
                  <IconButton type="RIGHT" />
                </div>
                <div>
                  <IconButton type="BACK" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* telemetry sidebar */}
        <div>
          <div className="grid grid-cols-1 divide-y divide-gray-900">
            {METRICS.map((metric) => (
              <div key={metric.id} className="py-1.5 flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{metric.name}</div>
                <div className="text-sm font-bold">
                  {telemetry == null || telemetry[metric.id] == null
                    ? "--"
                    : metric.fmt(telemetry[metric.id])}
                </div>
              </div>
            ))}
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
    <button
      className={classNames(
        "text-gray-300 bg-gray-700 border border-gray-500 focus:outline-none hover:bg-gray-600 focus:ring-4 focus:ring-gray-700 rounded-full",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function IconButton({ type, onClick }: { type: keyof typeof ICONS; onClick?: () => void }) {
  const { innerSvg, ...rest } = ICONS[type]

  return (
    <Button className="w-16 h-14 flex items-center justify-center" onClick={onClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {innerSvg}
      </svg>
    </Button>
  )
}

function parseTelemetry(payload: string) {
  const results: { [key: string]: number } = {}

  for (const metric of payload.split(";")) {
    const [key, value] = metric.split(":")
    const valueNumber = Number(value)
    if (!Number.isNaN(valueNumber)) results[key] = valueNumber
  }

  return results
}

function classNames(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

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

const ICONS = {
  UP: {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    innerSvg: (
      <React.Fragment>
        <polyline points="17 11 12 6 7 11"></polyline>
        <polyline points="17 18 12 13 7 18"></polyline>
      </React.Fragment>
    ),
  },
  DOWN: {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    innerSvg: (
      <React.Fragment>
        <polyline points="7 13 12 18 17 13"></polyline>
        <polyline points="7 6 12 11 17 6"></polyline>
      </React.Fragment>
    ),
  },
  ROTATE_LEFT: {
    width: "27",
    height: "19",
    viewBox: "0 0 34 24",
    innerSvg: (
      <path d="M32 10.4189C32 5.69671 25.4107 2 17.0001 2C8.58945 2 2 5.69811 2 10.4189C2 10.7499 2.21684 11.0184 2.4838 11.0184C2.75076 11.0184 2.9676 10.7497 2.9676 10.4189C2.9676 6.50498 9.39438 3.19894 16.9999 3.19894C24.6055 3.19894 31.0322 6.50619 31.0322 10.4189C31.0322 14.3017 24.7003 17.5849 17.1694 17.6341L18.893 15.5009C19.0817 15.2682 19.0817 14.8869 18.893 14.653C18.7042 14.4203 18.3975 14.4203 18.2087 14.653L15.3132 18.2384L18.2087 21.825C18.3036 21.9437 18.4275 22 18.5512 22C18.6761 22 18.7999 21.9413 18.8938 21.825C19.0825 21.5922 19.0825 21.211 18.8938 20.9771L17.1624 18.833C25.4939 18.7828 32 15.1088 32 10.4189Z" />
    ),
  },
  ROTATE_RIGHT: {
    width: "27",
    height: "19",
    viewBox: "0 0 34 24",
    innerSvg: (
      <path d="M2 10.4189C2 5.69671 8.58929 2 16.9999 2C25.4106 2 32 5.69811 32 10.4189C32 10.7499 31.7832 11.0184 31.5162 11.0184C31.2492 11.0184 31.0324 10.7497 31.0324 10.4189C31.0324 6.50498 24.6056 3.19894 17.0001 3.19894C9.39454 3.19894 2.96777 6.50619 2.96777 10.4189C2.96777 14.3017 9.29966 17.5849 16.8306 17.6341L15.107 15.5009C14.9183 15.2682 14.9183 14.8869 15.107 14.653C15.2958 14.4203 15.6025 14.4203 15.7913 14.653L18.6868 18.2384L15.7913 21.825C15.6964 21.9437 15.5725 22 15.4488 22C15.3239 22 15.2001 21.9413 15.1062 21.825C14.9175 21.5922 14.9175 21.211 15.1062 20.9771L16.8376 18.833C8.50609 18.7828 2 15.1088 2 10.4189Z" />
    ),
  },
  FORWARD: {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    innerSvg: <polyline points="18 15 12 9 6 15"></polyline>,
  },
  BACK: {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    innerSvg: <polyline points="6 9 12 15 18 9"></polyline>,
  },
  LEFT: {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    innerSvg: <polyline points="15 18 9 12 15 6"></polyline>,
  },
  RIGHT: {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    innerSvg: <polyline points="9 18 15 12 9 6"></polyline>,
  },
}

export default App
