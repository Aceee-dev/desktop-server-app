const sudo = require('sudo-prompt');
const { app } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const options = {
  name: 'Simple Server App',
};

function startHotspot(event, ssid, password) {
    const command = `netsh wlan set hostednetwork mode=allow ssid=${ssid} key=${password} && netsh wlan start hostednetwork`;
    sudo.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting hotspot: ${stderr || error.message}`);
        // Try prompting for setting if device does not support this.
        console.error(`trying powershell script`);
        enableMobileHotspot();
        event.reply("hotspot:status",1);
        return;
      }
      console.log(`Hotspot started: ${stdout}`);
      event.reply("hotspot:status",1);
    });
  }
  
  function stopHotspot(event) {
    const command = 'netsh wlan stop hostednetwork';
    sudo.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error stopping hotspot: ${stderr || error.message}`);
        event.reply("hotspot:status",1);
        return;
      }
      console.log('Hotspot stopped');
      event.reply("hotspot:status",0);
    });
  }

  function enableMobileHotspot() {
    var scriptPath;
    if(app.isPackaged) {
      scriptPath = path.join(process.resourcesPath, 'enable_hotspot.ps1');
    } else {
      scriptPath = path.join(__dirname, 'enable_hotspot.ps1');
    }
    exec(`powershell -ExecutionPolicy Bypass -File ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error enabling hotspot: ${stderr}`);
        return false;
      }
      console.log(`Mobile hotspot enabled: ${stdout}`);
      return true;
    });
  }
  
  module.exports = { startHotspot, stopHotspot};