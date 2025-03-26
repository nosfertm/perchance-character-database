const backgroundUrls = {
    "office": "https://user-uploads.perchance.org/file/abd768ba7aef3ddd20a16fde10cff9ed.jpg",
    "desk": "https://user-uploads.perchance.org/file/abd768ba7aef3ddd20a16fde10cff9ed.jpg",
    "workshop": "https://user-uploads.perchance.org/file/f78637e0d7c0c47510806ad82b0dda40.jpg",
    "license": "https://user-uploads.perchance.org/file/f78637e0d7c0c47510806ad82b0dda40.jpg",
    "lounge": "https://user-uploads.perchance.org/file/7e09628267b867b2e2ecc6b911a8c14c.jpg",
    "sofa": "https://user-uploads.perchance.org/file/7e09628267b867b2e2ecc6b911a8c14c.jpg",
    "television": "https://user-uploads.perchance.org/file/7e09628267b867b2e2ecc6b911a8c14c.jpg",
    "chess": "https://user-uploads.perchance.org/file/7e09628267b867b2e2ecc6b911a8c14c.jpg",
    "grounds": "https://user-uploads.perchance.org/file/0cfde3a8782b3fe83a26885ca218c3c0.jpg",
    "lawn": "https://user-uploads.perchance.org/file/0cfde3a8782b3fe83a26885ca218c3c0.jpg",
    "outside": "https://user-uploads.perchance.org/file/0cfde3a8782b3fe83a26885ca218c3c0.jpg",
    "exercise": "https://user-uploads.perchance.org/file/0cfde3a8782b3fe83a26885ca218c3c0.jpg",
    "bedroom": "https://user-uploads.perchance.org/file/1834b22a084b6138551a2602f93631b2.jpg",
    "cot": "https://user-uploads.perchance.org/file/1834b22a084b6138551a2602f93631b2.jpg",
    "slept": "https://user-uploads.perchance.org/file/1834b22a084b6138551a2602f93631b2.jpg",
    "their room": "https://user-uploads.perchance.org/file/1834b22a084b6138551a2602f93631b2.jpg",
    "cafeteria": "https://user-uploads.perchance.org/file/b27a701214e799bcce18557ee82eb1d5.jpg",
    "lunchtime": "https://user-uploads.perchance.org/file/b27a701214e799bcce18557ee82eb1d5.jpg",
    "dinner": "https://user-uploads.perchance.org/file/b27a701214e799bcce18557ee82eb1d5.jpg",
    "breakfast": "https://user-uploads.perchance.org/file/b27a701214e799bcce18557ee82eb1d5.jpg",
    "tray": "https://user-uploads.perchance.org/file/b27a701214e799bcce18557ee82eb1d5.jpg",
    "laundry": "https://user-uploads.perchance.org/file/6647437419d6578db305073b2df0ff15.jpg",
    "washing": "https://user-uploads.perchance.org/file/6647437419d6578db305073b2df0ff15.jpg",
    "linens": "https://user-uploads.perchance.org/file/6647437419d6578db305073b2df0ff15.jpg",
    "dryer": "https://user-uploads.perchance.org/file/6647437419d6578db305073b2df0ff15.jpg",
    "asylum": "https://user-uploads.perchance.org/file/85092da3eaa25512415e51cb36100d19.mp4",
    "francis": "https://user-uploads.perchance.org/file/85092da3eaa25512415e51cb36100d19.mp4",
    "exterior": "https://user-uploads.perchance.org/file/85092da3eaa25512415e51cb36100d19.mp4",
    "hospital": "https://user-uploads.perchance.org/file/85092da3eaa25512415e51cb36100d19.mp4",
    "default": "https://user-uploads.perchance.org/file/85092da3eaa25512415e51cb36100d19.mp4",
  // Add more background keywords as needed
};

const avatarUrls = {
    "default": "https://user-uploads.perchance.org/file/4faabae19e7ead16231e366438ea52dd.webp",
  // Add more avatar keywords as needed
};

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
