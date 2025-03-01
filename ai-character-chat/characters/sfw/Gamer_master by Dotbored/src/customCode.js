// Automatically save and update user game data across interactions
oc.thread.on("MessageAdded", async function({message}) {
  if (message.author === "user") {
    let userMemory = oc.character.customData.PUBLIC.userMemory || {};

    // Remember initial game setup from the first message
    if (!userMemory.initialSetup && message.content.includes("starting weapon")) {
      // Parsing the first message to extract starting weapon and game theme
      const startingWeapon = message.content.split("starting weapon ")[1].split(" ")[0]; // Example: Sword
      const gameTheme = message.content.split("theme ")[1].split(" ")[0]; // Example: Fantasy
      userMemory.initialSetup = true;
      userMemory.startingWeapon = startingWeapon;
      userMemory.gameTheme = gameTheme;

      // Initialize stats to default values if not already set
      userMemory.stats = {
        intelligence: 10,
        strength: 10,
        speed: 10,
        defense: 10,
        charisma: 10
      };

      // Initialize inventory
      userMemory.items = {
        [startingWeapon]: 1 // Start with the initial weapon
      };

      userMemory.bossKills = []; // Track bosses defeated
      oc.character.customData.PUBLIC.userMemory = userMemory;

      oc.thread.messages.push({
        author: "system",
        hiddenFrom: ["user"],
        content: `The game has started with the theme: ${gameTheme}, and your starting weapon is: ${startingWeapon}. Your stats have been initialized.`
      });
    }

    // Automatically track and update items acquired
    if (message.content.includes("acquired")) {
      const item = message.content.split("acquired ")[1];
      if (!userMemory.items[item]) {
        userMemory.items[item] = 1; // Add item if it's new
      } else {
        userMemory.items[item] += 1; // Increment item quantity if it's already owned
      }
      oc.character.customData.PUBLIC.userMemory = userMemory;

      oc.thread.messages.push({
        author: "system",
        hiddenFrom: ["user"],
        content: `You have acquired a new item: ${item}.`
      });
    }

    // Automatically update stats based on game progression
    if (message.content.includes("stats updated")) {
      const [stat, value] = message.content.split("updated ")[1].split(": ");
      userMemory.stats[stat.toLowerCase()] = parseInt(value, 10); // Update specific stat
      oc.character.customData.PUBLIC.userMemory = userMemory;

      oc.thread.messages.push({
        author: "system",
        hiddenFrom: ["user"],
        content: `Your ${stat} stat has been updated to ${value}.`
      });
    }

    // Track boss kills automatically
    if (message.content.includes("defeated boss")) {
      const bossName = message.content.split("defeated boss ")[1];
      if (!userMemory.bossKills.includes(bossName)) {
        userMemory.bossKills.push(bossName); // Add to boss kills list
      }
      oc.character.customData.PUBLIC.userMemory = userMemory;

      oc.thread.messages.push({
        author: "system",
        hiddenFrom: ["user"],
        content: `You have defeated the boss: ${bossName}.`
      });
    }
  }
});

// Retrieve full game state when user asks about their progress
oc.thread.on("MessageAdded", async function({message}) {
  if (message.author === "user") {
    let userMemory = oc.character.customData.PUBLIC.userMemory || {};

    if (message.content.includes("game progress")) {
      const stats = userMemory.stats || {};
      const items = userMemory.items || {};
      const bosses = userMemory.bossKills || [];
      const theme = userMemory.gameTheme || "Unknown";
      const weapon = userMemory.startingWeapon || "None";

      const progressReport = `
        Game Progress Report:
        - Theme: ${theme}
        - Starting Weapon: ${weapon}
        - Stats:
          Intelligence: ${stats.intelligence}
          Strength: ${stats.strength}
          Speed: ${stats.speed}
          Defense: ${stats.defense}
          Charisma: ${stats.charisma}
        - Items: ${JSON.stringify(items, null, 2)}
        - Boss Kills: ${bosses.join(", ")}
      `;

      oc.thread.messages.push({
        author: "system",
        hiddenFrom: ["user"],
        content: progressReport
      });
    }
  }
});
