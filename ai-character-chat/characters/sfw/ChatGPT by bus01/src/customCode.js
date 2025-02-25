async function getPdfText(data) {
  let doc = await window.pdfjsLib.getDocument({data}).promise;
  let pageTexts = Array.from({length: doc.numPages}, async (v,i) => {
    return (await (await doc.getPage(i+1)).getTextContent()).items.map(token => token.str).join('');
  });
  return (await Promise.all(pageTexts)).join(' ');
}

oc.thread.on("MessageAdded", async function ({message}) {
  if(message.author === "user") {
    let urlsInLastMessage = [...message.content.matchAll(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g)].map(m => m[0]);
    if(urlsInLastMessage.length === 0) return;
    if(!window.Readability) window.Readability = await import("https://esm.sh/@mozilla/readability@0.4.4?no-check").then(m => m.Readability);
    let url = urlsInLastMessage.at(-1); // we use the last URL in the message, if there are multiple
    let blob = await fetch(url).then(r => r.blob());
    let output;
    if(blob.type === "application/pdf") {
      if(!window.pdfjsLib) {
        window.pdfjsLib = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.6.172/+esm").then(m => m.default);
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.6.172/build/pdf.worker.min.js";
      }
      let text = await getPdfText(await blob.arrayBuffer());
      output = text.slice(0, 5000); // <-- grab only the first 5000 characters (you can change this)
    } else {
      let html = await blob.text();
      let doc = new DOMParser().parseFromString(html, "text/html");
      let article = new Readability(doc).parse();
      output = `# ${article.title || "(no page title)"}\n\n${article.textContent}`;
      output = output.slice(0, 9000000000); // <-- grab only the first 9000000000 characters (you can change this)
    }
    oc.thread.messages.push({
      author: "system",
      hiddenFrom: ["user"], // hide the message from user so it doesn't get in the way of the conversation
      content: "Here's the content of the webpage that was linked in the previous message: \n\n"+output,
    });
  }
});