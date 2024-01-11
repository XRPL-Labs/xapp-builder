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
  previousSpace = 0,
  networkInfo = "Mainnet",
  networkName = "",
  rails = {},
  activeAppArray = [],
  NetworkList = [],
  fromNetworkSelection = 0;

const demoApps = [
  {
    uuid: "todo",
    name: "Todo List xApp",
    description: "The Best Productivity Tool.",
    icon: "../assets/images/sample-xapps/todo.png",
    canLaunch: true,
    active: false,
  },
  {
    uuid: "survey",
    name: "Survey xApp",
    description: "Sample Survey xApp",
    icon: "../assets/images/sample-xapps/survey.png",
    canLaunch: true,
    active: false,
  },
];

const webview = document.querySelector("webview");

const loadxApp = () => {
  window.xAppBuilder.send("open-active-xapp");
  if (loadSidebar) {
    loadSidebar = 0;
    loadCard(false);
  }
};
window.xAppBuilder.receive("active-xapp", async (args) => {
  if (args === undefined) {
    const xAppHeader = document.getElementById("xapp-header").classList;
    if (!xAppHeader.contains("fade")) {
      xAppHeader.add("fade");
    }

    removeAddressBar();

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
    removeAddressBar();
    xAppImporter();
    return;
  }

  if (data.length === 0) {
    removeAddressBar();
    console.log(
      `%cSelect different xApp from the left sidebar.`,
      "color: gray; font-weight: bold"
    );
    console.log(
      "%cPlease remember to open the xApp inside Xumm to re-activate the session.",
      "color: red; font-weight: bold"
    );
    console.log(
      "%cNote: After opening xApp in Xumm, click on 'Refetch' link in the top left corner of xAppBuilder.",
      "color: red; font-weight: bold"
    );

    return;
  }

  let addressPresent = false;

  const networkListTemp = [];
  activeAppArray = data;
  data.map((app) => {
    if (!networkListTemp.includes(app.account)) {
      networkListTemp.push(app.account);

      const option = document.createElement("option");
      if (app.account === selectedAccount) {
        networkName = app.network;
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
    }
  });

  if (!addressPresent) {
    activeApp = data[0].app;
    selectedAccount = data[0].account;
    activeOtt = data[0].ott;
    networkName = data[0].network;
  } else {
    document.getElementById("raddresses").value = activeOtt;
  }
  // Start: 1/4
  NetworkList = [];
  activeAppArray.map((app) => {
    if (app.account === selectedAccount) {
      NetworkList.push(app.network);
    }
  });
  // End: 1/4

  const selectionRefresh = document.getElementById(
    "selection-refresh-div"
  ).classList;
  if (selectionRefresh.contains("fade") && selectedAccount !== undefined) {
    selectionRefresh.remove("fade");
  }

  window.xAppBuilder.send("get-active-xapp", {
    app: activeApp,
    ott: activeOtt,
  });
});

window.xAppBuilder.receive("saved-active-xapp", async (args) => {
  const data = JSON.parse(args);
  if (data.error) {
    const xAppHeader = document.getElementById("xapp-header").classList;
    if (!xAppHeader.contains("fade")) {
      xAppHeader.add("fade");
    }
    window.xAppBuilder.send("logout"); // just added at the last moment to see if the active app selection can be removed.
    console.log(
      "%cJWT expired. Please scan the QR code & import your xApps.",
      "color: red; font-weight: bold"
    );
    xAppImporter();
    return;
  }

  if (data.app !== activeApp) {
    // If the user quickly clicked on different xApp, but the server returned result for the old request, then do not process the old result.
    return;
  }

  Sdk = new XummSdkJwt(data.app, data.ott);

  const c = await Sdk.ping();
  myAccount = c?.account;
  appName = c?.application?.name;
  networkInfo = c?.jwtData?.net;
  appTitle = c?.jwtData?.app_name;
  //  ottExpires = c?.jwtData?.exp;

  if (!fromNetworkSelection) console.clear();
  fromNetworkSelection = 0; // reset it. Again if it comes from the network selection, then it's value will be 1.
  console.log(
    `%cPlease wait until the selected xApp loads.`,
    "color: #FF5B5B; font-weight: bold;"
  );
  document.getElementById("title").innerHTML = appTitle;
  document.getElementById("appName").innerHTML =
    appTitle.length > 19 ? appTitle.substring(0, 19) + "..." : appTitle;
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
  console.log(`%c Network: ${networkInfo}`, "color: #3BDC96;");
  /*
  console.log(
    `%c OTT Expires: ${new Date(ottExpires * 1000).toLocaleString(
      Intl.NumberFormat().resolvedOptions().locale,
      {
        dateStyle: "full",
        timeStyle: "medium",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    )}`,
    "color: #3BDC96;"
  );
  */
  console.log("\n");

  activeApp = data.app;
  activeOtt = data.ott;

  // Start: Load the Network List
  await SwitchNetworkEventCreate(NetworkList, networkName, false);
  // End: Load the rails

  window.xAppBuilder.send("title", "");

  const isLoading = webviewIsLoading();
  if (isLoading) {
    webview.stop();
  }

  webview.src = data.url;
  webview.setUserAgent("xumm/xapp");
});

const webviewIsLoading = () => {
  return webview.isLoading() || webviewLoading;
};

const context = (sel) => {
  selectedAccount = sel.options[sel.selectedIndex].text;
  // Start: 2/4
  NetworkList = [];
  activeAppArray.map((app) => {
    if (app.account === selectedAccount) {
      NetworkList.push(app.network);
    }
  });
  // End: 2/4

  window.xAppBuilder.send("get-active-xapp", {
    app: activeApp,
    ott: document.getElementById("raddresses").value,
  });
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
    //     console.log("Extra ", JSON.stringify(e, null, "\t"));
  }
});

const loadstart = () => {
  webviewLoading = true;
  const spinner = document.getElementById("loader");
  spinner.style.display = "inline";
  // Removed below line, as a bootstrap spinner is added in the loading UI
  //spinner.innerHTML = "loading ...";

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
    const networkparameter = rails[networkName].endpoints.map(
      (array) => array.url
    );
    const inputs = { tx: args.tx, network: networkparameter };
    window.xAppBuilder.send("tx", inputs);
    // window.xAppBuilder.send("tx", args.tx);
    /*
    const txInfo = await Sdk.getTransaction(args.tx);
    console.log(txInfo);
    */

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
      appName =
        xapp.name.length > 19 ? xapp.name.substring(0, 19) + "..." : xapp.name;
      appIcon = xapp.icon;
      document.getElementById("app-name").innerHTML = appName;
      document.getElementById("dialog-image").src = appIcon;
      if (args.url.length > 48) {
        document.getElementById(
          "display-external-url"
        ).innerHTML = `<pre>${args.url}</pre>`;
      } else {
        document.getElementById("display-external-url").innerHTML = args.url;
      }

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
          method: "scanQr",
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
            method: "scanQr",
            qrContents: null,
            reason: "INVALID_QR",
          };
        } else {
          action = {
            method: "scanQr",
            qrContents: result,
            reason: "SCANNED",
          };
        }

        webview.send("send-to-xapp", JSON.stringify(action));
      });
  } else if (args.command === "ready") {
    const action = {
      method: "ready",
    };
    webview.send("send-to-xapp", JSON.stringify(action));
  } else if (args.command === "networkswitch") {
    const action = {
      method: "networkSwitch",
      network: args.network.toUpperCase(),
    };

    // Start: 4/4
    NetworkList = [];
    activeAppArray.map((app) => {
      if (app.account === selectedAccount) {
        NetworkList.push(app.network);
        if (app.network === args.network.toUpperCase()) {
          activeOtt = app.ott;
          activeApp = app.app;
        }
      }
    });
    // End: 4/4

    await SwitchNetworkEventCreate(
      NetworkList,
      args.network.toUpperCase(),
      true
    );
    //webview.send("send-to-xapp", JSON.stringify(action));
    // ^ it's called in SwitchNetworkEventCreate method itself.
  } else {
    const action = {
      method: args.command,
      ...args,
    };
    webview.send("send-to-xapp", JSON.stringify(action));
  }
});

document.getElementById("open-external-link").addEventListener("click", (e) => {
  const linkToOpen = document.getElementById("external-url").innerHTML;
  if (linkToOpen !== "") {
    openExternal(linkToOpen);
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

// Common features
window.addEventListener("online", () =>
  console.log("%c Your computer is Online. ", "color: #3BDC96")
);
window.addEventListener("offline", () =>
  console.log("%c Your computer is Offline. ", "color: #FF5B5B")
);

// xApp list module

const loadCard = (forceLoad) => {
  let refetch = document.getElementById("refetch").innerHTML;
  if (refetch.trim() !== "Refetch") {
    refetch = "Refetch";
  }
  if (forceLoad) {
    if (selectedAccount === undefined) {
      console.log(`%cFetched the xApp list`, "color: #3BDC96;");
    } else {
      console.log(`%cRe-fetched the xApp list`, "color: #3BDC96;");
    }
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
  if (!loggedOut.contains("invisible")) {
    loggedOut.add("invisible");
  }
  if (loggedIn.contains("invisible")) {
    loggedIn.remove("invisible");
  }

  const selectionRefresh = document.getElementById(
    "selection-refresh-div"
  ).classList;
  if (selectionRefresh.contains("fade") && selectedAccount !== undefined) {
    selectionRefresh.remove("fade");
  }

  if (event.length === 0) {
    console.log(
      "%cPlease create an xApp account first, if you have not already: https://apps.xumm.dev -> xApp.\n",
      "color: red; font-weight: bold"
    );
    console.log(
      "%c------------------------------------------------------------------------------\n",
      "color: black; font-weight: bold"
    );
    console.log(
      "%cIf you already have an xApp, but it's not showing up in xAppBuilder:",
      "color: red; font-weight: bold"
    );
    console.log(
      "%cPlease log into Xumm Developer Console account(https://apps.xumm.dev). Navigate to the xApp section, and add your Device ID(open Xumm -> Settings -> Advance -> Device ID) to 'Debug Device ID' field -> Save. Once done, click on 'Refetch' button in xAppBuilder(top left corner).",
      "color: red;"
    );
    console.log(
      "%c------------------------------------------------------------------------------\n",
      "color: black; font-weight: bold"
    );
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
      }" width="50px" height="50px" style="border-radius: 12px;" 
      class="ms-2" alt="${
        list.name
      }"  /> <div class="mt-1" style="line-height: normal;">${
        list.canLaunch ? `<strong>${list.name}</strong>` : list.name
      } <br /><small style="font-size: small;">${
        list.description.length > 30
          ? list.description.substring(0, 29) + ".."
          : list.description
      }</small></div>`;
      li.innerHTML = content;
      xappList.appendChild(li);

      // moved to end as it auto launches last selected xApp, and the dom has to be rendered before invoking it.
      // added && list.canLaunch - to avoid launching inactive apps(avoids blocking of login.)
      if (activeApp === list.uuid && list.canLaunch) {
        li.classList.add("activeBGColor");
        appTitle = list.name;

        setTimeout(() => {
          openApp(list.uuid, list.canLaunch, list.xapp, list.icon, list.name);
        }, 500);
      } else {
        li.classList.add("defaultBGColor");
      }
    });
    window.xAppBuilder.send("TouchBarReInit");
  }
};

const openApp = (uuid, canLaunch, xapp, icon, name) => {
  cancelModal();
  appTitle = name;
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
        `You'll have to open the xApp(${xapp}) in your phone at least once, before trying to open it in the xAppBuilder.`,
      "font-size: 15px; font-weight: bold"
    );
    console.log(
      "%c" +
        "Instruction: Open the xApp(link below) in Xumm now. And then click on the 'Refetch' button on this page(top left corner).",
      "font-size: 15px; font-weight: normal"
    );
    console.log("\n");
    console.log(`https://xumm.app/detect/xapp:${xapp}`);
    window.xAppBuilder.send("title", "Workspace");
    if (!webview.src.includes("/splashscreen.html")) {
      webview.src = "../splashscreen.html";
    }
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
  removeAppHeader();
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
      realtime.close();
    });
  })();
};

// Logout - clear storage
const Logout = () => {
  // During demo, the 'Refetch' button in made invisible. Lets re-enable it here.
  const refetch = document.getElementById("refetch");
  if (refetch.classList.contains("invisible")) {
    refetch.classList.remove("invisible");
  }

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
  removeAppHeader();
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
  if (!webview.src.includes("/splashscreen.html")) {
    webview.src = "../splashscreen.html";
  }
};

const Demo = () => {
  const refetch = document.getElementById("refetch");
  if (!refetch.classList.contains("invisible")) {
    refetch.classList.add("invisible");
  }

  const xappList = document.getElementById("xapp-list");
  xappList.innerHTML = "";

  if (xappList.classList.contains("invisible")) {
    xappList.classList.remove("invisible");
  }
  const importer = document.getElementById("importer").classList;
  if (!importer.contains("invisible")) {
    importer.add("invisible");
  }

  const loggedOut = document.getElementById("logged-out").classList;
  const loggedIn = document.getElementById("logged-in").classList;
  if (!loggedOut.contains("invisible")) {
    loggedOut.add("invisible");
  }
  if (loggedIn.contains("invisible")) {
    loggedIn.remove("invisible");
  }

  demoApps.map((list) => {
    const li = document.createElement("li");
    li.classList.add("text-bg-light");
    li.classList.add("pointing");

    li.addEventListener("click", () => {
      SamplexApp(list.uuid);
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

    if (list.active === true) {
      li.classList.add("activeBGColor");
      appTitle = list.name;
      SamplexApp(list.uuid);
    } else {
      li.classList.add("defaultBGColor");
    }
  });
};

const SamplexApp = (example) => {
  if (
    webview.src !== "https://xapp-sample-todolist.xappscdn.com/" &&
    example === "todo"
  ) {
    console.clear();

    console.log(`%cLoading Sample Todo List xApp ..`, "font-weight: bold");
    webview.src = "https://xapp-sample-todolist.xappscdn.com/";
    document.getElementById("appName").innerHTML = "Todo List xApp";
    const xAppHeader = document.getElementById("xapp-header").classList;
    if (xAppHeader.contains("fade")) {
      xAppHeader.remove("fade");
    }

    demoApps[0].active = true;
    demoApps[1].active = false;
    const active = document.getElementById("todo")?.classList;
    if (active?.contains("defaultBGColor")) {
      active.remove("defaultBGColor");
      active.add("activeBGColor");
    }
    const notActive = document.getElementById("survey")?.classList;
    if (notActive?.contains("activeBGColor")) {
      notActive.remove("activeBGColor");
      notActive.add("defaultBGColor");
    }
  }

  if (
    webview.src !== "https://xapp-sample-survey.xappscdn.com/" &&
    example === "survey"
  ) {
    console.clear();

    console.log(`%cLoading Sample Survey Form xApp ..`, "font-weight: bold");
    webview.src = "https://xapp-sample-survey.xappscdn.com/";
    document.getElementById("appName").innerHTML = "Sample Survey xApp";
    const xAppHeader = document.getElementById("xapp-header").classList;
    if (xAppHeader.contains("fade")) {
      xAppHeader.remove("fade");
    }

    demoApps[0].active = false;
    demoApps[1].active = true;
    const active = document.getElementById("survey")?.classList;
    if (active?.contains("defaultBGColor")) {
      active.remove("defaultBGColor");
      active.add("activeBGColor");
    }
    const notActive = document.getElementById("todo")?.classList;
    if (notActive?.contains("activeBGColor")) {
      notActive.remove("activeBGColor");
      notActive.add("defaultBGColor");
    }
  }
};

const renderScale = (transform) => {
  //console.log(webview.contentWindow);
  const listItems = document.querySelector("#scaling");
  const items = listItems.getElementsByTagName("button");

  for (var i = 0; i < items.length; i++) {
    if (items[i].classList.contains("scaleActiveBtn")) {
      items[i].classList.remove("scaleActiveBtn");
    }
  }
  const activate = document.getElementById(transform);

  if (!activate.classList.contains("scaleActiveBtn")) {
    activate.classList.add("scaleActiveBtn");
  }

  if (transform === "scaleSmall") {
    if (webview.classList.contains("scaleMedium")) {
      webview.classList.remove("scaleMedium");
    }
    if (webview.classList.contains("scaleNormal")) {
      webview.classList.remove("scaleNormal");
    }
    if (!webview.classList.contains("scaleSmall")) {
      webview.classList.add("scaleSmall");
    }

    if (!webview.classList.contains("scaleSmallMainWindow")) {
      webview.classList.add("scaleSmallMainWindow");
    }
    if (webview.classList.contains("scaleNormalMainWindow")) {
      webview.classList.remove("scaleNormalMainWindow");
    }
    if (webview.classList.contains("scaleMediumMainWindow")) {
      webview.classList.remove("scaleMediumMainWindow");
    }
  } else if (transform === "scaleNormal") {
    if (webview.classList.contains("scaleMedium")) {
      webview.classList.remove("scaleMedium");
    }
    if (!webview.classList.contains("scaleNormal")) {
      webview.classList.add("scaleNormal");
    }
    if (webview.classList.contains("scaleSmall")) {
      webview.classList.remove("scaleSmall");
    }

    if (!webview.classList.contains("scaleNormalMainWindow")) {
      webview.classList.add("scaleNormalMainWindow");
    }
    if (webview.classList.contains("scaleSmallMainWindow")) {
      webview.classList.remove("scaleSmallMainWindow");
    }
    if (webview.classList.contains("scaleMediumMainWindow")) {
      webview.classList.remove("scaleMediumMainWindow");
    }
  } else if (transform === "scaleMedium") {
    if (webview.classList.contains("scaleSmall")) {
      webview.classList.remove("scaleSmall");
    }
    if (!webview.classList.contains("scaleNormal")) {
      webview.classList.remove("scaleNormal");
    }
    if (!webview.classList.contains("scaleMedium")) {
      webview.classList.add("scaleMedium");
    }

    if (webview.classList.contains("scaleSmallMainWindow")) {
      webview.classList.remove("scaleSmallMainWindow");
    }
    if (webview.classList.contains("scaleNormalMainWindow")) {
      webview.classList.remove("scaleNormalMainWindow");
    }
    if (!webview.classList.contains("scaleMediumMainWindow")) {
      webview.classList.add("scaleMediumMainWindow");
    }
  } else {
    if (webview.classList.contains("scaleSmall")) {
      webview.classList.remove("scaleSmall");
    }
    if (webview.classList.contains("scaleNormal")) {
      webview.classList.remove("scaleNormal");
    }
    if (webview.classList.contains("scaleMedium")) {
      webview.classList.remove("scaleMedium");
    }
    if (webview.classList.contains("scaleSmallMainWindow")) {
      webview.classList.remove("scaleSmallMainWindow");
    }
    if (webview.classList.contains("scaleMediumMainWindow")) {
      webview.classList.remove("mainWindow");
    }
    if (!webview.classList.contains("mainWindow")) {
      webview.classList.add("mainWindow");
    }
    if (webview.classList.contains("scaleSmallMainWindow")) {
      webview.classList.remove("scaleSmallMainWindow");
    }
    if (webview.classList.contains("scaleNormalMainWindow")) {
      webview.classList.remove("scaleNormalMainWindow");
    }
    if (webview.classList.contains("scaleMediumMainWindow")) {
      webview.classList.remove("scaleMediumMainWindow");
    }
  }
};

const removeAddressBar = () => {
  const selectionRefresh = document.getElementById(
    "selection-refresh-div"
  ).classList;
  if (!selectionRefresh.contains("fade")) {
    selectionRefresh.add("fade");
  }
};

const removeAppHeader = () => {
  const xAppHeader = document.getElementById("xapp-header").classList;
  if (!xAppHeader.contains("fade")) {
    xAppHeader.add("fade");
  }
};

const InvokeNetworkSwitching = async (networkInvoked) => {
  // Start: 3/4
  NetworkList = [];
  activeAppArray.map((app) => {
    if (app.account === selectedAccount) {
      NetworkList.push(app.network);
      if (app.network === networkInvoked) {
        activeOtt = app.ott;
        activeApp = app.app;
      }
    }
  });
  // End: 3/4

  await SwitchNetworkEventCreate(NetworkList, networkInvoked, true);
};

const SwitchNetworkEventCreate = async (
  networkNamesArray,
  networkInvoked,
  flag
) => {
  if (flag) fromNetworkSelection = 1;

  const switchNetwork = document.getElementById("network-switch");
  switchNetwork.innerHTML = "";

  Sdk = new XummSdkJwt(activeApp, activeOtt);
  rails = await Sdk.getRails();

  networkNamesArray.map((network) => {
    const li = document.createElement("li");
    li.classList.add("hstack");
    li.classList.add("gap-1");
    li.addEventListener("click", () => {
      InvokeNetworkSwitching(network);
    });

    const a = document.createElement("a");

    a.classList.add("dropdown-item");
    a.href = "#";
    a.innerHTML = network;
    a.style.marginRight = "5px";
    a.id = network;

    if ("#FFFD74" === rails[network].color) {
      rails[network].color = "#F8BF4C";
    }

    if (networkInvoked === network) {
      document.getElementById("network-switch-color").style.color =
        rails[network].color;
      a.classList.add("active");
      networkName = network; // Important: To send to xApp

      if (flag) {
        console.log(
          "%c\nSwitching Network ...",
          "font-weight: bolder; font-size: 1.1vw;"
        );
      } else {
        console.log("\n");
      }
      if (!fromNetworkSelection) {
        console.log(
          `%c Network Name: ${rails[network].name} ( ${network} )`,
          `color: ${rails[network].color};`
        );
        console.log(
          `%c Chain ID: ${rails[network].chain_id}`,
          `color: ${rails[network].color};`
        );
        console.log(
          `%c Native Asset: ${rails[network].native_asset}`,
          `color: ${rails[network].color};`
        );
        console.log(
          `%c Reserve: Account ${rails[network].reserves.account} ${rails[network].native_asset}, Object ${rails[network].reserves.object} ${rails[network].native_asset} `,
          `color: ${rails[network].color};`
        );
        console.log("\n");
      }
    }

    const span = document.createElement("span");
    span.innerHTML = "⦿";
    span.style.color = rails[network].color;
    span.style.marginLeft = "5px";
    li.appendChild(span);
    li.appendChild(a);
    switchNetwork.appendChild(li);
  });

  if (flag) {
    webview.send(
      "send-to-xapp",
      JSON.stringify({ method: "networkSwitch", network: networkInvoked })
    );

    window.xAppBuilder.send("get-active-xapp", {
      app: activeApp,
      ott: activeOtt,
    });
  }
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
