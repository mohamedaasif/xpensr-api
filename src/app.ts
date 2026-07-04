import express from "express";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import accountRouter from "./routes/account";
import transactionRouter from "./routes/transaction";
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

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

app.listen(process.env.PORT, () => {
  console.log(`Server is successfully listening on port: ${process.env.PORT}`);
});
