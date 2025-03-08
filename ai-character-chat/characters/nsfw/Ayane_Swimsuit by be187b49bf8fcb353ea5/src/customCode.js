oc.thread.on("MessageAdded", async function ({message}) {
    if(message.author === "system") {
      let clr = Math.round(Math.random()*150 + 90);
      message.wrapperStyle = `color:rgb(${clr}, ${clr}, ${clr});`;
    }
  });
