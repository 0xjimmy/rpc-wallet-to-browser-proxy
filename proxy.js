import express, { json, urlencoded } from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import { WebSocketServer } from 'ws'
import { config } from 'dotenv'
config()

// @TODO: Sessions that allow for multiple Wallet<>Intercepter to connect and allow for reconnecting disconnected Websockets

const { GOERLI_RPC } = process.env

const app = express()
app.use([cors(), json(), urlencoded({ extended: false })])

const wss = new WebSocketServer({ port: 8899 })
let wsClient
let queue = []

wss.on('connection', function connection(ws) {
  wsClient = ws
  wsClient.on('message', function message(data) {
    const parsed = JSON.parse(data.toString())
    console.log("Intercepter -> Proxy:", parsed.id);
    console.log("Proxy -> Wallet:", parsed.id);
    queue.splice(queue.findIndex(({ id }) => id === parsed.id), 1)[0].res.send(data.toString())
  })
})

app.all("/goerli", (req, res) => {
  // Is Intercepter connected to Websocket Server?
  // Forward to main network
  if (wsClient) {
    console.log("Wallet -> Proxy:", req.body.method, req.body.id)
    queue.push({ id: req.body.id, res })
    wsClient.send(JSON.stringify(req.body))
  } else {
    console.log("Wallet -> Network:", req.body.method, req.body.id)
    fetch(GOERLI_RPC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req.body) }).then((response) => response.text()).then(data => res.send(data))
  }
})

app.listen(8888)
