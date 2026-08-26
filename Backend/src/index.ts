import express from "express";
import cors from "cors";
import session from "express-session";
import { settings } from "./config";
import authRouter from "./api/auth";
import disputesRouter from "./api/disputes";
import dashboardRouter from "./api/dashboard";
import usersRouter from "./api/users";
// import sheetsRouter from "./api/sheets";
// import internalRouter from "./api/internal";

const app = express();
app.use(express.json());

app.use(
  session({
    secret: settings.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: settings.ENVIRONMENT === "production" },
  })
);

app.use(
  cors({
    origin: settings.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/auth", authRouter);
app.use("/api/disputes", disputesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);
// app.use("/api/sheets", sheetsRouter);
// app.use("/internal", internalRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT) || 8000;
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
