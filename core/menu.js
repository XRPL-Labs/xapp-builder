const { Menu, shell } = require("electron");

module.exports = () => {
  let template = [
    { role: "editMenu" },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "What are xApps?",
          click: () => {
            shell.openExternal("https://xumm.readme.io/docs/what-are-xapps");
          },
        },
        {
          label: "Create xApp account",
          click: () => {
            shell.openExternal("https://apps.xumm.dev/");
          },
        },
        {
          label: "Build xApps(dapps)",
          click: () => {
            shell.openExternal(
              "https://docs.xumm.dev/environments/xapps-dapps"
            );
          },
        },
        {
          label: "xAppBuilder: Video Demo",
          click: () => {
            shell.openExternal("https://www.youtube.com/watch?v=aKey9GCx_EA");
          },
        },
        {
          label: "localhost to xAppBuilder",
          click: () => {
            shell.openExternal(
              "https://markdowneditor.online/editor/6496a8380eb6fc72aab90ff9"
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
