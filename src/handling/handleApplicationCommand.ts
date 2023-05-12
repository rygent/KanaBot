import { APIApplicationCommandInteraction, ApplicationCommandType } from 'discord-api-types/v10';
import { ArgumentsOf } from '../lib/utils/argumentsOf.js';
import { transformInteraction } from '../lib/utils/interactionOptions.js';
import AnimeCommand from '../interactions/anime.js';
import MangaCommand from '../interactions/manga.js';
import { mangaCommand } from '../commands/manga.js';
import { animeCommand } from '../commands/anime.js';

type CommandName = 'anime' | 'manga';

export async function handleApplicationCommand(interaction: APIApplicationCommandInteraction, env: any) {
	const { data } = interaction;
	if (data.type === ApplicationCommandType.ChatInput) {
		const options = data.options ?? [];
		const name = data.name as CommandName;
		const args = transformInteraction(options);

		let castArgs;
		switch (name) {
			case 'anime':
				castArgs = args as ArgumentsOf<typeof AnimeCommand>;
				return animeCommand(interaction, castArgs.search);
			case 'manga':
				castArgs = args as ArgumentsOf<typeof MangaCommand>;
				return mangaCommand(interaction, castArgs.search);
		}
	}
}
