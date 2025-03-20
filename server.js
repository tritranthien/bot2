const express = require("express");
const { exec } = require("child_process");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("I'm alive!");
});

// Endpoint nhận webhook từ GitHub
app.post("/update", (req, res) => {
  console.log("Webhook received!");

  // Pull code từ GitHub
  exec("git pull", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send("Error updating code");
    }
    console.log(`Git Pull Output: ${stdout}`);

    // Restart bot (Replit sẽ tự restart khi process bị kill)
    exec("kill 1", (err, out, serr) => {
      if (err) {
        console.error(`Restart Error: ${err.message}`);
        return res.status(500).send("Error restarting bot");
      }
      console.log("Bot restarted!");
      res.send("Updated and restarted!");
    });
  });
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
