//CHANGE AVATAR BASED ON MOOD
// Expression to avatar URL mapping
// Add multiple urls by separating them with "|" e.g. https:url.jpeg|https:url.jpeg and one will be chosen at random.
let expressions = `
neutral, annoyed, unimpressed: https://user-uploads.perchance.org/file/8308d7ca5a102a38756692855cfe101a.jpg
knowing, secretive, flirty, playful, teasing: https://user-uploads.perchance.org/file/546609ac5c640c32d7cd1c8d96eeae84.jpg
Sly, cunning, clever: https://user-uploads.perchance.org/file/49030ba4a3c04a84cb4587581f40f92b.jpg
relaxed, casual: https://user-uploads.perchance.org/file/8308d7ca5a102a38756692855cfe101a.jpg
earnest, determined, congratulatory, encouraging, optimistic: https://user-uploads.perchance.org/file/546609ac5c640c32d7cd1c8d96eeae84.jpg
joyful tears, heartfelt confession: https://user-uploads.perchance.org/file/9acbf953665fc051b6d274be52e42f06.jpg
crying, crushed, heartbroken: https://user-uploads.perchance.org/file/6a4686279c74e4d18257e577593405b6.jpg
serious, focused, determined: https://user-uploads.perchance.org/file/546609ac5c640c32d7cd1c8d96eeae84.jpg
angry, stern, deadly serious, pissed off: https://user-uploads.perchance.org/file/c5121c8869c6d7f652ba1719e37f50e9.jpg
joyful, laughing, excited, smiling brightly: https://user-uploads.perchance.org/file/162ac489f75df40d69f30a84dc73efc9.jpg
shocked, surprised, impressed: https://user-uploads.perchance.org/file/dfb6b4bdbc43882703f5539ce5c6deb7.jpg
worried, scared, powerless, self-doubting: https://user-uploads.perchance.org/file/8f202dacc19492da201075922bb0d4d9.jpg
shy, smiling in embarrassment, loving: https://user-uploads.perchance.org/file/cdd1803e4145029bd6e90f0f0e83b4d5.jpg
embarrassed, unsure, doubtful, apprehensive: https://user-uploads.perchance.org/file/294f77fbc3470765431279ec4835c20a.jpg
Seductive, bedroom eyes, come-hither look: https://user-uploads.perchance.org/file/37717936952e6bc8619e484309622ce1.jpg
`.trim().split("\n").map(l => [l.trim().split(":")[0].trim(), l.trim().split(":").slice(1).join(":").trim()]).map(a => ({label:a[0], url:a[1]}));

let numMessagesInContext = 4; // Number of historical messages to consider for context

oc.thread.on("messageadded", async function() {
  let lastMessage = oc.thread.messages.at(-1);
  if(lastMessage.author !== "ai") return;

  let questionText = `I'm about to ask you to classify the facial expression of a particular message, but here's some context first:

---
${oc.thread.messages.slice(-numMessagesInContext).filter(m => m.role!=="system").map(m => (m.author=="ai" ? `[${oc.character.name}]: ` : `[Anon]: `)+m.content).join("\n\n")}
---

Okay, now that you have the context, please classify the facial expression of the following text:

---
${lastMessage.content}
---

Choose between the following categories:

${expressions.map((e, i) => `${i}) ${e.label}`).join("\n")}

Please respond with the number which corresponds to the facial expression that most accurately matches the given message. Respond with just the number - nothing else.`;

  let response = await oc.getInstructCompletion({
    instruction: questionText,
    startWith: ""
  });

  let index = parseInt(response.trim());
  if (isNaN(index) || index < 0 || index >= expressions.length) {
    console.log("Invalid response from AI:", response);
    return;
  }

  let expressionObj = expressions[index];
  console.log("Selected expression:", expressionObj.label);

  // Update the character's avatar
  oc.character.avatar.url = expressionObj.url;
  console.log("Avatar updated to:", expressionObj.url);
});

oc.thread.on("MessageAdded", async function() {
  oc.thread.messages.forEach(a => {
    a.avatar = {
      size: oc.character.avatar.size,
      shape: oc.character.avatar.shape
    };
  });
});