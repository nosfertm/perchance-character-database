const backgroundUrls = {
  "Your bg keyword": "image-url.jpeg",
  "Your bg keyword2": "image-url2.jpeg",
  // Add more background keywords as needed
};

const avatarUrls = {
  "Your avvy keyword": "image-url.jpeg",
  "Your avvy keyword 2": "image-url.jpeg",
  // Add more avatar keywords as needed
};

oc.thread.on("MessageAdded", async function() {
  oc.thread.messages.forEach(a => {
    a.avatar = {
      size: oc.character.avatar.size,
      shape: oc.character.avatar.shape
    };
  });
});


function normalizeString(str) {
  return str.toLowerCase().replace(/[\s'"]/g, ''); // Convert to lower case and remove spaces and single quotes
}

oc.thread.on("MessageAdded", function({message}) {
  let normalizedMessage = normalizeString(message.content); // Normalize message content

  let foundBG = Object.keys(backgroundUrls).find(key => normalizedMessage.includes(normalizeString(key))); 
  let foundAVATAR = Object.keys(avatarUrls).find(key => normalizedMessage.includes(normalizeString(key)));
  
  if (foundBG) {
    oc.thread.messages.at(-1).scene = { 'background': { 'url': backgroundUrls[foundBG] } }; // Properly updating scene background
  }
  
  if (foundAVATAR) {
    oc.character.avatar.url = avatarUrls[foundAVATAR]; // Properly updating avatar URL
  }
});
