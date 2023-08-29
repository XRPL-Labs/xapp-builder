const { ipcRenderer } = require("electron");

function display(msg) {
  const array = [
    "txDetails",
    "openSignRequest",
    "scanQr",
    "openBrowser",
    "selectDestination",
    "share",
    "close",
    "xAppNavigate",
    "ready",
  ];
  if (msg.data !== "XAPP_PROXY_INIT_ACK" && msg.data !== "XAPP_PROXY_INIT") {
    const data = JSON.parse(msg.data);

    if (array.includes(data.command)) {
      ipcRenderer.send("from-loader", data);
    }
  }
}

window.addEventListener("message", display);

ipcRenderer.on("send-to-xapp", (e, args) => {
  window.postMessage(args);
});
