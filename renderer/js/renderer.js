const startServerButton = document.querySelector("#startButton");
const serverUrlText = document.querySelector("#serverurl");

let serverIsRunning = false;

function handleServer(event) {
  if (serverIsRunning) {
    if (BuildMode.isInDevMode()) console.log("Stopping server");
    ipcRenderer.send("server:stop", {});
    return;
  }
  if (BuildMode.isInDevMode()) console.log("Starting server");
  ipcRenderer.send("server:start", {});
}

// When server is started, update UI elements
ipcRenderer.on("server:started", (localipaddress, directoryToUpload) => {
  if (BuildMode.isInDevMode()) console.log("Server has started");
  serverIsRunning = true;
  serverUrlText.innerHTML =
    "Server started at port 8080, <br> use URL " +
    localipaddress +
    ":8080 in client app. <br> File will be uploaded to: <br>" +
    directoryToUpload;
  serverUrlText.classList.toggle("hidden");
  startServerButton.innerHTML = "Stop local server";
});

// When server is stopped, update UI elements
ipcRenderer.on("server:stopped", () => {
  if (BuildMode.isInDevMode()) console.log("Server has stopped");
  serverIsRunning = false;
  serverUrlText.innerHTML = "";
  serverUrlText.classList.toggle("hidden");
  startServerButton.innerHTML = "Start local server";
});

ipcRenderer.on("server:notifyuploadstatus", (status) => {
  if (status) {
    alertSuccess("Upload Succesful");
  } else {
    alertError("Upload Failed");
  }
});

function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "green",
      color: "white",
      textAlign: "center",
    },
  });
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "red",
      color: "white",
      textAlign: "center",
    },
  });
}

// File select listener
startServerButton.addEventListener("click", handleServer);
