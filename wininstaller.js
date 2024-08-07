const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('creating windows installer')
  const rootPath = path.join('./')
  const outPath = path.join(rootPath, 'dist')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'win-unpacked/'),
    authors: 'Achand',
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    exe: path.join(outPath,'win-unpacked/simpleserverapp.exe')
  })
}