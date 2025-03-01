oc.thread.on("MessageAdded", async function() {
  oc.thread.messages.forEach(a => {
    a.avatar = {
      size: oc.character.avatar.size,
      shape: oc.character.avatar.shape
    };
  });
});