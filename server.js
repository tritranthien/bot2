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
  
  // Chỉ định đường dẫn đến thư mục repository
  const repoPath = process.cwd(); // hoặc đường dẫn cụ thể đến repository
  
  // In ra đường dẫn hiện tại để debug
  console.log(`Current directory: ${repoPath}`);
  
  // Thực hiện lệnh pull với đường dẫn đầy đủ
  exec(`cd ${repoPath} && git pull`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      console.error(`Stderr: ${stderr}`);
      return res.status(500).send("Error updating code");
    }
    
    console.log(`Git Pull Output: ${stdout}`);
    
    // Thêm logging để theo dõi
    if (stderr) {
      console.log(`Git stderr (may be warnings): ${stderr}`);
    }

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
