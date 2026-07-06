import express from "express";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import accountRouter from "./routes/account";
import transactionRouter from "./routes/transaction";
import dashboardRouter from "./routes/dashboard";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", accountRouter);
app.use("/", transactionRouter);
app.use("/", dashboardRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is successfully listening on port: ${process.env.PORT}`);
});
