const { app, BrowserWindow, ipcMain, Tray, TouchBar } = require("electron");
const fs = require("fs");
const path = require("path");
const {
  setBearer,
  setActiveApp,
  getActiveApp,
  saveBounds,
  savePosition,
  getWindowSettings,
  getPosition,
  getAllApps,
  clearStorage,
} = require("./core/store");

require("./core/messages");

const appMenu = require("./core/menu");

let workRenderer, tray;
let allApps, touchBar;

const createTray = () => {
  tray = new Tray(`${__dirname}/app/assets/images/trayTemplate@2x.png`);
  tray.setToolTip("Shift + Click to quit");
  tray.on("click", (e) => {
    if (e.shiftKey) {
      app.quit();
    } else {
      workRenderer.isVisible() ? workRenderer.hide() : workRenderer.show();
    }
  });
};

const workRendererFunction = () => {
  const bounds = getWindowSettings();
  const position = getPosition();

  const rendererOptions = {
    width: bounds[0],
    height: bounds[1],
    x: position[0],
    y: position[1],
    minWidth: 350,
    minHeight: 500,
    frame: false,
    icon: path.join(__dirname, "./app/assets/images/logo.png"),
    show: false,
    titleBarStyle: "customButtonsOnHover",
    webPreferences: {
      // nodeIntegration: false,
      // contextIsolation: true,
      // sandbox: true,
      // enableRemoteModule: false,
      webviewTag: true,
      preload: path.join(__dirname, "./app/preload.js"),
    },
  };

  appMenu();
  workRenderer = new BrowserWindow(rendererOptions);

  workRenderer.loadFile(path.join(__dirname, "./app/work/index.html"));

  workRenderer.once("ready-to-show", () => {
    workRenderer.on("resized", () => saveBounds(workRenderer.getSize()));
    workRenderer.on("moved", () => savePosition(workRenderer.getPosition()));
    workRenderer.on("closed", () => {
      workRenderer = null;
    });
    workRenderer.webContents.openDevTools({ mode: "right" });

    workRenderer.show();
    workRenderer.webContents.on("devtools-closed", () => {
      workRenderer.webContents.send("devtool-closed");
    });
  });
  createTray();
  if (process.platform === "darwin") {
    (async () => {
      await TouchBarInit();
    })();
  }
};

ipcMain.on("from-loader", (e, args) => {
  workRenderer !== undefined &&
    workRenderer.webContents.send("from-main", args);
});

//shift this method to message module as it doesn't need to redirect now.
// ipcMain.on("save-bearer", (e, args) => {
//   setBearer(args.data);
// });

ipcMain.on("save-active-xapp", (e, args) => {
  setActiveApp(args);
  const data = JSON.parse(args);
  workRenderer !== undefined &&
    workRenderer.setTitle("Workspace (" + data.name + ")");
});

// We can delete this title ipc call, as there is no titlebar in the UI any more!!
// Decided not to delete it, as the title still shows up when user right clicks on the app icon in taskbar for example.
ipcMain.on("title", (e, title) => {
  if (workRenderer !== undefined) {
    if (title === "") {
      const data = JSON.parse(getActiveApp());
      workRenderer.setTitle("Workspace (" + data.name + ")");
    } else {
      workRenderer.setTitle(title);
    }
  }
});

app.whenReady().then(() => {
  selectConsole();

  workRendererFunction();
  // app.setAsDefaultProtocolClient("xappbuilder");

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      workRendererFunction();
    }
  });
});

ipcMain.on("TouchBarReInit", async () => {
  if (process.platform === "darwin") {
    await TouchBarInit();
  }
});
const TouchBarInit = async () => {
  const touchBarValue = [];
  touchBarValue.push(
    new TouchBar.TouchBarButton({
      icon: `${__dirname}/app/assets/images/refresh@2x.png`,
      click: () => {
        workRenderer.webContents.send("refresh");
      },
    })
  );
  allApps = await getAllApps(true);
  if (!allApps.error && allApps !== 1) {
    for (var i = 0; i < allApps.length; i++) {
      if (allApps[i].canLaunch) {
        const temp = {
          uuid: allApps[i].uuid,
          canLaunch: allApps[i].canLaunch,
          xapp: allApps[i].xapp,
          icon: allApps[i].icon,
          name: allApps[i].name,
        };
        const obj = {};
        obj.label = allApps[i].name;
        obj.click = () => {
          workRenderer.webContents.send("touched", temp);
        };
        touchBarValue.push(new TouchBar.TouchBarButton(obj));
      }
    }
    touchBar = new TouchBar({ items: touchBarValue });
    workRenderer.setTouchBar(touchBar);
  }
};

ipcMain.on("logout", (e, args) => {
  touchBarValue = [];
  touchBar = new TouchBar({ items: touchBarValue });
  workRenderer.setTouchBar(touchBar);
  clearStorage();
});

ipcMain.on("devTool-open", (e, args) => {
  if (process.platform === "darwin") {
    workRenderer.webContents.openDevTools();
  } else {
    workRenderer.close();
  }
});

const selectConsole = () => {
  // Get app directory
  // on OSX it's /Users/Yourname/Library/Application Support/AppName
  try {
    const userDataPath = app.getPath("userData");
    const prefPath = path.join(userDataPath, "Preferences");
    if (fs.existsSync(prefPath)) {
      const prefs = JSON.parse(fs.readFileSync(prefPath, "utf-8"));

      if (
        prefs.electron.devtools.preferences["panel-selectedTab"] !==
        JSON.stringify("console")
      ) {
        const bounds = getWindowSettings();
        if (bounds[0] === 1360 && bounds[1] === 780) {
          prefs.electron.devtools = {
            preferences: {
              "InspectorView.splitViewState": JSON.stringify({
                vertical: { size: 660 },
              }),
            },
          };
        }

        prefs.electron.devtools = {
          preferences: {
            "panel-selectedTab": JSON.stringify("console"),
          },
        };
        fs.writeFileSync(prefPath, JSON.stringify(prefs));
      }
    }
  } catch (err) {
    console.log("err ", err);
  }
};
