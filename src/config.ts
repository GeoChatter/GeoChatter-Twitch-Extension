import "twitch-ext"

const twitch = window.Twitch.ext;
const CFG_BOTNAME = "gc_botname";

twitch.onAuthorized(() => {
  if (!twitch.configuration.broadcaster) return
  
  var cfg = JSON.parse(twitch.configuration.broadcaster.content);
  if (typeof cfg === 'object' && CFG_BOTNAME in cfg)
  {
    let b = document.getElementById("currBotName");
    if(b) b.textContent = cfg.gc_botname;
  }
});

document.getElementById("botname_submit")?.addEventListener("click",() => {
  let currbotname = (document.getElementById("botname") as HTMLInputElement).value

  twitch.configuration.set("broadcaster", "1", "{\"" + CFG_BOTNAME + "\": \""+currbotname+"\"}")

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
})