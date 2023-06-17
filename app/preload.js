const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("xAppBuilder", {
  send: (channel, data) => {
    let whitelistedChannels = [
      "uuid",
      "save-bearer",
      "load-all-xapps",
      "save-active-xapp",
      "get-active-xapp",
      "open-active-xapp",
      "from-loader",
      "dialog-confirm",
      "getActiveApp",
      "openExternal",
      "tx",
      "title",
      "logout",
      "TouchBarReInit",
      "devTool-open",
    ];
    if (whitelistedChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, callback) => {
    let whitelistedChannels = [
      "bearerQR",
      "all-xApps",
      "active-xapp",
      "saved-active-xapp",
      "from-main",
      "getActiveApp",
      "tx",
      "touched",
      "refresh",
      "devtool-closed",
    ];
    if (whitelistedChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, args) => callback(args));
    }
  },
});
