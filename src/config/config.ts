const twitch = window.Twitch.ext;
const VERSION = "v110";

var AuthData = {} as Twitch.ext.Authorized; 

type BroadcasterConfig = 
{
    GGUserID: string,
    Environment: "production" | "development"
};

const GGUserIDInput = document.getElementById("GGUserID") as HTMLInputElement;
const GCEnvironment = document.getElementById("GCEnvironment") as HTMLSelectElement;
const ConfigSubmit = document.getElementById("ConfigSubmit") as HTMLButtonElement;

function handleConfig() {
    console.log(twitch.configuration);
    
    if (twitch.configuration.broadcaster) {
        try {
            if (twitch.configuration.broadcaster.version != VERSION)
                return;
                
            var config = JSON.parse(twitch.configuration.broadcaster.content) as BroadcasterConfig;
            console.log(config);
            
            if (typeof config === 'object') 
            {
                setConfigView(config);
            } 
            else 
            {
                console.log('Invalid config');
            }
        } catch (e) {
            console.log('Invalid config');
        }
    }
}

function setConfigView(cfg: BroadcasterConfig) 
{
    if (!GGUserIDInput || !GCEnvironment) return;

    GGUserIDInput.value = cfg.GGUserID;
    GCEnvironment.value = cfg.Environment ?? "production";
}

function disableConfigSubmit(msg: string)
{
    ConfigSubmit.textContent = msg
    ConfigSubmit.disabled = true;
}

function enableConfigSubmit()
{
    ConfigSubmit.textContent = "Save Settings"
    ConfigSubmit.disabled = false;
}

function handleConfigSubmit()
{
    if (ConfigSubmit.disabled) return;

    disableConfigSubmit("Saving...")
    setTimeout(enableConfigSubmit, 2000)

    if (!GGUserIDInput || !GCEnvironment) return;

    let newid = GGUserIDInput.value;
    console.log("New ID", newid)

    if (!newid) return

    let newenv = GCEnvironment.value;
    console.log("New env", newenv)

    if (!newenv) return

    twitch.configuration.set("broadcaster", VERSION, JSON.stringify({GGUserID: newid, Environment: newenv} as BroadcasterConfig))
}

function handleAuth(e: Twitch.ext.Authorized)
{
    AuthData = e;
    MainConfig();
}

function MainConfig()
{
    console.log("Main config", new Date());
    enableConfigSubmit();
}

ConfigSubmit.addEventListener("click", handleConfigSubmit)
disableConfigSubmit("Initializing...");

twitch.onAuthorized(handleAuth);
twitch.onError((e) => console.error("error", e));
twitch.configuration.onChanged(handleConfig);