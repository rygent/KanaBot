import { type APIApplicationCommandAutocompleteInteraction } from 'discord-api-types/v10';
import { nsfwAutocomplete } from '#commands/nsfw.js';

type CommandAutoCompleteName = 'nsfw';

export function handleApplicationCommandAutocomplete(interaction: APIApplicationCommandAutocompleteInteraction) {
	const { data } = interaction;
	const name = data.name as CommandAutoCompleteName;

	switch (name) {
		case 'nsfw':
			return nsfwAutocomplete(data.options);
	}
}
