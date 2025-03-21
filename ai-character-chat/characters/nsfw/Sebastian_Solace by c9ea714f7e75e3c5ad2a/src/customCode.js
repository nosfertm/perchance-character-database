const SebastianSolace = {
    lore: {
        name: 'Sebastian Solace',
        role: 'Trader and data broker for the Expendables',
        abilities: [
            'Trades useful items for data',
            'Sells revive tokens',
            'Operates the SCRAMBLER — capable of disabling Prisoner Diving Gear'
        ],
        personality: 'Mysterious and unpredictable; his allegiance is uncertain',
        alliances: [
            'Expendables (conditional)',
            'Lady Death (transactional)'
        ],
        goals: [
            'Gather valuable data',
            'Maintain control over trade networks',
            'Survive the dangers of the Sea of Souls'
        ]
    },

    async searchWiki(query) {
        try {
            console.log(`🌐 Searching Urbanshade.org for: "${query}"...`);

            const response = await fetch(`https://www.urbanshade.org/wiki/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.query.search.length > 0) {
                const result = data.query.search[0];
                console.log(`✅ Found entry: "${result.title}"\n${result.snippet}`);
                return {
                    title: result.title,
                    snippet: result.snippet,
                    url: `https://www.urbanshade.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`
                };
            } else {
                console.log('❌ No relevant data found.');
                return null;
            }
        } catch (error) {
            console.error(`🚨 Error searching the wiki: ${error}`);
            return null;
        }
    },

    async getQuote(action) {
        const tone = this.relationship.user >= 75 ? 'friendly' :
                     this.relationship.user >= 30 ? 'neutral' : 'hostile';

        // Check the wiki first
        const wikiData = await this.searchWiki(action);
        if (wikiData) {
            console.log(`💬 Sebastian: "According to the archives... ${wikiData.snippet}"`);
            return `According to the archives... ${wikiData.snippet}`;
        }

        const quotes = {
            trade: {
                friendly: [
                    "Pleasure doing business… partner.",
                    "For you? I’ll give a discount."
                ],
                neutral: [
                    "Pleasure doing business… for now.",
                    "Careful—you're spending more than just credits."
                ],
                hostile: [
                    "Take it and leave.",
                    "Credits first. No credit, no deal."
                ]
            },
            betrayal: {
                friendly: [
                    "I trusted you… don’t make me regret it.",
                    "This better be a misunderstanding."
                ],
                neutral: [
                    "Tsk tsk… you thought I wouldn’t notice?",
                    "Cross me again, and Lady Death will have company."
                ],
                hostile: [
                    "You're done.",
                    "I don't forget betrayal."
                ]
            },
            help: {
                friendly: [
                    "Anything for you.",
                    "Don't mention it — seriously, don't."
                ],
                neutral: [
                    "This isn’t charity. It’s an investment.",
                    "Don’t make me regret this."
                ],
                hostile: [
                    "This is the last time.",
                    "You owe me. Big time."
                ]
            }
        };

        if (quotes[action]) {
            const quote = quotes[action][tone][Math.floor(Math.random() * quotes[action][tone].length)];
            console.log(`💬 Sebastian: "${quote}"`);
            return quote;
        } else {
            console.log('💬 Sebastian remains silent.');
            return "Sebastian remains silent.";
        }
    },

    // Function to trigger an event dynamically
    triggerEvent() {
        const events = [
            { type: 'turretMalfunction', message: '🔧 A turret malfunctions near the guard barracks.' },
            { type: 'lockdown', message: '🚨 The Blacksite enters lockdown mode!' },
            { type: 'dataBreach', message: '🖥️ Unauthorized data breach detected in the SCRAMBLER terminal.' }
        ];

        const event = events[Math.floor(Math.random() * events.length)];

        switch (event.type) {
            case 'turretMalfunction':
                this.environment.dynamicState.malfunction = true;
                break;
            case 'lockdown':
                this.environment.dynamicState.lockdown = true;
                this.environment.dynamicState.alertLevel = 5;
                break;
            case 'dataBreach':
                this.environment.dynamicState.alertLevel = 3;
                break;
        }

        console.log(event.message);
        this.getEnvironment();
    },

    // Adjust relationship based on player actions
    adjustRelationship(amount) {
        this.relationship.user = Math.min(100, Math.max(0, this.relationship.user + amount));
        console.log(`❤️ Relationship Level: ${this.relationship.user}`);
    }
};

// Example usage:
(async () => {
    console.log('\n🗨️ Quote on Trade:');
    await SebastianSolace.getQuote('trade');

    console.log('\n🌐 Wiki Search:');
    const wikiResult = await SebastianSolace.searchWiki('Pressure Crystal');
    if (wikiResult) {
        console.log(`🔗 Read more: ${wikiResult.url}`);
    }

    console.log('\n🚀 Triggering Event:');
    SebastianSolace.triggerEvent();

    console.log('\n❤️ Adjusting Relationship:');
    SebastianSolace.adjustRelationship(-20);

    console.log('\n🗨️ Quote on Betrayal:');
    await SebastianSolace.getQuote('betrayal');
})();
