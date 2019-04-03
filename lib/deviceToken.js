import cookieParser from "cookie-parser";
import cookie from "react-cookies";

// function getDeviceTokenOnClient(ctx) {
//   return window.localStorage.getItem("deviceToken");
// }

// function getDeviceTokenOnServer(ctx) {
//   cookieParser()(ctx.req, ctx.res, function(arg1, arg2) {
//     console.log("Next from cookieParser() ... args: ", { arg1, arg2 });
//   });
//   console.log("ctx.req.cookies ", ctx.req.cookies);
//   if (ctx.req && ctx.req.cookies) {
//     return ctx.req.cookies["deviceToken"];
//   }
//   return "";
// }

function newId(size = 12) {
  const ALPHABET =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var rtn = "";
  for (var i = 0; i < size; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
}

function setupServerCookies(req, res) {
  if (req.cookies) {
    return;
  }
  cookieParser()(req, res, function() {});
  cookie.plugToRequest(req, res);
}

export function getDeviceToken(ctx) {
  if (ctx.req) {
    setupServerCookies(ctx.req, ctx.res);
  }
  let deviceToken = cookie.load("deviceToken");
  if (!deviceToken || deviceToken == "") {
    deviceToken = newId();
    setDeviceToken(ctx, deviceToken);
    console.log("new deviceToken created -> ", deviceToken);
  }
  return deviceToken;
}

export function setDeviceToken(ctx, deviceToken) {
  if (ctx.req) {
    setupServerCookies(ctx.req, ctx.res);
  }
  const expires = new Date();
  expires.setDate(Date.now() + 1000 * 60 * 60 * 24 * 5);
  cookie.save("deviceToken", deviceToken, { path: "/", expires });
}
