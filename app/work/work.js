const { XummSdkJwt } = require("xumm-sdk");

let Sdk,
  activeApp,
  activeOtt,
  ottExpires,
  selectedAccount,
  appName = "",
  appIcon = "",
  loadSidebar = 1,
  appTitle = "Workspace",
  webviewLoading = false,
  previousSpace = 0;

const webview = document.querySelector("webview");

const loadxApp = () => {
  window.xAppBuilder.send("open-active-xapp");
  if (loadSidebar) {
    loadSidebar = 0;
    loadCard(false);
  }
};
window.xAppBuilder.receive("active-xapp", (args) => {
  if (args === undefined) {
    const xAppHeader = document.getElementById("xapp-header").classList;
    if (!xAppHeader.contains("fade")) {
      xAppHeader.add("fade");
    }

    // console.log(
    //   "%cJWT expired. Please scan the QR code & import your xApps.",
    //   "color: red; font-weight: bold"
    // );
    // xAppImporter();
    return;
  }
  const data = JSON.parse(args);

  //ottExpires = data[0].moment;
  const select = document.getElementById("raddresses");
  select.innerHTML = "";

  if (data.error) {
    console.log(
      "%cJWT expired. Please scan the QR code & import your xApps.",
      "color: red; font-weight: bold"
    );
    xAppImporter();
    return;
  }
  let addressPresent = false;
  data.map((app) => {
    const option = document.createElement("option");
    if (app.account === selectedAccount) {
      addressPresent = true;
      option.value = app.ott;
      option.innerHTML = app.account;
      activeApp = app.app;
      selectedAccount = app.account;
      activeOtt = app.ott;
    } else {
      option.value = app.ott;
      option.innerHTML = app.account;
    }

    select.appendChild(option);
  });

  if (!addressPresent) {
    activeApp = data[0].app;
    selectedAccount = data[0].account;
    activeOtt = data[0].ott;
  } else {
    document.getElementById("raddresses").value = activeOtt;
  }

  window.xAppBuilder.send("get-active-xapp", {
    app: activeApp,
    ott: activeOtt,
  });
});

window.xAppBuilder.receive("saved-active-xapp", (args) => {
  const data = JSON.parse(args);
  //console.log(args);
  if (data.error) {
    const xAppHeader = document.getElementById("xapp-header").classList;
    if (!xAppHeader.contains("fade")) {
      xAppHeader.add("fade");
    }

    console.log(
      "%cJWT expired. Please scan the QR code & import your xApps.",
      "color: red; font-weight: bold"
    );
    xAppImporter();
    return;
  }

  console.clear();
  console.log(
    `%c Please wait until the selected xApp loads.`,
    "color: #FF5B5B; font-weight: bold;"
  );
  document.getElementById("title").innerHTML = appTitle;
  document.getElementById("appName").innerHTML = appTitle;
  const xAppHeader = document.getElementById("xapp-header").classList;
  if (xAppHeader.contains("fade")) {
    xAppHeader.remove("fade");
  }

  console.log("\n");
  console.log("%c xApp loading ... " + appTitle, "font-weight: bold;");
  console.log(`%c AppId: ${data.app}`, "color: #3BDC96;");
  console.log(`%c AppUrl: ${data.url.split("/force")[0]}`, "color: #3BDC96;");
  console.log(`%c DeviceId: ${data.device}`, "color: #3BDC96;");
  console.log(`%c Context: ${selectedAccount}`, "color: #3BDC96;");
  // console.log(
  //   `%c OTT Expires: ${getRelativeTimeString(
  //     new Date(ottExpires),
  //     window.navigator.language
  //   )}`,
  //   "color: #3BDC96;"
  // );
  console.log("\n");
  activeApp = data.app;
  activeOtt = data.ott;
  window.xAppBuilder.send("title", "");

  const isLoading = webviewIsLoading();
  if (isLoading) {
    webview.stop();
  }

  webview.src = data.url;
  //webview.setUserAgent("xumm/xapp");
});

const webviewIsLoading = () => {
  return webview.isLoading() || webviewLoading;
};

const context = (sel) => {
  window.xAppBuilder.send("get-active-xapp", {
    app: activeApp,
    ott: document.getElementById("raddresses").value,
  });
  selectedAccount = sel.options[sel.selectedIndex].text;
};

webview.addEventListener("console-message", (e) => {
  if (e.sourceId.startsWith("https://xumm.app/")) {
    if (e.message !== undefined && e.message !== "") {
      console.log(
        `%c${JSON.stringify(e.message, null, "\t")}`,
        "color: #3051FC;"
      );
    }
  } else if (e.message.endsWith("allow-popups' permission is not set.")) {
  } else if (e.sourceId !== "" && !e.sourceId.includes("electron")) {
    if (previousSpace) {
      previousSpace = 0;
    } else {
      previousSpace = 1;
      console.log("\n");
    }

    if (e.message.startsWith("event")) {
      const data = JSON.parse(e.message.split("event")[1].trim());
      console.log(
        `%c${
          e.sourceId.split("?xAppToken")[0] +
          " " +
          (e.line > 1 ? " Line: " + e.line : "")
        }`,
        "color: #FF5B5B;"
      );
      console.log(data);
    } else {
      console.log(
        `%c${
          e.sourceId.split("?xAppToken")[0] +
          " " +
          (e.line > 1 ? " Line: " + e.line : "") +
          " " +
          e.message
        }`,
        "color: #FF5B5B;"
      );
    }

    console.log("\n");
    // console.log(
    //   `%c${JSON.stringify(
    //     {
    //       file: e.sourceId.split("?xAppToken")[0],
    //       "line no": e.line,
    //       message: e.message,
    //     },
    //     null,
    //     "\t"
    //   )}`,
    //   "color: #FF5B5B;"
    // );
  } else {
    // console.log("Extra ", JSON.stringify(e, null, "\t"));
  }
});

const loadstart = () => {
  webviewLoading = true;
  const spinner = document.getElementById("loader");
  spinner.style.display = "inline";
  spinner.innerHTML = "loading ...";

  const webviewReload = document.getElementById("webview-reload").classList;
  if (!webviewReload.contains("disabled")) {
    webviewReload.add("disabled");
  }

  const list = document.getElementById("xapp-list");
  for (i = 0; i < list.childNodes.length; i++) {
    if (!list.childNodes[i].classList.contains("disabled"))
      list.childNodes[i].classList.add("disabled");
  }
};
const loadstop = () => {
  webviewLoading = false;
  const spinner = document.getElementById("loader");
  spinner.style.display = "none";
  webview.addEventListener("load-commit", (e) => loadFetching(e.url));

  const webviewReload = document.getElementById("webview-reload").classList;
  if (webviewReload.contains("disabled")) {
    webviewReload.remove("disabled");
  }

  const list = document.getElementById("xapp-list");
  for (i = 0; i < list.childNodes.length; i++) {
    if (list.childNodes[i].classList.contains("disabled"))
      list.childNodes[i].classList.remove("disabled");
  }
};

const webViewReload = () => {
  console.log(`%c Force reloading the xApp.`, "color: #3BDC96;");
  const isLoading = webviewIsLoading();
  if (isLoading) {
    webview.stop();
  }
  webview.reloadIgnoringCache();
};

// Change the eventListener and add the one which also outputs the status of http request.
const loadFetching = (url) => {
  if (
    !url.includes("?xAppToken=") &&
    !url.startsWith("https://xumm.app/") &&
    !url.includes("splashscreen.html")
  )
    console.log(`%c Fetching: ${url}`, "color: #F8BF4C;");
};

webview.addEventListener("did-start-loading", loadstart);
webview.addEventListener("did-stop-loading", loadstop);

// Start: Main Logic
window.xAppBuilder.receive("from-main", async (args) => {
  //console.log(activeApp, " - ", activeOtt);
  if (window) {
    Sdk = new XummSdkJwt(activeApp, activeOtt);
    /*
    Sdk.ping().then((c) => {
      myAccount = c.account;
      appName = c.application.name;
      console.log(c);
    });
    */
  }

  //console.log("worker ", args);
  if (args.command === "txDetails") {
    window.xAppBuilder.send("tx", args.tx);

    // const txInfo = await Sdk.getTransaction(args.tx);
    // console.log(txInfo);

    const transactionDetailShareBtn = document.getElementById(
      "transactionDetailShareBtn"
    );
    transactionDetailShareBtn.addEventListener("click", () => {
      const data = {
        command: "share",
        title: "",
        text: "",
        url: `https://livenet.xrpl.org/transactions/${args.tx}`,
      };
      window.xAppBuilder.send("from-loader", data);
    });

    const transactionDetailBrowserBtn = document.getElementById(
      "transactionDetailBrowserBtn"
    );
    transactionDetailBrowserBtn.addEventListener("click", () => {
      const data = {
        command: "openBrowser",
        url: `https://livenet.xrpl.org/transactions/${args.tx}`,
      };
      window.xAppBuilder.send("from-loader", data);
    });

    const paymentBtn = document.getElementById("paymentBtn");
    paymentBtn.click();

    window.xAppBuilder.receive("tx", (tx) => {
      PaymentTransaction(tx.result, args.account);
    });
  } else if (args.command === "openSignRequest") {
    const openSignRequestBtn = document.getElementById("openSignRequestBtn");
    openSignRequestBtn.click();

    const payload = await Sdk.payload.get(args.uuid);
    OpenSignRequest(payload);

    const PaymentWasRejected = () => {
      const response = {
        reason: "DECLINED",
        method: "payloadResolved",
        uuid: args.uuid,
      };
      console.log(`%cTransaction Declined.`, "color: #3BDC96;");
      webview.send("send-to-xapp", JSON.stringify(response));
      Sdk.payload.cancel(args.uuid).then((data) => {});
    };

    document
      .getElementById("proper-reject-payment")
      .addEventListener("click", PaymentWasRejected);
    document
      .getElementById("reject-payment")
      .addEventListener("click", PaymentWasRejected);

    document.getElementById("acceptPayment").addEventListener("click", () => {
      AcceptPayment(payload.meta.uuid);
    });
  } else if (args.command === "openBrowser") {
    window.xAppBuilder.send("getActiveApp");
    window.xAppBuilder.receive("getActiveApp", (res) => {
      const xapp = JSON.parse(res);
      appName = xapp.name;
      appIcon = xapp.icon;
      document.getElementById("app-name").innerHTML = appName;
      document.getElementById("dialog-image").src = appIcon;
      document.getElementById("external-url").innerHTML = args.url;
      document.getElementById("openDialogBtn").click();
    });

    //window.xAppBuilder.send("dialog-confirm", args.url);
  } else if (args.command === "selectDestination") {
    const selectDestinationBtn = document.getElementById(
      "selectDestinationBtn"
    );
    selectDestinationBtn.click();

    document
      .getElementById("acceptAddressSelection")
      .addEventListener("click", selectedAddress);

    document
      .getElementById("closeAddressSelection")
      .addEventListener("click", () => {
        const obj = {
          method: "selectDestination",
          destination: null,
          info: null,
          reason: "USER_CLOSE",
        };

        webview.send("send-to-xapp", JSON.stringify(obj));
      });
  } else if (args.command === "share") {
    const copied = document.getElementById("copied");
    if (!copied.classList.contains("invisible")) {
      copied.classList.add("invisible");
    }

    const copy = document.getElementById("copy");
    if (copy.classList.contains("invisible")) {
      copy.classList.remove("invisible");
    }

    copy.addEventListener("click", () => {
      if (copied.classList.contains("invisible")) {
        copied.classList.remove("invisible");
      }
      if (!copy.classList.contains("invisible")) {
        copy.classList.add("invisible");
      }
      navigator.clipboard.writeText(
        args.title + ":\n" + args.text + "\n\n" + args.url
      );
    });

    const shareTitle = document.getElementById("shareTitle");
    shareTitle.innerHTML = "";
    const strong = document.createElement("strong");
    strong.innerHTML = args.title;
    const span = document.createElement("span");
    span.innerHTML = "<br />" + args.text + "<br />" + args.url;
    shareTitle.appendChild(strong);
    shareTitle.appendChild(span);
    document.getElementById("openShareBtn").click();
  } else if (args.command === "close") {
    xAppClose();
  } else if (args.command === "xAppNavigate") {
    console.log("\n");
    console.log(
      `%cWe have limitted support for xAppNavigate on xApp Builder.`,
      "color: #3BDC96;"
    );
    console.log(`%cPlease test on your mobile device.`, "color: #3BDC96;");
    if (webview.src.split("/force?")[1] !== undefined) {
      const url = `https://xumm.app/detect/xapp:${args.xApp}/force?${
        webview.src.split("/force?")[1]
      }`;
      webview.src = url;
    }
  } else if (args.command === "scanQr") {
    const scanModalbtn = document.getElementById("scanModalbtn");
    scanModalbtn.click();

    document
      .getElementById("qr-content-close")
      .addEventListener("click", () => {
        const action = {
          qrContents: null,
          reason: "USER_CLOSE",
        };
        webview.send("send-to-xapp", JSON.stringify(action));
      });
    document
      .getElementById("qr-content-submit")
      .addEventListener("click", () => {
        const result = document.getElementById("qr-content-input").value;
        let action = "";

        if (result === "") {
          action = {
            qrContents: null,
            reason: "INVALID_QR",
          };
        } else {
          action = {
            qrContents: result,
            reason: "SCANNED",
          };
        }

        webview.send("send-to-xapp", JSON.stringify(action));
      });
  }
});

document.getElementById("open-external-link").addEventListener("click", (e) => {
  if (document.getElementById("external-url").innerHTML !== "") {
    openExternal(document.getElementById("external-url").innerHTML);
  }
});
const openExternal = (url) => {
  window.xAppBuilder.send("openExternal", url);
};

const selectedAddress = () => {
  document
    .getElementById("acceptAddressSelection")
    .removeEventListener("click", selectedAddress);
  const raddress = document.getElementById("destination-raddress").value;

  // Get the API and possibly fill all the proper value as filled by Xumm.
  const obj = {
    method: "selectDestination",
    destination: { name: "", address: raddress, tag: "" },
    info: {
      exist: false,
      risk: "UNKNOWN",
      requireDestinationTag: false,
      possibleExchange: false,
      disallowIncomingXRP: false,
      blackHole: false,
    },
    reason: "SELECTED",
  };

  webview.send("send-to-xapp", JSON.stringify(obj));
};

// End: Main Logic

// Start: Utility methods
function getRelativeTimeString(date, lang) {
  // Allow dates or times to be passed
  console.log(date);
  const timeMs = typeof date === "number" ? date : date.getTime();

  // Get the amount of seconds between the given date and now
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

  // Array reprsenting one minute, hour, day, week, month, etc in seconds
  const cutoffs = [
    60,
    3600,
    86400,
    86400 * 7,
    86400 * 30,
    86400 * 365,
    Infinity,
  ];

  // Array equivalent to the above but in the string representation of the units
  const units = ["second", "minute", "hour", "day", "week", "month", "year"];

  // Grab the ideal cutoff unit
  const unitIndex = cutoffs.findIndex(
    (cutoff) => cutoff > Math.abs(deltaSeconds)
  );

  // Get the divisor to divide from the seconds. E.g. if our unit is "day" our divisor
  // is one day in seconds, so we can divide our seconds by this to get the # of days
  const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1;

  // Intl.RelativeTimeFormat do its magic
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  return rtf.format(Math.floor(deltaSeconds / divisor), units[unitIndex]);
}
// End Utility Methods

// Common features
window.addEventListener("online", () =>
  console.log("%c Your computer is Online. ", "color: #3BDC96")
);
window.addEventListener("offline", () =>
  console.log("%c Your computer is Offline. ", "color: #FF5B5B")
);

// xApp list module

const loadCard = (forceLoad) => {
  if (forceLoad) {
    console.log(`%cRe-fetched the xApp list`, "color: #3BDC96;");
  }
  window.xAppBuilder.send("load-all-xapps", forceLoad);
};

window.xAppBuilder.receive("all-xApps", (args) => {
  renderCard(JSON.parse(args));
});

const renderCard = (event) => {
  const xappList = document.getElementById("xapp-list");
  xappList.innerHTML = "";
  if (event.error || event === 1) {
    // console.log(
    //   "%c JWT expired. Please scan the QR code & import your xApps.",
    //   "color: red; font-weight: bold"
    // );
    xAppImporter();
    return;
  }

  const title = document.getElementById("title").classList;
  if (title.contains("titleImort")) {
    title.remove("titleImort");
  }

  if (xappList.classList.contains("invisible")) {
    xappList.classList.remove("invisible");
  }
  const importer = document.getElementById("importer").classList;
  if (!importer.contains("invisible")) {
    importer.add("invisible");
  }

  const loggedOut = document.getElementById("logged-out").classList;
  const loggedIn = document.getElementById("logged-in").classList;
  const selectionRefresh = document.getElementById(
    "selection-refresh-div"
  ).classList;
  if (!loggedOut.contains("invisible")) {
    loggedOut.add("invisible");
  }
  if (loggedIn.contains("invisible")) {
    loggedIn.remove("invisible");
  }

  if (selectionRefresh.contains("fade")) {
    selectionRefresh.remove("fade");
  }

  if (event.length === 0) {
    const li1 = document.createElement("li");
    li1.classList.add("text-bg-light");
    li1.classList.add("defaultBGColor");
    li1.innerHTML = "No xApps to list.";
    li1.classList.add("list-group-item");
    xappList.appendChild(li1);

    const li2 = document.createElement("li");
    li2.classList.add("text-bg-light");
    li2.classList.add("defaultBGColor");
    li2.classList.add("pointing");
    li2.classList.add("list-group-item");
    li2.innerHTML = "Create at: https://apps.xumm.dev/";
    li2.addEventListener("click", () => {
      openExternal("https://apps.xumm.dev/");
    });
    xappList.appendChild(li2);
  } else {
    event.map((list) => {
      const li = document.createElement("li");
      li.classList.add("text-bg-light");
      li.classList.add("pointing");
      if (activeApp === list.uuid) {
        li.classList.add("activeBGColor");
        appTitle = list.name;
      } else {
        li.classList.add("defaultBGColor");
      }

      if (!list.canLaunch) {
        li.classList.add("text-muted");
        li.classList.add("canNotLaunch");
      }
      li.addEventListener("click", () => {
        openApp(list.uuid, list.canLaunch, list.xapp, list.icon, list.name);
      });
      li.classList.add("list-group-item");
      li.classList.add("hstack");
      li.classList.add("gap-2");
      li.setAttribute("id", list.uuid);
      li.setAttribute("title", list.description);

      const content = `<img src="${
        list.icon
      }" width="50" height="50" class="img-thumbnail ms-2" alt="${
        list.name
      }"  /> <div class="mt-1">${
        list.canLaunch ? `<strong>${list.name}</strong>` : list.name
      } <br /><small style="font-size: small;">${
        list.description.length > 30
          ? list.description.substring(0, 29) + ".."
          : list.description
      }</small></div>`;
      li.innerHTML = content;
      xappList.appendChild(li);
    });
    window.xAppBuilder.send("TouchBarReInit");
  }
};

const openApp = (uuid, canLaunch, xapp, icon, name) => {
  cancelModal();
  const isLoading = webviewIsLoading();

  if (isLoading) {
    console.log(
      `%c Please wait until the selected xApp loads completely.`,
      "color: #3BDC96;"
    );
    return;
  }

  console.clear();
  if (!canLaunch) {
    console.log(
      "%c" +
        `You'll have to open the xApp(${xapp}) in your phone at least once, before trying to open it in the xApp Builder.`,
      "font-size: 15px; font-weight: bold"
    );
    console.log(
      "%c" +
        "Steps: Open the xApp in Xumm at least once. And then click on the 'Refetch' button on this page.",
      "font-size: 15px; font-weight: normal"
    );
    window.xAppBuilder.send("title", "Workspace");
    webview.src = "../splashscreen.html";
  } else {
    const xappList = document.getElementById("xapp-list");
    for (var i = 0; i < xappList.childNodes.length; i++) {
      if (xappList.childNodes[i].id === uuid) {
        const active = document.getElementById(uuid).classList;
        if (active.contains("defaultBGColor")) {
          active.remove("defaultBGColor");
          active.add("activeBGColor");
          appTitle = name;
        }
      } else {
        const notActive = document.getElementById(
          xappList.childNodes[i].id
        ).classList;
        if (!notActive.contains("defaultBGColor")) {
          notActive.add("defaultBGColor");
          notActive.remove("activeBGColor");
        }
      }
    }

    window.xAppBuilder.send(
      "save-active-xapp",
      JSON.stringify({ uuid, xapp, icon, name })
    );
    loadxApp();
  }
};

// xApps import module
const xAppImporter = () => {
  cancelModal();
  window.xAppBuilder.send("title", "Import xApps");

  const title = document.getElementById("title").classList;
  if (!title.contains("titleImort")) {
    title.add("titleImort");
  }

  const xappList = document.getElementById("xapp-list").classList;
  if (!xappList.contains("invisible")) {
    xappList.add("invisible");
  }

  const importer = document.getElementById("importer").classList;
  if (importer.contains("invisible")) {
    importer.remove("invisible");
  }

  const loggedOut = document.getElementById("logged-out").classList;
  const loggedIn = document.getElementById("logged-in").classList;
  const selectionRefresh = document.getElementById(
    "selection-refresh-div"
  ).classList;
  if (loggedOut.contains("invisible")) {
    loggedOut.remove("invisible");
  }
  if (!loggedIn.contains("invisible")) {
    loggedIn.add("invisible");
  }
  if (!selectionRefresh.contains("fade")) {
    selectionRefresh.add("fade");
  }

  let uuid4;
  window.xAppBuilder.send("uuid");
  window.xAppBuilder.receive("bearerQR", (args) => {
    document.getElementById("uuid").src = args.data;
    uuid4 = args.uuid4;
  });

  const key = "1KrKDA.diev1Q:Ou2ldX6DFpI1DmZYeW7I-RkQEO2vgOTCcJdQqjNHu0I";
  const realtime = new window.Ably.Realtime(key);
  (async () => {
    await realtime.connection.once("connected");
    const channel = realtime.channels.get("satish");
    channel.subscribe(uuid4, (e) => {
      console.clear();
      window.xAppBuilder.send("save-bearer", e);
      loadCard(true);
      channel.unsubscribe(uuid4);
    });
  })();
};

// Logout - clear storage
const Logout = () => {
  console.clear();
  console.log(
    "%cLogged out. Storage cleared.",
    "color: #3BDC96; font-weight: bold"
  );

  const isLoading = webviewIsLoading();
  if (isLoading) {
    webview.stop();
  }
  window.xAppBuilder.send("title", "Workspace");
  document.getElementById("title").innerHTML = "Workspace";
  if (!webview.src.includes("/splashscreen.html")) {
    webview.src = "../splashscreen.html";
  }
  window.xAppBuilder.send("logout");
  xAppImporter();
};

// For TouchBar
window.xAppBuilder.receive("touched", (args) => {
  openApp(args.uuid, args.canLaunch, args.xapp, args.icon, args.name);
});

window.xAppBuilder.receive("refresh", (args) => {
  webViewReload();
});

window.xAppBuilder.receive("devtool-closed", (args) => {
  console.log(
    `%c You are not supposed to close the dev tool.`,
    "color: #FF5B5B; font-weight: bold;"
  );
  window.xAppBuilder.send("devTool-open");
});

const xAppClose = () => {
  const xAppHeader = document.getElementById("xapp-header").classList;
  if (!xAppHeader.contains("fade")) {
    xAppHeader.add("fade");
  }
  console.log(`%cClosing the xApp.`, "color: #3BDC96;");
  window.xAppBuilder.send("title", "Workspace");
  webview.src = "../splashscreen.html";
};

// Modal cancel when clicked outside

const cancelModal = () => {
  const modals = document.getElementsByClassName("modal");
  for (var i = 0; i < modals.length; i++) {
    if (modals[i].classList.contains("show")) {
      const target = document.getElementById(modals[i].id);
      var modal = bootstrap.Modal.getInstance(target);
      modal.hide();
      return;
    }
  }
};
