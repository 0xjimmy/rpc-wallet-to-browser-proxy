import WebSocket from 'ws';
import fetch from 'node-fetch'
import { config } from 'dotenv'
config()

const { GOERLI_RPC } = process.env

const ws = new WebSocket('ws://localhost:8899');

// @TODO: Make interceptHandler that uses array of handlers per method type.
// Handlers can be structured similar to Express middleware

const interceptMethods = new Set(["eth_blockNumber"])
function handleMethod(request) {
  console.log("Intercepted Method", request)
  fetch(GOERLI_RPC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }).then((response) => response.text()).then(data => ws.send(data))
}

ws.on('open', () => {
  ws.on('message', (data) => {
    const parsedRequest = JSON.parse(data);
    console.log('Proxy -> Intercepter:', parsedRequest.method, parsedRequest.id)
    if (interceptMethods.has(parsedRequest.method)) {
      handleMethod(parsedRequest)
    } else {
      fetch(GOERLI_RPC, { method: "POST", headers: { "Content-Type": "application/json" }, body: data }).then((response) => response.text()).then(data => ws.send(data))
    }
  })
})
