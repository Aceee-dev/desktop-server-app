const startServerButton = document.querySelector("#startButton");
const serverUrlText = document.querySelector("#serverurl");

function startServer(event) {
  console.log("Starting server");
  ipcRenderer.send("server:start", {});
}

// When server is started, update UI elements and show URL
ipcRenderer.on("server:started", (localipaddress, directoryToUpload) => {
  console.log("Server has started");
  serverUrlText.innerHTML =
    "Server started at port 8080, <br> use URL " +
    localipaddress +
    ":8080 in client app. <br> File will be uploaded to: <br>" +
    directoryToUpload;
  serverUrlText.classList.toggle("hidden");
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
startServerButton.addEventListener("click", startServer);
