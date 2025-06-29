import express from "express";
import helmet from "helmet";
import { publicRouter } from "../route/public-api.js";
import { errorMiddleware } from "../middleware/error-middleware.js";
import cookieParser from "cookie-parser";
import { userRouter } from "../route/api.js";
import cors from "cors";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const web = express();

web.use(
  helmet({
    hidePoweredBy: true,
    noSniff: true,
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    referrerPolicy: { policy: "same-origin" },

    contentSecurityPolicy: false,
    frameguard: false,
  })
);

web.use(
  cors({
    origin: process.env.FRONT_END_URL,
    credentials: true,
  })
);

web.use(cookieParser());
web.use(express.json());
web.set("trust proxy", true);

web.use(publicRouter);
web.use(userRouter);

web.use(errorMiddleware);

if (process.env.NODE_ENV !== "production") {
  const certPath = path.join(__dirname, "..", "..", "certs", "localhost.pem");
  const keyPath = path.join(
    __dirname,
    "..",
    "..",
    "certs",
    "localhost-key.pem"
  );

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error("Error: SSL certificate or key file not found!");
    console.error(`Expected cert: ${certPath}`);
    console.error(`Expected key: ${keyPath}`);
    console.error(
      "Please make sure you have run mkcert and placed the files correctly."
    );
    process.exit(1);
  }

  const sslOptions = {
    key: fs.readFileSync(keyPath, "utf8"),
    cert: fs.readFileSync(certPath, "utf8"),
  };

  const httpsServer = https.createServer(sslOptions, web);

  httpsServer.listen(process.env.APP_PORT, () => {
    console.log("Application is running");
  });
} else {
  web.listen(process.env.APP_PORT, () => {
    console.log("Application is running");
  });
}
