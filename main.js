const path = require("path");
const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const serverhandler = require("./serverhandler.js");

process.env.NODE_ENV = "production";

const isMac = process.platform === "darwin";
const isInDevMode = process.env.NODE_ENV !== "production";

let mainWindow;
let aboutWindow;

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
  serverhandler.initializeServerVariables();
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
  serverhandler.startServer(e);
  console.log("Started server");
});

ipcMain.on("server:stop", (e, options) => {
  serverhandler.stopServer(e);
  console.log("Stopped server");
});

// Only required for macOS
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createEntryWindow();
});

// Only required for macOS
app.on("window-all-closed", () => {
  if (isMac) app.quit();
});
