import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types/v10';

export default {
	name: 'manga',
	description: 'Search for a Manga.',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'search',
			description: 'Your search.',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],
	dm_permission: true
} as const;
