const startServerButton = document.querySelector("#startButton");
const serverUrlText = document.querySelector("#serverurl");

let serverIsRunning = false;
let hotspotIsRunning = false;

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

// When hotspot status is updated, update status
ipcRenderer.on("hotspot:status", (status) => {
  if (status) {
    hotspotbtn.innerHTML= "Stop Hotspot"
    hotspotIsRunning = true;
    alertSuccess("Hotspot Success");
  } else {
     hotspotbtn.innerHTML= "Start Hotspot"
     hotspotIsRunning = false;
    alertError("Hotspot failed");
  }
});


function alertSuccess(message) {
  Toastify.toast({
    text: message,
    close: false,
    duration: 5000,
    style: {
      background: "green",
      color: "white",
      textAlign: "center",
      position: "fixed",
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
      position: "fixed",
    },
  });
}

startServerButton.addEventListener("click", handleServer);
document.getElementById('hotspotbtn').addEventListener('click', () => {
  if(hotspotIsRunning) {
    ipcRenderer.send("hotspot:stop");
    return;
  }
  const ssid = document.getElementById('ssid').value;
  const password = document.getElementById('password').value;
  // Create JSON object with SSID and password
  const hotspotData = {
    ssid: ssid,
    password: password
  };
  ipcRenderer.send("hotspot:start", JSON.stringify(hotspotData));
});
