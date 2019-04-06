import "isomorphic-unfetch";
import io from "socket.io-client";

const serverURL = "http://localhost:3100";

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

export function subscriber(name, value) {
  let notifyOpen;
  const whenOpen = new Promise(resolve => {
    notifyOpen = resolve;
  });
  if (webSocket == null) {
    console.log("creating socket io client!");
    webSocket = new WebSocket(`${serverURL}/ws/`);
    webSocket.onopen(() => {
      console.log("webSocket open!");
      notifyOpen();
    });
    webSocket.onmessage(({ data }) => {
      console.log("webSocket onmessage event: ", data);
      const jdata = JSON.parse(data);
      const { event, payload } = jdata;
      if (event && webSocket.subs[event]) {
        webSocket.subs[event].forEach(async hander => hander(payload));
      }
    });
    webSocket.sus = {};
    webSocket.sub = function(event, handler) {
      if (!webSocket.subs[event]) {
        webSocket.subs[event] = new Array();
      }
      webSocket.subs[event].push(handler);
    };
  } else {
    notifyOpen();
  }
  //subscribe
  return async (topic, handler) => {
    await whenOpen;
    const event = "subscribe";
    const payload = { name, value, topic };
    webSocket.send(JSON.stringify({ event, payload }));
    webSocket.sub(`${value}.${topic}`, params => {
      console.log("on ${value}.${topic} evet - params: ", params);
      handler(params);
    });
    console.log(
      "setup delivery sent! will listen for -> ",
      `${value}.${topic} and ${value}.${topic}.setup`
    );
  };
}

export async function postRequest(url, params, opts = {}) {
  return sendRequest(url, params, { ...opts, method: "POST" });
}

export async function getRequest(url, opts = {}) {
  return sendRequest(url, null, { ...opts, method: "GET" });
}
