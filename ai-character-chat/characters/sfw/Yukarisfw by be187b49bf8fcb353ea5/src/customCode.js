oc.thread.on("MessageAdded", async function({message}) {
  if(oc.character.name == "Yukari(SFW)") {
    message.content = message.content.replaceAll("**", "*")
  }
});