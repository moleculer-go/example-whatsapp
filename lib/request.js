import "isomorphic-unfetch";
import io from "socket.io-client";

const serverURL = "http://localhost:3100";
const wsURL = "ws://localhost:3100";

export async function sendRequest(url, params, opts = {}) {
  const { headers: headersOpts, ...moreOpts } = opts;
  const headers = {
    "Content-type": "application/json; charset=UTF-8",
    ...headersOpts
  };
  let method = "GET";
  if (params) {
    opts["body"] = JSON.stringify(params);
    method = "POST";
  }
  return await (await fetch(serverURL + url, {
    method,
    ...opts,
    headers
  })).json();
}

let webSocket = null;
function messageArrived(webSocket) {
  return ({ data }) => {
    console.log("webSocket onmessage data: ", data);
    const jdata = JSON.parse(data);
    const { topic, payload } = jdata;
    console.log("webSocket.subs[topic]: ", webSocket.subs[topic]);
    if (topic && webSocket.subs[topic]) {
      webSocket.subs[topic].forEach(async hander => hander(payload));
    }
  };
}

function createWebSocket() {
  console.log("creating websocket client!");
  const webSocket = new WebSocket(`${wsURL}/ws/`);
  webSocket.onmessage = messageArrived(webSocket);
  webSocket.subs = {};
  webSocket.sub = function(topic, handler) {
    if (!webSocket.subs[topic]) {
      webSocket.subs[topic] = new Array();
    }
    webSocket.subs[topic].push(handler);
  };
  return webSocket;
}

function subscribeToMoleculerEvents(webSocket, payload) {
  webSocket.send(JSON.stringify({ topic: "moleculer.events", payload }));
}

function subscribe(webSocket, whenOpen, name, value) {
  return async (topic, handler) => {
    await whenOpen;
    subscribeToMoleculerEvents(webSocket, { name, value, topic });
    webSocket.sub(`${value}.${topic}`, params => {
      console.log("on [", `${value}.${topic}`, "] event - params: ", params);
      handler(params);
    });
    console.log("subscribed to topic -> ", topic);
  };
}

export function subscriber(name, value) {
  let notifyOpen;
  const whenOpen = new Promise(resolve => {
    notifyOpen = resolve;
  });
  if (webSocket == null) {
    webSocket = createWebSocket();
    webSocket.onopen = () => {
      console.log("webSocket open!");
      notifyOpen();
    };
  } else {
    notifyOpen();
  }
  return subscribe(webSocket, whenOpen, name, value);
}

export async function postRequest(url, params, opts = {}) {
  return sendRequest(url, params, { ...opts, method: "POST" });
}

export async function getRequest(url, opts = {}) {
  return sendRequest(url, null, { ...opts, method: "GET" });
}
