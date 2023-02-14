import React, { useCallback, useEffect, useRef, useState } from "react"
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
    <div>
      <div>connected: {isConnected ? "yes" : "no"}</div>
      <div>last time: {lastTime ?? "N/A"}</div>
      <button onClick={handleClick}>send command</button>
      <br />
      <video ref={videoRef} width="960" height="720" autoPlay muted />
    </div>
  )
}

export default App
