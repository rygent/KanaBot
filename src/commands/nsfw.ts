import { type APIApplicationCommandInteractionDataOption, ButtonStyle } from 'discord-api-types/v10';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from '@discordjs/builders';
import NsfwCommand from '#interactions/nsfw.js';
import { prepareAutocomplete, prepareReply } from '#lib/utils/respond.js';
import { transformInteraction } from '#lib/utils/interactionOptions.js';
import nsfw from '#assets/json/nsfw.json' assert { type: 'json' };

export async function nsfwCommand(env: any, category: string, visible?: boolean) {
	try {
		const raw = await fetch(`https://elvia.vercel.app/api/v1/img/nsfw?type=${category}`, { method: 'GET' });
		const response: any = await raw.json();

		const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
			new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Open in Browser').setURL(response.url)
		);

		const embed = new EmbedBuilder()
			.setColor(3092790)
			.setImage(response.url)
			.setFooter({ text: `Powered by ${env.CLIENT_NAME}` });

		return prepareReply({ embeds: [embed.toJSON()], components: [button.toJSON()], ephemeral: !visible });
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
