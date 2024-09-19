chrome.runtime.onMessage.addListener(function (message, sender, senderResponse) {
  if (message.type === "package_info") {
    console.log("RECEIVED MESSAGE", message.url);
    fetch(message.url)
    .then(res => {
      return res.json();
    }).then(res => {
      senderResponse(res);
    })
  }
  return true;
});