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

export async function nsfwCommand(env: any, category: string, visible?: boolean) {
	try {
		const raw = await fetch(`https://elvia.vercel.app/api/v1/img/nsfw?type=${category}`, { method: 'GET' });
		const response: any = await raw.json();

		const button: APIActionRowComponent<APIMessageActionRowComponent> = {
			type: ComponentType.ActionRow,
			components: [
				{
					type: ComponentType.Button,
					style: ButtonStyle.Link,
					label: 'Open in Browser',
					url: response.url
				}
			]
		};

		const embed: APIEmbed = {
			color: 3092790,
			image: { url: response.url },
			footer: { text: `Powered by ${env.CLIENT_NAME}` }
		};

		return prepareReply({ embeds: [embed], components: [button], ephemeral: !visible });
	} catch (error) {
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
