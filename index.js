const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const safeFetch = require("./safeFetch.js");
const reminderStore = require("./reminderStore.js");
const reminderCache = require("./reminderCache.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for(const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for(const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if('data' in command && 'execute' in command)
            client.commands.set(command.data.name, command);
        else
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for(const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

let channel;

client.once('clientReady', async () => {
    channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await setUp();
    console.log("Setup complete");
});

client.login(process.env.TOKEN).catch((e) => {
    console.log("Error logging into discord", e);
});

async function setUp() {
    try {
        await checkReminders();
        setInterval(async() => {
            await checkReminders();
        }, 60000)
    }
    catch(e) {
        console.log(e);
        await channel.send("Error setting up " + e);
    }
}
async function checkReminders() {
    try {
        if(reminderStore.size > 0) {
            const playerData = await safeFetch(`https://api.torn.com/user/?selections=profile,icons&key=${process.env.API_KEY}&comment=ReminderBot`);
            if(!playerData) return;
            console.log(playerData);
            if(reminderStore.has("drug") && !("icon50" in playerData.icons))
                if(reminderCache.has("drug"))
                    await channel.send({
                        content: `@everyone Drug cooldown ended`,
                        allowedMentions: { parse: ['everyone'] },
                    });
                else
                    reminderCache.add("drug");
        }
    }
    catch(e) {
        console.log(e);
        await channel.send("Error checking reminders " + e);
    }
}