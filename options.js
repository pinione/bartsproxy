const patternInput=document.getElementById("pattern");
const wtypeInput=document.getElementById("wtype");
const whostInput=document.getElementById("whost");
const wportInput=document.getElementById("wport");

const glist=document.getElementById("glist");
const list=document.getElementById("list");

async function load(){
  const data=await chrome.storage.local.get({
    mode:"whitelist",
    rules:[],
    globalProfiles:[],
    activeGlobal:null
  });

  document.querySelectorAll("input[name=mode]").forEach(r=>{
    r.checked=r.value===data.mode;
    r.onchange=()=>chrome.storage.local.set({mode:r.value});
  });

  glist.innerHTML="";
  data.globalProfiles.forEach(p=>{
    const li=document.createElement("li");

    const useBtn=document.createElement("button");
    useBtn.className=p.name===data.activeGlobal?"use":"add";
    useBtn.textContent=p.name===data.activeGlobal?"AKTYWNE":"UŻYJ";
    useBtn.onclick=async()=>{
      await chrome.storage.local.set({activeGlobal:p.name});
      load();
    };

    const delBtn=document.createElement("button");
    delBtn.className="del";
    delBtn.textContent="X";
    delBtn.onclick=async()=>{
      const updated=data.globalProfiles.filter(x=>x.name!==p.name);
      let newActive=data.activeGlobal===p.name?null:data.activeGlobal;
      await chrome.storage.local.set({
        globalProfiles:updated,
        activeGlobal:newActive
      });
      load();
    };

    li.textContent=`${p.name} (${p.type} ${p.host}:${p.port}) `;
    li.appendChild(useBtn);
    li.appendChild(delBtn);
    glist.appendChild(li);
  });

  list.innerHTML="";
  data.rules.forEach(r=>{
    const li=document.createElement("li");
    const del=document.createElement("button");
    del.className="del";
    del.textContent="X";
    del.onclick=async()=>{
      await chrome.storage.local.set({
        rules:data.rules.filter(x=>x.pattern!==r.pattern)
      });
      load();
    };
    li.textContent=`${r.pattern} (${r.type}) `;
    li.appendChild(del);
    list.appendChild(li);
  });
}

document.getElementById("gadd").onclick=async()=>{
  const name=document.getElementById("gname").value.trim();
  const type=document.getElementById("gtype").value;
  const host=document.getElementById("ghost").value.trim()||"127.0.0.1";
  const port=parseInt(document.getElementById("gport").value,10);
  if(!name||!port)return;

  const {globalProfiles=[]}=await chrome.storage.local.get("globalProfiles");
  globalProfiles.push({name,type,host,port});
  await chrome.storage.local.set({globalProfiles,activeGlobal:name});
  load();
};

document.getElementById("add").onclick=async()=>{
  const pattern=patternInput.value.trim();
  const type=wtypeInput.value;
  if(!pattern)return;

  const host=type==="DIRECT"?"":(whostInput.value.trim()||"127.0.0.1");
  const port=type==="DIRECT"?0:parseInt(wportInput.value,10);

  const {rules=[]}=await chrome.storage.local.get("rules");
  rules.push({pattern,type,host,port});
  await chrome.storage.local.set({rules});
  load();
};

load();
