const { Menu, shell } = require("electron");

module.exports = () => {
  let template = [
    { role: "editMenu" },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "Learn more",
          click: () => {
            shell.openExternal("https://help.xumm.app/");
          },
        },
        {
          label: "What are xApps?",
          click: () => {
            shell.openExternal("https://xumm.readme.io/docs/what-are-xapps");
          },
        },
        {
          label: "Create xApps?",
          click: () => {
            shell.openExternal("https://apps.xumm.dev/");
          },
        },
        {
          label: "Build xApps(dapps)?",
          click: () => {
            shell.openExternal(
              "https://docs.xumm.dev/environments/xapps-dapps"
            );
          },
        },
      ],
    },
  ];
  if (process.platform === "darwin") template.unshift({ role: "appMenu" });
  let menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
