import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use("/static", express.static(path.resolve(__dirname,  "static")));
app.use("/services", express.static(path.resolve(__dirname, "services")));
app.use("/handlers", express.static(path.resolve(__dirname,  "handlers")));
app.use("/models", express.static(path.resolve(__dirname,  "models")));

app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "index.html"));
  });
  
app.get("/create-lobby", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});  

app.get("/error", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
}); 

app.get("/login", (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

app.get("/signin-google", async (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});
  
app.listen( 3000, () => console.log("Server running..."));