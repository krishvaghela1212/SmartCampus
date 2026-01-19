import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import cron from "node-cron";
import { checkAndNotify } from "./controllers/notification.controller.js";
import broadcastRoutes from "./routes/broadcast.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://smart-campus-alpha.vercel.app/"
    ],
    credentials: true
  })
);
app.use(express.json());
app.use("/api/auth",authRoutes);
app.use("/api/availability", availabilityRoutes);
cron.schedule("*/2 * * * *", () => {
  checkAndNotify();
});
app.use("/api/broadcast",broadcastRoutes);
app.use("/api/appointments", appointmentRoutes);


export default app;
