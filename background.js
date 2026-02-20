const ICONS = {
  ON: {
    16: "on_proxy.png",
    32: "on_proxy.png",
    48: "on_proxy.png",
    128: "on_proxy.png"
  },
  OFF: {
    16: "off_proxy.png",
    32: "off_proxy.png",
    48: "off_proxy.png",
    128: "off_proxy.png"
  }
};

function setStatusIcon(status) {
  return chrome.action.setIcon({ path: status === "ON" ? ICONS.ON : ICONS.OFF });
}

async function buildPAC() {
  const {
    mode = "whitelist",
    killSwitch = false,
    activeGlobal = null,
    globalProfiles = [],
    rules = []
  } = await chrome.storage.local.get([
    "mode", "killSwitch", "activeGlobal", "globalProfiles", "rules"
  ]);

  const activeProfile =
    globalProfiles.find(p => p.name === activeGlobal) || null;

  return `
function FindProxyForURL(url, host) {

  const mode = "${mode}";
  const killSwitch = ${killSwitch};
  const activeProfile = ${JSON.stringify(activeProfile)};
  const rules = ${JSON.stringify(rules)};

  function block(){ return "PROXY 0.0.0.0:0"; }

  function match(pattern, host){
    var re="^"+pattern.replace(/\\./g,"\\\\.")
                      .replace(/\\*/g,".*")+"$";
    return new RegExp(re).test(host);
  }

  function whitelistMatch(){
    for(var i=0;i<rules.length;i++){
      var r=rules[i];
      if(match(r.pattern,host)){
        if(r.type==="DIRECT") return "DIRECT";
        return r.type+" "+r.host+":"+r.port;
      }
    }
    return null;
  }

  if(mode==="whitelist"){
    var w=whitelistMatch();
    if(w)return w;
    return killSwitch?block():"DIRECT";
  }

  if(mode==="global"){
    if(!activeProfile)return killSwitch?block():"DIRECT";
    return activeProfile.type+" "+activeProfile.host+":"+activeProfile.port;
  }

  if(mode==="global_whitelist"){
    var w=whitelistMatch();
    if(w)return w;
    if(!activeProfile)return killSwitch?block():"DIRECT";
    return activeProfile.type+" "+activeProfile.host+":"+activeProfile.port;
  }

  return "DIRECT";
}
`;
}

async function applyPAC() {
  const pac = await buildPAC();
  await chrome.proxy.settings.set({
    value: { mode: "pac_script", pacScript: { data: pac } },
    scope: "regular"
  });
}

async function enable() {
  await applyPAC();
  await chrome.storage.local.set({ status: "ON" });
  await setStatusIcon("ON");
}

async function disable() {
  await chrome.proxy.settings.clear({ scope: "regular" });
  await chrome.storage.local.set({ status: "OFF" });
  await setStatusIcon("OFF");
}

async function syncIconWithStatus() {
  const { status = "OFF" } = await chrome.storage.local.get("status");
  await setStatusIcon(status);
}

chrome.storage.onChanged.addListener((c, a) => {
  if (a !== "local") return;
  if (c.mode || c.killSwitch || c.rules || c.activeGlobal || c.globalProfiles) {
    chrome.storage.local.get("status").then(({ status }) => {
      if (status === "ON") applyPAC();
    });
  }
});

chrome.runtime.onStartup.addListener(syncIconWithStatus);
chrome.runtime.onInstalled.addListener(syncIconWithStatus);
syncIconWithStatus();

chrome.runtime.onMessage.addListener((msg, s, sendResponse) => {
  (async () => {
    if (msg === "ON") {
      await enable();
      sendResponse({ status: "ON" });
    }
    if (msg === "OFF") {
      await disable();
      sendResponse({ status: "OFF" });
    }
  })();
  return true;
});
