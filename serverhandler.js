const path = require("path");
const myip = require("quick-local-ip");
const http = require("http");
const { IncomingForm } = require("formidable");
const { dialog } = require("electron");
const fs = require("fs");

const isInDevMode = process.env.NODE_ENV !== "production";

let directoryToUpload;
let server;
let sockets = {},
  socketIdcount = 0;

function getLocalMachineIp() {
  //getting ip4 network address of local system
  return myip.getLocalIP4().toString();
}

module.exports = {
  startServer: function startServer(e) {
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
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: true,
                message: "File uploaded successfully",
              })
            );
            return;
          } catch (err) {
            e.reply("server:notifyuploadstatus", 0);
            console.error(err);
            res.writeHead(err.httpCode || 400, {
              "Content-Type": "application/json",
            });
            res.end(
              JSON.stringify({
                success: false,
                message: "File upload unsuccessful",
              })
            );
            return;
          }
        } catch (err) {
          e.reply("server:notifyuploadstatus", 0);
          res.writeHead(err.httpCode || 400, {
            "Content-Type": "application/json",
          });
          return res.end(
            JSON.stringify({
              success: false,
              message: "File upload unsuccessful",
            })
          );
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
  },
  stopServer: function stopServer(e) {
    server.close(() => {
      console.log("server closed");
    });
    // Destroy sockets.
    for (var socketId in sockets) {
      sockets[socketId].destroy();
    }
    e.reply("server:stopped");
  },
  initializeServerVariables: function init() {
    (sockets = {}), (socketIdcount = 0);
  },
};
