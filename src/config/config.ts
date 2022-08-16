const twitch = window.Twitch.ext;

// TODO: Get Geoguessr id from user
function handleAuthorized(e: Twitch.ext.Authorized) {
  console.debug(e)
}

twitch.onAuthorized(handleAuthorized);