// this is the code that allows this 'Unknown' character to transform

oc.thread.on("MessageAdded", async function({message}) {
  if(oc.character.name !== "Unknown") return; // this code is only enabled while the character has not yet been created
  generateCharactersAndScenario(message.content);
});

window.alreadyGenerating = false;
window.generateCharactersAndScenario = async function(userInstruction=null) {
  if(alreadyGenerating) return;
  alreadyGenerating = true;
  try {
    let isRegen = false;
    if(userInstruction === null) {
      userInstruction = oc.character.customData.userInstruction;
      isRegen = true;
    } else {
      oc.character.customData.userInstruction = userInstruction;
    }

    if(isRegen) {
      oc.thread.messages = [];
    } else {
      oc.thread.messages.shift();
    }

    oc.thread.messages.push({
      author: "ai",
      name: "Unknown",
      content: `Okay, I'm on it${isRegen ? " - let me try again." : `. It'll take me about 30 seconds to finish creating the character.`}<br><progress style="width:80px"></progress>`,
      customData: {isPleaseWaitMessage:true},
      avatar: {url:"https://user-uploads.perchance.org/file/f20fb9e8395310806956dca52510b16b.webp"},
    });

    let response = await oc.getInstructCompletion({
      instruction: [
        `The user wants to to engage in a fun, creative roleplay with you. They want you to take the role of a character for the roleplay/chat. Your task is to **create a character** for yourself based on the provided "USER INSTRUCTION", and also write a roleplay starter/scenario that involves the user's character. If the user's instructions don't specify a character for themselves, then you must make one up for them.`,
        ``,
        `USER INSTRUCTION: ${userInstruction}`,
        ``,
        `Your response should use this **exact** template:`,
        ``,
        `NAME: <the name of your character>`,
        `DESCRIPTION: <a detailed, creative, one-paragraph description of the character, based on the user instruction>`,
        ``,
        `USER NAME: <the name of the user's character>`,
        `USER DESCRIPTION: <a one-paragraph description of the user's character>`,
        ``,
        `ROLEPLAY STARTER: <a one-paragraph, interesting, creative, authentic, engaging roleplay starter/scenario that also involves both characters>`,
        ``,
        `TIME OF DAY: <current time of day in the scenario>`,
      ].join("\n"),
      startWith: `NAME:`,
      stopSequences: ["TIME OF DAY"],
    });
    if(response.stopReason === "error" && !response.text.includes("TIME OF DAY")) throw new Error(`response.stopReason === "error"`);
    
    let text = response.text.replace(/\nTIME OF DAY.*/g, "").trim();
    let lines = text.split(/\n+/).map(l => l.trim());
    let charName = (lines.find(l => l.startsWith("NAME:")) || "").replace("NAME:", "").trim();
    let charDescription = (lines.find(l => l.startsWith("DESCRIPTION:")) || "").replace("DESCRIPTION:", "").trim();
    let userName = (lines.find(l => l.startsWith("USER NAME:")) || "").replace("USER NAME:", "").trim();
    let userDescription = (lines.find(l => l.startsWith("USER DESCRIPTION:")) || "").replace("USER DESCRIPTION:", "").trim();
    let starter = (lines.find(l => l.startsWith("ROLEPLAY STARTER:")) || "").replace("ROLEPLAY STARTER:", "").trim();

    if(userDescription === "") {
      let descriptions = lines.filter(l => l.startsWith("DESCRIPTION:"));
      if(descriptions[1]) {
        userDescription = descriptions[1].replace("DESCRIPTION:", "").trim(); // ai sometimes doesn't add "DESCRIPTION" before the user's description
      }
    }
  
    oc.character.name = charName;
    oc.character.roleInstruction = charDescription;
    oc.character.initialMessages = [];
    oc.character.avatar.url = "";
    
    oc.character.userCharacter.name = userName;

    (async function() {
      let { dataUrl } = await oc.textToImage({
        prompt: `${charName} profile pic, digital art, masterpiece, pfp, avatar pic, ${charDescription}`,
        negativePrompt: `worst quality, blurry, low resolution, low quality`,
      });
      oc.character.avatar.url = await resizeDataURLWidth(dataUrl, 300);
    })();
    (async function() {
      let { dataUrl } = await oc.textToImage({
        prompt: `${userName} profile pic, digital art, masterpiece, pfp, avatar pic, ${userDescription}`,
        negativePrompt: `worst quality, blurry, low resolution, low quality`,
      });
      oc.character.userCharacter.avatar.url = await resizeDataURLWidth(dataUrl, 300);
    })();

    oc.thread.messages = [
      {
        author: "system",
        name: "Unknown",
        hiddenFrom: ["ai"],
        content: `<span style="opacity:0.7;">Okay, here's what I've generated:</span>`,
        avatar: {url:"https://user-uploads.perchance.org/file/f20fb9e8395310806956dca52510b16b.webp"},
      },
      {
        author: "system",
        name: "Introduction",
        content: [
          `<!--hidden-from-ai-start-->\n**${charName}**: ${charDescription}\n<!--hidden-from-ai-end-->`,
          ``,
          ``,
          `**${userName}**: ${userDescription}`,
          ``,
          starter ? `**Starter**: ${starter}` : "",
          ``,
          `<!--hidden-from-ai-start--><button onclick="generateCharactersAndScenario()">🎲 regenerate</button><br><br><span style="opacity:0.7;">If you're happy with what was generated, you can go ahead and send your first message to ${charName}. Note that you can change your name and edit the character with the ⚒️ options button. Feel free to delete (🗑️) the above introduction message if you'd prefer start with a different role/scenario.</span><br><br><!--hidden-from-ai-end-->`,
        ].join("\n"),
        expectsReply: false,
        avatar: {size:0},
      },
    ];
    alreadyGenerating = false;
  } catch(e) {
    console.error(e);
    alreadyGenerating = false;
    oc.thread.messages = [
      {
        author: "system",
        name: "Unknown",
        hiddenFrom: ["ai"],
        content: `Sorry, there was some kind of error. Please try again:<br><br><button onclick="generateCharactersAndScenario()">try again</button>`,
        avatar: {url:"https://user-uploads.perchance.org/file/f20fb9e8395310806956dca52510b16b.webp"},
      },
    ];
  }
}

async function resizeDataURLWidth(dataURL, newWidth) {
  const blob = await fetch(dataURL).then(res => res.blob());
  const bitmap = await createImageBitmap(blob);
  const canvas = Object.assign(document.createElement('canvas'), { width: newWidth, height: bitmap.height / bitmap.width * newWidth });
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg');
}
