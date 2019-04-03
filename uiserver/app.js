const express = require("express");
const session = require("express-session");
const compression = require("compression");
const next = require("next");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const logger = require("./logs");
require("dotenv").config();
const { parse } = require("url");
const dev = process.env.NODE_ENV !== "production";
const port = 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = express();
  server.use(cookieParser);
  server.use(helmet());
  server.use(compression());
  server.use(express.json());

  // give all Nextjs's request to Nextjs server
  server.get("/_next/*", (req, res) => {
    handle(req, res);
  });

  server.get("/static/*", (req, res) => {
    handle(req, res);
  });

  if (!dev) {
    server.set("trust proxy", 1); // trust first proxy
  }

  server.get("*", (req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;

    logger.info(
      `get * pathname :${pathname} query: ${query} parsedUrl: ${parsedUrl}`
    );

    if (pathname === "/") {
      app.render(req, res, "/", query);
    } else {
      handle(req, res, parsedUrl);
    }
    //app.render(req, res);
    // const url = URL_MAP[req.path];
    // if (url) {
    //   app.render(req, res, url);
    // } else {
    //handle(req, res);
    // }
  });

  server.listen(port, err => {
    if (err) throw err;
    logger.info(`> Super Ready on port ${port}`);
  });
});
