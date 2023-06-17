const { ipcMain, shell } = require("electron");
const { TxData } = require("xrpl-txdata");

const {
  setBearer,
  getAllApps,
  setActiveApp,
  getActiveApp,
  getActiveAppOtt,
  getReplayOtt,
} = require("./store");

const crypto = require("crypto");
const { toDataURL } = require("qrcode");

ipcMain.on("uuid", (e, args) => {
  const uuid4 = crypto.randomUUID();
  // uuid4   ,
  toDataURL(
    `https://xumm.app/detect/xapp:xumm.xappbuilder/qr?handshake=${uuid4}`,
    {}
  ).then((data) => {
    e.sender.send("bearerQR", { uuid4, data });
  });
});
ipcMain.on("load-all-xapps", async (e, args) => {
  e.sender.send("all-xApps", JSON.stringify(await getAllApps(args)));
});

ipcMain.on("open-active-xapp", async (e, args) => {
  e.sender.send("active-xapp", JSON.stringify(await getActiveAppOtt()));
});

ipcMain.on("get-active-xapp", async (e, args) => {
  e.sender.send(
    "saved-active-xapp",
    JSON.stringify(await getReplayOtt(args.app, args.ott))
  );
});

ipcMain.on("getActiveApp", (e, args) => {
  e.sender.send("getActiveApp", getActiveApp());
});

ipcMain.on("openExternal", (e, url) => {
  shell.openExternal(
    url.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  );
});

ipcMain.on("tx", async (e, txHash) => {
  const txd = new TxData();
  e.sender.send("tx", await txd.get(txHash));
  txd.end();
});

ipcMain.on("save-bearer", (e, args) => {
  setBearer(args.data);
});
