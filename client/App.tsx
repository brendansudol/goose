import React, { useEffect, useState } from "react"
import io from "socket.io-client"

const socket = io()

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected)
  const [lastTime, setLastTime] = useState<string>()

  useEffect(() => {
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

    return () => {
      socket.removeAllListeners()
    }
  }, [])

  return (
    <div>
      <div>connected: {isConnected ? "yes" : "no"}</div>
      <div>last time: {lastTime ?? "N/A"}</div>
    </div>
  )
}

export default App
