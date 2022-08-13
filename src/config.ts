import "twitch-ext"

const twitch = window.Twitch.ext;
const CFG_BOTNAME = "gc_botname";

function handleAuthorized() {
  if (!twitch.configuration.broadcaster) return
  
  var cfg = JSON.parse(twitch.configuration.broadcaster.content);
  if (typeof cfg === 'object' && CFG_BOTNAME in cfg)
  {
    let b = document.getElementById("currBotName");
    if(b) b.textContent = cfg[CFG_BOTNAME];
  }
}

function handleNewBotname() {
  let currbotname = (document.getElementById("botname") as HTMLInputElement).value

  twitch.configuration.set("broadcaster", "v1_0_0", JSON.stringify({[CFG_BOTNAME]: currbotname}))

  if (!twitch.configuration.broadcaster) 
  {
      let b = document.getElementById("currBotName");
      if(b) b.textContent = currbotname;
  }
  else
  {
    var cfg = JSON.parse(twitch.configuration.broadcaster.content);
    if (typeof cfg === 'object' && CFG_BOTNAME in cfg)
    {
      let b = document.getElementById("currBotName");
      if(b) b.textContent = currbotname;
    }
  }
}

twitch.onAuthorized(handleAuthorized);

document.getElementById("botname_submit")?.addEventListener("click", handleNewBotname)