const path = require("path");
const http = require("http");
const { fileURLToPath } = require("url");
const { IncomingForm } = require("formidable");
const fs = require("fs");
const os = require("os");
const myip = require("quick-local-ip");
const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");

process.env.NODE_ENV = "production";

const isMac = process.platform === "darwin";
const isInDevMode = process.env.NODE_ENV !== "production";

let mainWindow;
let aboutWindow;
let directoryToUpload;
let server;
let sockets = {},
  socketIdcount = 0;

function createEntryWindow() {
  mainWindow = new BrowserWindow({
    title: "Server App",
    width: isInDevMode ? 1100 : 500,
    height: 600,
    icon: `${__dirname}/assets/server.png`,
    resizable: isInDevMode,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Open dev tools if in dev environment
  if (isInDevMode) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
  sockets = {};
  socketIdcount = 0;
}

// About Window
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 400,
    height: 400,
    title: "About",
    icon: `${__dirname}/assets/server.png`,
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

app.whenReady().then(() => {
  createEntryWindow();

  // Customize menu
  const customMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(customMenu);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createEntryWindow();
  });
});

//Custom Menu
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

ipcMain.on("server:start", (e, options) => {
  startServer(e);
  console.log("Started server");
});

ipcMain.on("server:stop", (e, options) => {
  stopServer(e);
  console.log("Stopped server");
});

function startServer(e) {
  var localIp = getLocalMachineIp();
  console.log(localIp);
  server = http
    .createServer(async function (req, res) {
      try {
        const uploadDir = path.join(directoryToUpload + "/uploads");
        if (isInDevMode) console.log("dir is " + uploadDir);
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, "0777", true);
        const filterFunction = ({ name, originalFilename, mimetype }) => {
          console.log(mimetype);
          return 1;
        };
        const customOptions = {
          uploadDir: uploadDir,
          keepExtensions: true,
          allowEmptyFiles: false,
          maxFileSize: 5 * 1024 * 1024 * 1024,
          multiples: true,
          filter: filterFunction,
        };
        const form = new IncomingForm(customOptions);
        try {
          if (isInDevMode) console.log("parsing request received");
          await form.parse(req, (err, field, file) => {
            if (err) throw err;

            if (!file.myfiles) {
              return;
            }

            file.myfiles.forEach((file) => {
              const newFilepath = `${uploadDir}/${file.originalFilename}`;
              fs.rename(file.filepath, newFilepath, (err) => err);
            });
          });
          e.reply("server:notifyuploadstatus", 1);
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end(String("Success"));
          return;
        } catch (err) {
          e.reply("server:notifyuploadstatus", 0);
          console.error(err);
          res.writeHead(err.httpCode || 400, { "Content-Type": "text/plain" });
          res.end(String(err));
          return;
        }
      } catch (err) {
        e.reply("server:notifyuploadstatus", 0);
        res.write("Error occurred" + err);
        return res.end();
      }
    })
    .listen(8080, localIp);

  server.on("connection", (socket) => {
    var socketId = socketIdcount++;
    sockets[socketId] = socket;
    socket.on("close", () => {
      delete sockets[socketId];
    });
  });

  directoryToUpload = dialog.showOpenDialogSync({
    properties: ["openDirectory"],
  });
  e.reply("server:started", localIp, directoryToUpload);
}

function stopServer(e) {
  server.close(() => {
    console.log("server closed");
  });
  // Destroy sockets.
  for (var socketId in sockets) {
    sockets[socketId].destroy();
  }
  e.reply("server:stopped");
}

function getLocalMachineIp() {
  //getting ip4 network address of local system
  return myip.getLocalIP4().toString();
}

// Only required for macOS
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createEntryWindow();
});

// Only required for macOS
app.on("window-all-closed", () => {
  if (isMac) app.quit();
});
