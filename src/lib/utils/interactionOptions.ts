/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ApplicationCommandOptionType, type APIApplicationCommandInteractionDataOption } from 'discord-api-types/v10';
import { type Command, type ArgumentsOf } from '#lib/utils/argumentsOf.js';

export function transformInteraction<T extends Command>(
	options: readonly APIApplicationCommandInteractionDataOption[]
): ArgumentsOf<T> {
	const opts: any = {};

	for (const top of options) {
		switch (top.type) {
			case ApplicationCommandOptionType.Subcommand:
			case ApplicationCommandOptionType.SubcommandGroup:
				opts[top.name] = transformInteraction(top.options ? [...top.options] : []);
				break;
			default:
				opts[top.name] = top.value;
				break;
		}
	}

	return opts as ArgumentsOf<T>;
}
