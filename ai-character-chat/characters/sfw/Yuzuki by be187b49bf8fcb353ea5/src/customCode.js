oc.thread.on("MessageAdded", async function ({message}) {
    if(message.author === "system") {
      let r = Math.round(Math.random()*170 + 90);
      let g = Math.round(Math.random()*170 + 90);
      let b = Math.round(Math.random()*170 + 90);
      message.wrapperStyle = `color:rgb(${r}, ${g}, ${b});`;
    }
});