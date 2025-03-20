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
  const repoPath = `${process.cwd()}/bot2`; // hoặc đường dẫn cụ thể đến repository
  
  // In ra đường dẫn hiện tại để debug
  console.log(`Current directory: ${repoPath}`);
  
  // Kiểm tra trạng thái git trước khi pull
  exec(`cd ${repoPath} && git status && git branch -v`, (statusErr, statusOut) => {
    console.log(`Current Git status: ${statusOut}`);
    
    // Chuỗi các lệnh git với thêm thiết lập thông tin người dùng và verbose mode
    const gitCommands = `
      cd ${repoPath} &&
      git config user.email "bot@example.com" &&
      git config user.name "Replit Bot" &&
      git config pull.rebase false &&
      git pull origin main --no-edit --allow-unrelated-histories --verbose &&
      touch .replit && refresh
    `;
    
    console.log("Executing Git commands...");
    
    exec(gitCommands, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        return res.status(500).send("Error updating code");
      }
      
      console.log(`Git Pull Output: ${stdout}`);
      
      // Thêm logging để theo dõi
      if (stderr && stderr.trim()) {
        console.log(`Git stderr (may be warnings): ${stderr}`);
      }
      
      // Kiểm tra trạng thái git sau khi pull
      exec(`cd ${repoPath} && git status && git log -1`, (afterStatusErr, afterStatusOut) => {
        console.log(`Git status after pull: ${afterStatusOut}`);
        
        // Kiểm tra xem có file nào thay đổi không
        exec(`cd ${repoPath} && git diff --name-status HEAD@{1} HEAD`, (diffErr, diffOut) => {
          if (diffErr) {
            console.error(`Error checking diff: ${diffErr.message}`);
          } else {
            console.log(`Changed files: ${diffOut || "None"}`);
          }
          
          // Restart bot (Replit sẽ tự restart khi process bị kill)
          console.log("Restarting application...");
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
    });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));