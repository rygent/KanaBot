import { APIMessageComponentInteraction, ComponentType } from 'discord-api-types/v10';
import { animeComponents } from '../commands/anime.js';
import { mangaComponents } from '../commands/manga.js';

export async function handleMessageComponents(interaction: APIMessageComponentInteraction) {
	const { data } = interaction;

	switch (data.component_type) {
		case ComponentType.StringSelect:
			if (data.custom_id.startsWith('anime-select-')) {
				return await animeComponents(interaction, data.values[0]);
			}

			if (data.custom_id.startsWith('manga-select-')) {
				return await mangaComponents(interaction, data.values[0]);
			}
		case ComponentType.Button:
		case ComponentType.UserSelect:
		case ComponentType.RoleSelect:
		case ComponentType.MentionableSelect:
		case ComponentType.ChannelSelect:
	}
}
