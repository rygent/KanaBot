import {
	APIActionRowComponent,
	APIApplicationCommandInteraction,
	APIApplicationCommandInteractionDataOption,
	APIEmbed,
	APIMessageActionRowComponent,
	ButtonStyle,
	ComponentType
} from 'discord-api-types/v10';
import NsfwCommand from '../interactions/nsfw.js';
import { prepareAutocomplete, prepareReply } from '../lib/utils/respond.js';
import { transformInteraction } from '../lib/utils/interactionOptions.js';
import nsfw from '../assets/json/nsfw.json' assert { type: 'json' };

export async function nsfwCommand(interaction: APIApplicationCommandInteraction, category: string, visible?: boolean) {
	try {
		const raw = await fetch(`https://nekobot.xyz/api/image?type=${category}`, {
			method: 'GET',
			headers: { 'User-Agent': 'Axios 1.3.6' }
		});
		const response: any = await raw.json();

		const button: APIActionRowComponent<APIMessageActionRowComponent> = {
			type: ComponentType.ActionRow,
			components: [
				{
					type: ComponentType.Button,
					style: ButtonStyle.Link,
					label: 'Open in Browser',
					url: response.message
				}
			]
		};

		const embed: APIEmbed = {
			color: 3092790,
			image: { url: response.message },
			footer: { text: `Powered by ${interaction.user?.username}` }
		};

		return prepareReply({ embeds: [embed], components: [button], ephemeral: !visible });
	} catch {
		return prepareReply({ content: 'Nothing found for this search.', ephemeral: true });
	}
}

export function nsfwAutocomplete(options: APIApplicationCommandInteractionDataOption[]) {
	const { category } = transformInteraction<typeof NsfwCommand>(options);

	const choices = nsfw.filter(({ name }) => name.toLowerCase().includes(category.toLowerCase()));
	let respond = choices.filter(({ hoisted }) => hoisted).map(({ name }) => ({ name, value: name.toLowerCase() }));

	if (category.length) {
		respond = choices.map(({ name }) => ({ name, value: name.toLowerCase() }));

		return prepareAutocomplete(respond.slice(0, 25));
	}

	return prepareAutocomplete(respond.slice(0, 25));
}
