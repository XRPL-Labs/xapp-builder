const PaymentTransaction = (result, myAccount) => {
  const transactionType = document.getElementById("transactionType");
  const transactionStatus = document.getElementById("transactionStatus");
  const transactionDate = document.getElementById("transactionDate");
  const inOut = document.getElementById("in-out");
  const transactionAmount = document.getElementById("transactionAmount");
  const fromAvatar = document.getElementById("fromAvatar");
  const fromAddress = document.getElementById("fromAddress");
  const toAvatar = document.getElementById("toAvatar");
  const toAddress = document.getElementById("toAddress");
  const transactionId = document.getElementById("transactionId");
  const transactionFinal = document.getElementById("transactionFinal");

  transactionType.innerHTML = result.TransactionType;
  transactionStatus.innerHTML = result?.meta?.TransactionResult;
  if (result?.meta?.TransactionResult === "tesSUCCESS") {
    transactionStatus.classList.add("text-bg-success");
  } else {
    transactionStatus.classList.add("text-bg-danger");
  }
  transactionDate.innerHTML = epochToDate(result.date);
  if (result?.Amount !== undefined) {
    if (typeof result?.Amount === "string") {
      transactionAmount.innerHTML = result?.Amount / 1_000_000 + "  XRP";
    } else {
      transactionAmount.innerHTML =
        result?.Amount?.value + result?.Amount?.currency?.length < 3
          ? result?.Amount?.currency
          : Buffer.from(result?.Amount?.currency, "hex").toString("utf8");
    }
    const amount = document.getElementById("amount");
    if (amount.classList.contains("invisible")) {
      amount.classList.remove("invisible");
    }
  } else {
    const amount = document.getElementById("amount");
    if (!amount.classList.contains("invisible")) {
      amount.classList.add("invisible");
    }
  }

  if (fromAddress === myAccount) {
    transactionAmount.classList.add("text-danger");
    inOut.classList.add("bi-arrow-90deg-left");
  } else {
    transactionAmount.classList.add("xummBgColor");
    inOut.classList.add("bi-arrow-90deg-right");
  }
  if (result?.Account !== undefined) {
    fromAvatar.src = `https://xumm.app/avatar/${result?.Account}_200.png`;
    fromAddress.innerHTML = result.Account;
  }
  if (result?.Destination !== undefined) {
    toAvatar.src = `https://xumm.app/avatar/${result?.Destination}_200.png`;
    toAddress.innerHTML = result?.Destination;
    const to = document.getElementById("to");
    if (to.classList.contains("invisible")) {
      to.classList.remove("invisible");
    }
    const downArrow = document.getElementById("down-arrow").classList;
    if (downArrow.contains("invisible")) {
      downArrow.remove("invisible");
    }
  } else {
    const downArrow = document.getElementById("down-arrow").classList;
    if (!downArrow.contains("invisible")) {
      downArrow.add("invisible");
    }

    const to = document.getElementById("to").classList;
    if (!to.contains("invisible")) {
      to.add("invisible");
    }
  }

  transactionId.innerHTML = result.hash;
  transactionFinal.innerHTML = `This transaction was successful and validated in ledger <span class="fw-bold">${
    result.inLedger
  }</span> on <span class="fw-bold">${epochToDate(
    result.date
  )}</span>, and it consumed ${result.Fee / 1_000_000} XRP as transaction fee.`;
};

const OpenSignRequest = (result) => {
  const icon_url = document.getElementById("icon_url");
  const application_name = document.getElementById("application_name");
  const instruction = document.getElementById("instruction");
  const transactionType = document.getElementById("transactionType-review");
  const fromAvatar = document.getElementById("fromAvatar-review");
  const fromAddress = document.getElementById("fromAddress-review");
  const toAvatar = document.getElementById("toAvatar-review");
  const toAddress = document.getElementById("toAddress-review");
  const amountRequested = document.getElementById("amountRequested");

  icon_url.src = result.application.icon_url;
  application_name.innerHTML = result.application.name;
  instruction.innerHTML =
    result.custom_meta.instruction ?? result.application.description;
  transactionType.innerHTML = result.payload.request_json.TransactionType;

  fromAvatar.src = `https://xumm.app/avatar/${result.payload.request_json.Account}_200.png`;
  fromAddress.innerHTML = result.payload.request_json.Account;

  if (result?.payload?.request_json?.Destination !== undefined) {
    const to = document.getElementById("to-review").classList;
    if (to.contains("invisible")) {
      to.remove("invisible");
    }
    const downArrow = document.getElementById("down-arrow-review").classList;
    if (downArrow.contains("invisible")) {
      downArrow.remove("invisible");
    }

    toAvatar.src = `https://xumm.app/avatar/${result.payload.request_json.Destination}_200.png`;
    toAddress.innerHTML = result.payload.request_json.Destination;
  } else {
    const to = document.getElementById("to-review").classList;
    if (!to.contains("invisible")) {
      to.add("invisible");
    }
    const downArrow = document.getElementById("down-arrow-review").classList;
    if (!downArrow.contains("invisible")) {
      downArrow.add("invisible");
    }
  }

  if (result?.payload?.request_json?.Amount !== undefined) {
    if (typeof result.payload.request_json.Amount === "string") {
      amountRequested.innerHTML =
        result.payload.request_json.Amount / 1_000_000 + " XRP";
    } else {
      amountRequested.innerHTML =
        result.payload.request_json.Amount.value +
          result.payload.request_json.Amount.currency.length <
        3
          ? result.payload.request_json.Amount.currency
          : Buffer.from(
              result.payload.request_json.Amount.currency,
              "hex"
            ).toString("utf8");
    }

    const amount = document.getElementById("amount-review").classList;
    if (amount.contains("invisible")) {
      amount.remove("invisible");
    }
  } else {
    const amount = document.getElementById("amount-review").classList;
    if (!amount.contains("invisible")) {
      amount.add("invisible");
    }
  }
};

AcceptPayment = async (uuid) => {
  document.getElementById(
    "qr_code"
  ).src = `https://xumm.app/sign/${uuid}_h.png`;
  const acceptRequestBtn = document.getElementById("acceptRequestBtn");
  acceptRequestBtn.click();
  const Client = new WebSocket(`wss://xumm.app/sign/${uuid}`);

  const callDeclinedPayment = (e) => {
    Sdk.payload.cancel(uuid).then((data) => {
      const response = {
        reason: "DECLINED",
        method: "payloadResolved",
        uuid: uuid,
      };
      webview.send("send-to-xapp", JSON.stringify(response));
      Client.close();
    });
  };

  document
    .getElementById("signRequestModalBtnInvoke")
    .addEventListener("click", callDeclinedPayment);

  Client.addEventListener("message", (data) => {
    let payload = JSON.parse(data.data);
    const scanStatus = document.getElementById("scan-status");
    if (payload.opened) {
      scanStatus.innerHTML = "Opened";
    } else if (payload.pre_signed) {
      scanStatus.innerHTML = "Signed ";
    } else if (payload.dispatched) {
      scanStatus.innerHTML = "Dispatched ";
    }

    if (payload.signed === false) {
      Sdk.payload.cancel(uuid).then((data) => {
        const response = {
          reason: "DECLINED",
          method: "payloadResolved",
          uuid: uuid,
        };
        console.log(`%cTransaction Declined.`, "color: #3BDC96;");
        webview.send("send-to-xapp", JSON.stringify(response));
        Client.close();
      });
    } else if (payload.signed === true) {
      const response = {
        reason: "SIGNED",
        method: "payloadResolved",
        uuid: uuid,
      };
      console.log(`%cTransaction Signed.`, "color: #3BDC96;");
      webview.send("send-to-xapp", JSON.stringify(response));
      Client.close();
    }
  });

  Client.addEventListener("open", (data) => {
    console.log(`%cListening to sign / reject action.`, "color: #3BDC96;");
  });
  Client.addEventListener("close", (data) => {
    document.getElementById("signRequestModalBtnClose").click();
  });
};

const epochToDate = (timeEpoch) => {
  const now = timeEpoch + 946684800;
  var myDate = new Date(now * 1000);
  return myDate.toLocaleString(
    Intl.NumberFormat().resolvedOptions().locale === "en-IN" ||
      Intl.NumberFormat().resolvedOptions().locale === "de-DE"
      ? Intl.NumberFormat().resolvedOptions().locale
      : "en-US",
    {
      dateStyle: "full",
      timeStyle: "medium",
      timeZone:
        Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Europe/Amsterdam",
    }
  );
};

// module.exports = {
//   PaymentTransaction: PaymentTransaction,
//   OpenSignRequest: OpenSignRequest,
// };
