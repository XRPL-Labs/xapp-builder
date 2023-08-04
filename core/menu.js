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
          label: "About xAppBuilder",
          click: () => {
            shell.openExternal(
              "https://docs.xumm.dev/environments/xapps-dapps/xappbuilder"
            );
          },
        },
        {
          label: "xAppBuilder FAQ",
          click: () => {
            shell.openExternal(
              "https://docs.xumm.dev/environments/xapps-dapps/xappbuilder/xappbuilder-faq"
            );
          },
        },
        {
          label: "localhost to xAppBuilder",
          click: () => {
            shell.openExternal(
              "https://docs.xumm.dev/environments/xapps-dapps/xappbuilder/connecting-localhost-to-xappbuilder"
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
