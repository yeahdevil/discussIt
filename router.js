const express = require("express");
let router = express.Router();

let app = express();
app.use("/user",userRoute);
app.use("/admin",adminRoute);
app.use("/communityOwner",communityOwnerRoute);