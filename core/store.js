const Store = require("electron-store");
const storage = new Store();

const getWindowSettings = () => {
  const default_bounds = [1360, 780];
  const size = storage.get("win-size");

  if (size) return size;
  else {
    storage.set("win-size", default_bounds);
    return default_bounds;
  }
};

const getPosition = () => {
  const default_position = [200, 200];
  const position = storage.get("win-position");

  if (position) return position;
  else {
    storage.set("win-position", default_position);
    return default_position;
  }
};

const savePosition = (position) => {
  storage.set("win-position", position);
};

const saveBounds = (bounds) => {
  storage.set("win-size", bounds);
};

const setBearer = (bearer) => {
  storage.set("bearer", bearer);
};

const getBearer = () => {
  return storage.get("bearer");
};

const getAllApps = async (args) => {
  const allApps = storage.get("all-xapps");

  if (allApps === 1 && !args) {
    return allApps;
  }

  if (!args && allApps !== undefined && allApps.error === undefined) {
    return allApps;
  }

  const bearer = getBearer();
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
    },
  };
  const result = await fetch(
    `https://xumm.app/api/v1/jwt/xapp-emulator`,
    options
  );
  const res = await result.json();
  storage.set("all-xapps", res);

  return res;
};

const setActiveApp = (xapp) => {
  storage.set("activeApp", xapp);
};

const getActiveApp = () => {
  return storage.get("activeApp");
};

const getActiveAppOtt = async () => {
  const ott = storage.get("active-xapp-ott");

  const activeApp = storage.get("activeApp");
  if (activeApp === undefined) {
    return activeApp;
  }

  const xappUUID = JSON.parse(activeApp);
  /*
  When the xApp is opened using a different raddress, it doesn't reflect on the xAppBuilder as the data is fetched from odl storage.
  if (ott !== undefined) {
    if (ott[0]?.app === xappUUID?.uuid) return ott;
  }
*/
  const bearer = getBearer();

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
    },
  };
  const result = await fetch(
    `https://xumm.app/api/v1/jwt/xapp-emulator/${xappUUID.uuid}`,
    options
  );

  const res = await result.json();

  if (res.error) {
    return res;
  }
  const array = [];
  const temp = [];
  res.forEach((currentValue, index) => {
    if (!temp.includes(currentValue.account)) {
      temp.push(currentValue.account);
      array.push(currentValue);
    }
  });
  storage.set("active-xapp-ott", array);
  // console.log("array ", array);

  return array;
};

const getReplayOtt = async (app, ott) => {
  const bearer = getBearer();

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
    },
  };
  const result = await fetch(
    `https://xumm.app/api/v1/jwt/xapp-emulator/${app}/${ott}`,
    options
  );

  return await result.json();
};

const clearStorage = () => {
  storage.set("all-xapps", 1);
  storage.delete("activeApp");
  storage.delete("bearer");
  storage.delete("active-xapp-ott"); // added before release, so monitor for sometime.
};

module.exports = {
  getWindowSettings,
  saveBounds,
  savePosition,
  getPosition,
  setBearer,
  getAllApps,
  setActiveApp,
  getActiveApp,
  getActiveAppOtt,
  getReplayOtt,
  clearStorage,
};
