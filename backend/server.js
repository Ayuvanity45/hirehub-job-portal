require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("===============================================");
    console.log("🚀 HireHub Backend Started Successfully");
    console.log(`🌐 Server Running : http://localhost:${PORT}`);
    console.log(`📅 Started At     : ${new Date().toLocaleString()}`);
    console.log(`🌍 Environment    : ${process.env.NODE_ENV || "development"}`);
    console.log("===============================================");
});