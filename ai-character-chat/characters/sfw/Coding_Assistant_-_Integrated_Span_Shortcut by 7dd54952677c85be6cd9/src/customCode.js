function parseColors(input) {
    input = input.replace(/<c\.(\w+)>(.*?)<\/c>/g, (match, color, content) => {
        return `<span style="color: ${color};">${content}</span>`;
    });

    input = input.replace(/<c\.#([a-fA-F0-9]{6})>(.*?)<\/c>/g, (match, hex, content) => {
        return `<span style="color: #${hex};">${content}</span>`;
    });

    return input;
}

oc.thread.on("MessageAdded", function({message}) {
    if (message.author === "user") {
        message.content = parseColors(message.content);
    }
});

// This script parses user messages to replace <c.COLOR> and <c.#HEX> tags with styled <span> tags for proper rendering of colors.