import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import membersRoutes from "./routes/members.js";
import kolsRoutes from "./routes/kols.js";
import campaignsRoutes from "./routes/campaigns.js";
import productsRoutes from "./routes/products.js";
import brandsRoutes from "./routes/brands.js";
import notificationsRoutes from "./routes/notifications.js";
import eventsRoutes from "./routes/events.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sjsia-portal-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/kols", kolsRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/events", eventsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  console.log(`SJSIA Portal API running on http://localhost:${port}`);
});
