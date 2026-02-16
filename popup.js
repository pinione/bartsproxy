const badge=document.getElementById("badge");
const toggle=document.getElementById("toggle");
const profileDiv=document.getElementById("profile");

async function refresh(){
  const data=await chrome.storage.local.get({
    status:"OFF",
    activeGlobal:null,
    globalProfiles:[]
  });

  badge.className=data.status==="ON"?"badge on":"badge off";
  badge.textContent=data.status;

  const p=data.globalProfiles.find(x=>x.name===data.activeGlobal);
  profileDiv.textContent=p?
    `Global: ${p.name} (${p.type} ${p.host}:${p.port})`:"";

  toggle.textContent=data.status==="ON"?
    "Wyłącz proxy":"Włącz proxy";
}

toggle.onclick=async()=>{
  const {status="OFF"}=await chrome.storage.local.get("status");
  const next=status==="ON"?"OFF":"ON";
  await chrome.runtime.sendMessage(next);
  refresh();
};

document.getElementById("config").onclick=
  ()=>chrome.runtime.openOptionsPage();

refresh();
