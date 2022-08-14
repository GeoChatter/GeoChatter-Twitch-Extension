const twitch = window.Twitch.ext;

function handleAuthorized(e: Twitch.ext.Authorized) {
  console.debug(e)
}

twitch.onAuthorized(handleAuthorized);