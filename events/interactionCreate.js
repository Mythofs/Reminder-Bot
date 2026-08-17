const { Events, MessageFlags } = require('discord.js');
const reminderStore = require("../reminderStore.js");
const reminderCache = require("../reminderCache.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if(interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if(!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                return await command.execute(interaction);
            }
            catch(error) {
                try {
                    if(interaction.replied || interaction.deferred) {
                        await interaction.followUp({
                            content: 'There was an error while executing this command!',
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                    else {
                        await interaction.reply({
                            content: 'There was an error while executing this command!',
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                }
                catch(error) {
                    console.error('Interaction expired before could be sent:', error.message);
                    const age = Date.now() - interaction.createdTimestamp;
                    console.log(`Interaction age: ${age}ms, command: ${interaction.commandName}`);
                }
            }
        }
        else if(interaction.isModalSubmit()) {
            const options = interaction.fields.getCheckboxGroup("reminderCheckbox");
            reminderStore.clear();
            reminderCache.clear();
            for(const option of options)
                reminderStore.add(option);
            console.log(reminderStore);
            return await interaction.reply("Reminders set: " + options);
        }
    }
}