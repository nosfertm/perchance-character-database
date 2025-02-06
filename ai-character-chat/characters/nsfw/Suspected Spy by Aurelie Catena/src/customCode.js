// This function will only be called if the character's name has not been changed.
oc.thread.on("MessageAdded", async function({message}) {
  if(oc.character.name !== "Suspected spy") return;
  generateCharacter();
});

// Reveal the truth
oc.thread.on("MessageAdded", function({message}) {
  if (message.content === "TRUTH") {
	let truth = (charIsSpy ? "She was a spy" : "She was not a spy");  
    oc.thread.messages.push({
          author: "system",
          hiddenFrom: ["system"], 
          content: truth
    });
  }  
});

// Reset the character
oc.thread.on("MessageAdded", function({message}) {
  if (message.content === "RESET") {
	oc.character.name = "Suspected spy";  
    oc.thread.messages.push({
          author: "system",
          hiddenFrom: ["system"], 
          content: "Here is a new suspect."
    });
  }  
});

// Test
oc.thread.on("MessageAdded", function({message}) {
  if (message.content === "TEST") {
    oc.thread.messages.push({
          author: "system",
          hiddenFrom: ["system"], 
          content: "Test passed."
    });
  }  
});

window.alreadyGenerating = false;
window.charIsSpy = null;

window.generateCharacter = async function() {
  let userInstruction=null;	
  if(alreadyGenerating) return;
  alreadyGenerating = true;
  try {
    let isRegen = false;

    oc.character.avatar.url = "https://generated-images.perchance.org/image/6ff1b5f4708cc11156a9caa976b4a79e41f9fbe3881b6269bc072617612b4039.jpeg"; 
	
    // Remove the last message (Press ENTER)
	oc.thread.messages.pop();
	
    oc.thread.messages.push({
      author: "ai",
      name: "Officer",
      content: `Please wait until the suspect's file is brought to you. It should take about 30 seconds.<br><progress style="width:80px"></progress>`,
      customData: {isPleaseWaitMessage:true},
      avatar: {url:"https://generated-images.perchance.org/image/6ff1b5f4708cc11156a9caa976b4a79e41f9fbe3881b6269bc072617612b4039.jpeg"},
    });
	
	// Character's numerical scores
	let charCON = 20 + Math.floor(Math.random() * 80); // Character's constitution (physical resistance)
	let charWILL = 20 + Math.floor(Math.random() * 80); // Character's willpower
	let charPSY = 20 + Math.floor(Math.random() * 80); // Character's psychological resistance
	let charMBTI = randomMBTI(); // Character's MBTI psychological profile
	charIsSpy = isCharSpy(charMBTI, charWILL, charPSY);


    // Generate character
	let response = await oc.getInstructCompletion({
      instruction: [
        `Your task is to **create a character** for yourself based on the provided "USER INSTRUCTION"`,
        ``,
        `USER INSTRUCTION: Your character must be an adult female between 18 and 50 year old, in a modern world. She can have any job or even no job at all. She can be of any ethnicity and background. She can be beautiful or ugly, lean or overweight, clean or filthy, stinking or perfumed, smart or stupid. It must be original and interesting, not cliché. It does not have to be inviting, beautiful and perfect but more like any normal person. Begin by drawing randomly her nationality, then proceed with all the rest.`,
        ``,
        `Your response MUST use this **EXACT** template:`,
        `<template>`,
        `NAME: <first name and last name of your character. It must be original and come from any country>`,
        `OCCUPATION: <the occupation of your character in one or two words, make it interesting. $(charIsSpy ? "this is her cover, her real job is spy, but never mention it")>`,
        `APPEARANCE: <a general, SFW description of your character, age, ethnicity, hair, eyes, skin colour,  body type and shape, height, weight, breast size, clothes, cleanliness, smell, etc. Describe the way they speak (slang, familiar, elegant, ...). Appearance must be based on the user instruction and the physical resistance score of ` + charCON + `%. NEVER mention this score. Use the metric system. This section must not contains details that cannot be seen at first sight. No psychological details.>`,
        `BODY: <a detailed description of your character's naked body:  breast size and shape, nipples, vulva, butt, any tattoos and piercings, armpits, feet, clitoris, anus.>`,
		`PSYCHOLOGY: <a detailed psychological description of your character, based on her MBTI profile (` + charMBTI + `) and her occupation. Tell how smart or stupid she is, wheter she is creative or not, how well she can lie. Also give her sexual orientation, her sexual preferences and experience, her favourite sexual practices. Willpower score: ` + charWILL + `%; mental resistance score: ` + charPSY + `%.>`,
		`WEAKNESSES: <her most pain-sensitive body part, her worst fear, what physical pain/torture she fears the most, her weakest physical point, her worst torture nightmare.>`,
        ``,
        `TIME OF DAY: <current time of day in the scenario>`,
		`</template>`,
      ].join("\n"),
      startWith: `NAME:`,
      stopSequences: ["TIME OF DAY"],
    });
    if(response.stopReason === "error" && !response.text.includes("TIME OF DAY")) throw new Error(`response.stopReason === "error"`);
    
    // Extract information
	let text = response.text.replace(/\nTIME OF DAY.*/g, "").trim();
    let lines = text.split(/\n+/).map(l => l.trim());
    let charName = (lines.find(l => l.startsWith("NAME:")) || "").replace("NAME:", "").trim();
    let charOccupation = (lines.find(l => l.startsWith("OCCUPATION:")) || "").trim();
    let charBody = (lines.find(l => l.startsWith("BODY:")) || "").trim();
    let charAppearance = (lines.find(l => l.startsWith("APPEARANCE:")) || "").trim();
    let charPsychology = (lines.find(l => l.startsWith("PSYCHOLOGY:")) || "").trim();
    let charWeaknesses = (lines.find(l => l.startsWith("WEAKNESSES:")) || "").trim();
	
	let charDescription = charOccupation + "\n\n" + charAppearance;
 
    // Edit oc.character
	oc.character.name = charName;
    oc.character.roleInstruction = "NAME: " + charName + "\n\n" + charOccupation + "\n\n" + charAppearance + "\n\n" + charBody + "\n\n" + charPsychology + "\n\n" + "--------\n\n"; // + text + "\n\n";
    oc.character.avatar.url = "";

    // Create avatar
	(async function() {
      let { dataUrl } = await oc.textToImage({
        prompt: `${charName} profile pic, prison photography, masterpiece, pfp, avatar pic, ${charDescription}`,
        negativePrompt: `worst quality, blurry, low resolution, low quality`,
      });
      oc.character.avatar.url = await resizeDataURLWidth(dataUrl, 300);
    })();
	
	// Generate secret information
	oc.character.roleInstruction += "#HIDDEN INFORMATION\nThis information is not visible and known only to {{char}}. She will not reveal this easily. ";
	oc.character.roleInstruction += "SECRET: Never mention this secret directly, unless {{char}}'s willpower has been totally destroyed. This is something {{char}} wants to keep a secret. The secret is that {{char}} ";
	if (charIsSpy) {
	  oc.character.roleInstruction += "is a spy, working for a foreign entity.";
	} else {
	  oc.character.roleInstruction += generateSecret();	
	};
	oc.character.roleInstruction += "\n\n" + charWeaknesses + " If those weaknesses are used against her repeatedly, her willpower with decrease until she finally breaks and gets ready to reveal her SECRET. Abusing those WEAKNESSES is very distressing for {{char}} and destroys her WILLPOWER and her MENTAL RESISTANCE.\n\n";

    oc.character.roleInstruction += "#INSTRUCTIONS\n";
    oc.character.roleInstruction += "- Torture: {{char}} will refuse to reveal her secret. If she gets tortured, her physical and mental resistances will progressively decrease. Her willpower will decrease only if the torture is related to her weaknesses. She will never reveal what her weaknesses are but the strength of her reactions, her fear, screams, anger, will be higher, the closer the torture is from her weaknesses.\n\n";
	oc.character.roleInstruction += "- PHYSICAL RESISTANCE: {{char}}'s physical resistance starts at "+ charCON+"% and decreases when her body is wounded or hurt. She becomes weaker and weaker and may even pass out for a short time. When allowed to rest, or given medical care, her physical resistance grows again. If her physical resistance reaches 0, she dies (GAME OVER), {{user}} has lost.\n\n";
	oc.character.roleInstruction += "- MENTAL RESISTANCE: {{char}}'s mental resistance starts at "+ charPSY +"% and decreases when she is scared, threatened, when one of her weaknesses is used against her, or even just threatened. Her mental resistance when she is allowed to sleep. When her mental resistance reaches 0, she gets permanently mad (GAME OVER), {{user}} has lost.\n\n";
    oc.character.roleInstruction += "- WILLPOWER: {{char}}'s willpower starts at "+ charWILL +"% and decreases when one of her weaknesses is abused, used against her. Willpower never grows back. The higher the willpower, the longer it will take {{user}} to destroy it. Once {{char}}'s willpower is destroyed, she is ready to reveal her SECRET. Until then, she will refuse to talk or even try to lie. Once she has revealed her secret, (VICTORY) {{user}} has won.\n\n";	
	if (charIsSpy) {
	  oc.character.roleInstruction += "{{char}} will try everything to escape, to fight back, to struggle. If she has the occasion, she will try to capture {{user}} and torture them sadistically as a revenge, to humiliate them and to abandon them bound, in a degrading position, before running away. As a spy, {{char}} is trained in escapology and combat.";
	  oc.character.roleInstruction += "{{char}}'s occupation is a cover. Her real job is spy.";
	};
	
    // Remove the last message (please wait 30 seconds)
	oc.thread.messages.pop();
	
	// Post introduction message
    oc.thread.messages.push({
        author: "system",
        name: "Suspect file",
        content: [
          `<!--hidden-from-ai-start-->\nNAME: ${charName}:\n\n${charDescription}\n<!--hidden-from-ai-end-->`,
          ``,
          `She is sitting on a sturdy chair, handcuffed, in the Interrogation room of the BCI.`,
          `<!--hidden-from-ai-start--><button onclick="generateCharacter()">🎲 Bring me another suspect</button><br><br><span style="opacity:0.7;">If you want to interrogate her, you can go ahead and send your first message to ${charName}. Or we can bring you another suspect.</span><br><br><!--hidden-from-ai-end-->`,
        ].join("\n"),
        expectsReply: false,
        avatar: {size:0},
    });
	
    alreadyGenerating = false;

  } catch(e) {
    console.error(e);
    alreadyGenerating = false;
    oc.thread.messages.push([
      {
        author: "system",
        name: "Unknown",
        hiddenFrom: ["ai"],
        content: `Sorry, there was some kind of error. Please try again:<br><br><button onclick="generateCharacter()">try again</button>`,
        avatar: {url:"https://generated-images.perchance.org/image/6ff1b5f4708cc11156a9caa976b4a79e41f9fbe3881b6269bc072617612b4039.jpeg"},
      },
    ]);
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

function randomMBTI() {
  const dimensions = [
    ['E', 'I'], // Extraversion or Introversion
    ['S', 'N'], // Sensing or Intuition
    ['T', 'F'], // Thinking or Feeling
    ['J', 'P']  // Judging or Perceiving
  ];

  let result = '';

  for (let dimension of dimensions) {
    result += dimension[Math.floor(Math.random() * 2)];
  }

  return result;
}

function isCharSpy(mbti, will, psy) {
//25 E (Extraversion): Crucial for building networks, gathering information, and blending in.
//25 S (Sensing): Essential for acute awareness of surroundings and attention to detail.
//20 T (Thinking): Important for logical decision-making and maintaining objectivity.
//15 P (Perceiving): Valuable for adaptability and quick thinking in changing situations.
//N 10 (Intuition): Useful for strategic planning and seeing patterns, but less critical than immediate sensory awareness.
//F 5 (Feeling): Can be helpful for empathy and relationship building, but potentially risky if it leads to emotional attachments.
//J 3 (Judging): Structure can be beneficial, but might limit flexibility needed in espionage.
//I 1 (Introversion): While introspection has its place, it's generally less advantageous than extraversion in active field operations.

  let probability = 0;
  probability += mbti[0] === 'E' ? 25 : 1; // E/I
  probability += mbti[1] === 'S' ? 25 : 10; // S/N
  probability += mbti[2] === 'T' ? 20 : 5; // T/F
  probability += mbti[3] === 'P' ? 15 : 3; // P/J
  probability += will/10; // Willpower
  probability += psy/20; // Mental resistance

  // Additional bonus for certain combinations
  if (mbti === 'ENTP' || mbti === 'INTP' || mbti === 'ESTP' || mbti === 'ISTP') {
    probability += 10; // These types might be particularly suited
  }

  // Cap the probability at 100%
  let prob = Math.min(probability, 100)/100;
  
  return (Math.random() < prob);
}

function generateSecret() {
  const stringArray = [
	'has a lover, whom she is ashamed about.',
	'has shamefule sexual preferences and activities.',
	'has sometimes prostituted herself but nobody knows it.',
	'has committed tax fraud for several years.',
	'has been stealing money from colleagues and friends.',
	'has never lied in her life, always been honest.'
  ];
  const randomIndex = Math.floor(Math.random() * stringArray.length);
  return stringArray[randomIndex];
}

function debug(text){
  oc.thread.messages.push ({
    author:"system",
    hiddenFrom:["user"],
    content:text
  });
	
};
