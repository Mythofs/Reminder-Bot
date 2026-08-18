const { Events, MessageFlags } = require('discord.js');
const queryRetry = require("../queryRetry.js");
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
            await interaction.deferReply();
            const options = interaction.fields.getCheckboxGroup("reminderCheckbox");
            await queryRetry("TRUNCATE TABLE reminder_store");
            reminderCache.clear();
            for(const option of options)
                await queryRetry("INSERT INTO reminder_store (reminder) VALUES (?)", [option]);
            return await interaction.editReply("Reminders set: " + options);
        }
    }
}