const express = require("express");
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

const authRouter = require("./src/routes/auth");
const profileRouter = require("./src/routes/profile");
const accountRouter = require("./src/routes/account");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", accountRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is successfully listening on port: ${process.env.PORT}`);
});
