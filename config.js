const twitch = window.Twitch.ext;
const CFG_BOTNAME = "gc_botname";

var currbotname = "";

twitch.onAuthorized(() => {
  if (!twitch.configuration.broadcaster) return
  
  var cfg = JSON.parse(twitch.configuration.broadcaster.content);
  if (typeof cfg === 'object' && CFG_BOTNAME in cfg)
    document.getElementById("currBotName").textContent = cfg.gc_botname;
});

document.getElementById("botname_submit").addEventListener("click",() => {
  let currbotname = document.getElementById("botname").value
  twitch.configuration.set("broadcaster", "1", "{\"" + CFG_BOTNAME + "\": \""+currbotname+"\"}")

  if (!twitch.configuration.broadcaster) 
  {
      document.getElementById("currBotName").textContent = currbotname;
  }
  else
  {
    var cfg = JSON.parse(twitch.configuration.broadcaster.content);
    if (typeof cfg === 'object' && CFG_BOTNAME in cfg)
      document.getElementById("currBotName").textContent = currbotname;
  }
})