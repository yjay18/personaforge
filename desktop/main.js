const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

let backendProcess = null;

function waitForBackend(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          res.resume();
          resolve(true);
          return;
        }
        res.resume();
        retry();
      });
      req.on("error", retry);
    };

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Backend not responding"));
        return;
      }
      setTimeout(check, 600);
    };

    check();
  });
}

function startBackend() {
  const isPackaged = app.isPackaged;
  if (isPackaged) {
    const exePath = path.join(process.resourcesPath, "backend", "personaforge_backend.exe");
    backendProcess = spawn(exePath, ["--host", "127.0.0.1", "--port", "8123"], {
      stdio: "ignore",
      cwd: process.resourcesPath,
    });
  } else {
    backendProcess = spawn("python", ["backend/runner.py", "--host", "127.0.0.1", "--port", "8123"], {
      stdio: "ignore",
      cwd: app.getAppPath(),
    });
  }

  backendProcess.on("error", (err) => {
    console.error("Backend process failed", err);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#0a0d12",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || "";
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  }
}

app.whenReady().then(async () => {
  startBackend();
  try {
    await waitForBackend("http://127.0.0.1:8123/api/status");
  } catch (err) {
    console.error(err);
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
