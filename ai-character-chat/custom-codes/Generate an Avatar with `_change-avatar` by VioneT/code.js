// This is the code to change the Avatar of the Character
// `/change-avatar` and it will prompt the character to describe themselves, then use that as a prompt for the avatar.
// `/roll-avatar` to re-generate the image with the same description.
window.generateImage = async function (mode, description) {
if (mode == 'new') {
let prevDataUrl = oc.character.avatar.url;
let { dataUrl } = await oc.textToImage({
prompt: `${oc.character.imagePromptPrefix == '' ? '' : oc.character.imagePromptPrefix + ', '}${description}${oc.character.imagePromptSuffix == '' ? '' : ', ' + oc.character.imagePromptSuffix}`,
negativePrompt: ``,
});
oc.character.avatar.url = await resizeDataURLWidth(dataUrl, 300);
oc.thread.messages.pop()
oc.thread.messages.pop()
oc.thread.messages.pop()
oc.thread.messages.push({
author: "system",
name: "System",
content: `<p>New Avatar:</p><img src="${dataUrl}" style="max-width: 200px; width: 100%; max-height: 200px; aspect-ratio: 1 / 1; object-fit: contain;">
<p>Old Avatar:</p><img src="${prevDataUrl}" style="max-width: 200px; width: 100%; max-height: 200px; aspect-ratio: 1 / 1; object-fit: contain;">
<p><button onclick="oc.character.avatar.url = '${prevDataUrl}'">Revert to Old Avatar?</button><br><button onclick="oc.character.avatar.url = '${dataUrl}'">Back to Generated Avatar?</button></p>`,
hiddenFrom: ['ai'],
expectsReply: false,
avatar: { size: 0 },
})
} else {
let prevDataUrl = oc.character.avatar.url;
let { dataUrl } = await oc.textToImage({
prompt: `${oc.character.imagePromptPrefix == '' ? '' : oc.character.imagePromptPrefix + ', '}${description}${oc.character.imagePromptSuffix == '' ? '' : ', ' + oc.character.imagePromptSuffix}`,
negativePrompt: ``,
});
oc.character.avatar.url = await resizeDataURLWidth(dataUrl, 300);
oc.thread.messages.pop()
oc.thread.messages.push({
author: "system",
name: "System",
content: `<p>New Avatar:</p><img src="${dataUrl}" style="max-width: 200px; width: 100%; max-height: 200px; aspect-ratio: 1 / 1; object-fit: contain;">
<p>Old Avatar:</p><img src="${prevDataUrl}" style="max-width: 200px; width: 100%; max-height: 200px; aspect-ratio: 1 / 1; object-fit: contain;">
<p><button onclick="oc.character.avatar.url = '${prevDataUrl}'">Revert to Old Avatar?</button><br><button onclick="oc.character.avatar.url = '${dataUrl}'">Back to Generated Avatar?</button></p>`,
hiddenFrom: ['ai'],
expectsReply: false,
avatar: { size: 0 },
})
}
}
window.alreadyGenerating = false;
oc.thread.on("MessageAdded", async function () {
let lastMessage = oc.thread.messages.at(-1);
oc.character.customData.description = oc.character.customData.description
? oc.character.customData.description
: "";
// console.log(lastMessage);
if (lastMessage.author !== "ai") {
if (/^\/change-avatar/.test(lastMessage.content)) {
oc.thread.messages.pop()
oc.thread.messages.push({
author: "user",
content: `${oc.character.name}, describe your appearance and personality in detail. Reply with a comma-separated list of keywords and keyphrases which *visually* capture your apprearance only. Imagine you're giving a list of keywords to an artist who will use them to paint or draw a portrait of you. Describe the your appearance with keywords/keyphrases, including your race, sex/gender, class, age, etc. Respond with only the comma-separated keyphrases - nothing more, nothing less.
Start with "Here is my current appearance:"`,
})
}
if (/^\/roll-avatar/.test(lastMessage.content)) {
oc.thread.messages.pop()
oc.thread.messages.push({
author: "system",
name: "System",
content: `The AI is Changing their Avatar, please wait ... <br><progress style="width:80px"></progress>`,
hiddenFrom: ['ai'],
expectsReply: false,
avatar: { size: 0 },
})
generateImage('reroll', oc.character.customData.description);
}
};
if (alreadyGenerating) return;
alreadyGenerating = true;
if (lastMessage.author === "ai") {
if (/^Here is my current appearance\:/.test(lastMessage.content)) {
let description = lastMessage.content.replace("Here is my current appearance:", '');
console.log("DESCRIPTION: ", description)
oc.character.customData.description = description
oc.thread.messages.push({
author: "system",
name: "System",
content: `The AI is Changing their Avatar, please wait ... <br><progress style="width:80px"></progress>`,
hiddenFrom: ['ai'],
expectsReply: false,
avatar: { size: 0 },
})
console.log("PUSHED MESSAGE");
generateImage('new', description);
}
};
alreadyGenerating = false;
})
async function resizeDataURLWidth(dataURL, newWidth) {
const blob = await fetch(dataURL).then(res => res.blob());
const bitmap = await createImageBitmap(blob);
const canvas = Object.assign(document.createElement('canvas'), { width: newWidth, height: bitmap.height / bitmap.width * newWidth });
const ctx = canvas.getContext('2d');
ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
return canvas.toDataURL('image/jpeg');
}