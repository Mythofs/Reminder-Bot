const { SlashCommandBuilder, ModalBuilder, LabelBuilder, CheckboxGroupBuilder } = require('discord.js');
const reminderStore = require("../../reminderStore.js");

module.exports = { 
    data: new SlashCommandBuilder().setName('setreminders').setDescription('Sends list of reminders'), 
    async execute(interaction) {
        try {
            const reminderModal = new ModalBuilder().setCustomId("reminderModal").setTitle("Set Reminders");
            const reminderCheckbox = new CheckboxGroupBuilder().setCustomId("reminderCheckbox").setRequired(false).addOptions([
                { label: "Drug", value: "drug", description: "Ping whenever drug cooldown ends", default: reminderStore.has("xanax") },
            ]);
            const reminderLabel = new LabelBuilder().setLabel("Select Reminders").setCheckboxGroupComponent(reminderCheckbox);
            reminderModal.addLabelComponents(reminderLabel);
            return await interaction.showModal(reminderModal);
        }
        catch(e) {
            console.log(e);
            return await interaction.reply("Error while setting reminders", e);
        }
    },
};