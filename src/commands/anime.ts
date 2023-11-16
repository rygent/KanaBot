import {
	type APIApplicationCommandInteraction,
	type APIMessageComponentInteraction,
	ButtonStyle
} from 'discord-api-types/v10';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from '@discordjs/builders';
import { prepareReply, prepareUpdate } from '#lib/utils/respond.js';
import { cutText } from '@sapphire/utilities';
import { bold, italic, time, underscore } from '@discordjs/formatters';
import { DurationFormatter } from '@sapphire/time-utilities';
import moment from 'moment';
import { formatArray, formatNumber, titleCase } from '#lib/utils/function.js';
import { Anilist } from '@rygent/anilist';

const anilist = new Anilist();
let selectId: string;

export async function animeCommand(interaction: APIApplicationCommandInteraction, search: string) {
	const response = await anilist.media.search({ type: 'Anime', search, perPage: 25 });
	if (!response?.length) return prepareReply({ content: 'Nothing found for this search.', ephemeral: true });

	selectId = `anime-select-${interaction.id}`;

	const select = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
		new StringSelectMenuBuilder()
			.setCustomId(selectId)
			.setPlaceholder('Select an anime')
			.setOptions(
				...response.map((data) => ({
					value: data!.id.toString(),
					label:
						cutText(Object.values(data!.title!).filter((title) => title?.length)[0] as string, 1e2) ?? 'Unknown Name',
					...(data!.description?.length && { description: cutText(data!.description, 1e2) })
				}))
			)
	);

	return prepareReply({
		content: `I found ${bold(response.length.toString())} possible matches, please select one of the following:`,
		components: [select.toJSON()]
	});
}

export async function animeComponents(interaction: APIMessageComponentInteraction, search: string) {
	const data = await anilist.media.anime({ id: Number(search) });

	const startDate = !Object.values(data.startDate!).some((value) => value === null)
		? Object.values(data.startDate!).join('/')
		: null;
	const endDate = !Object.values(data.endDate!).some((value) => value === null)
		? Object.values(data.endDate!).join('/')
		: null;

	const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
		new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Open in Browser').setURL(data.siteUrl!)
	);

	const embed = new EmbedBuilder()
		.setColor(0x2b2d31)
		.setAuthor({ name: 'Anilist', iconURL: 'https://i.imgur.com/B48olfM.png', url: 'https://anilist.co/' })
		.setTitle(Object.values(data.title!).filter((title) => title?.length)[0])
		.addFields({
			name: underscore(italic('Detail')),
			value: [
				...(data.title?.romaji ? [`${bold(italic('Romaji:'))} ${data.title.romaji}`] : []),
				...(data.title?.english ? [`${bold(italic('English:'))} ${data.title.english}`] : []),
				...(data.title?.native ? [`${bold(italic('Native:'))} ${data.title.native}`] : []),
				`${bold(italic('Type:'))} ${getType(data.format!)}`,
				`${bold(italic('Status:'))} ${titleCase(data.status!.replace(/_/g, ' '))}`,
				`${bold(italic('Source:'))} ${titleCase(data.source!.replace(/_/g, ' '))}`,
				...(startDate ? [`${bold(italic('Aired:'))} ${getDate(startDate, endDate)}`] : []),
				...(data.duration
					? [`${bold(italic('Length:'))} ${getDurationLength(data.duration, data.episodes!, data.format!)}`]
					: []),
				...(data.nextAiringEpisode
					? [
							`${bold(italic('Next episodes:'))} ${time(data.nextAiringEpisode.airingAt, 'R')} (episode ${
								data.nextAiringEpisode.episode
							})`
					  ]
					: []),
				...(data.isAdult ? [`${bold(italic('Explicit content:'))} ${data.isAdult ? 'Yes' : 'No'}`] : []),
				`${bold(italic('Popularity:'))} ${formatNumber(data.popularity!)}`
			].join('\n'),
			inline: false
		})
		.setImage(`https://img.anili.st/media/${data.id}`)
		.setFooter({ text: 'Powered by Anilist' });

	if (data.description?.length) {
		embed.setDescription(cutText(data.description, 512));
	}

	if (data.characters?.nodes?.length) {
		embed.addFields({
			name: underscore(italic('Characters')),
			value: formatArray(data.characters.nodes.map((item) => item!.name!.full!)),
			inline: false
		});
	}

	if (data.externalLinks?.filter((item) => item?.type === 'STREAMING')?.length) {
		embed.addFields({
			name: underscore(italic('Networks')),
			value: data.externalLinks
				.filter((item) => item?.type === 'STREAMING')
				.map((item) => `[${item?.site}](${item?.url})`)
				.join(', '),
			inline: false
		});
	}

	return prepareUpdate(interaction, { content: null, embeds: [embed.toJSON()], components: [button.toJSON()] });
}

function getType(format: string): string {
	if (['TV', 'OVA', 'ONA'].includes(format)) return format;
	else if (format === 'TV_SHORT') return 'TV Short';
	return titleCase(format.replace(/_/g, ' '));
}

function getDurationLength(duration: number, episodes: number, format: string): string | undefined {
	const formatter = (milliseconds: number) => new DurationFormatter().format(milliseconds, undefined, { right: ', ' });
	if (format === 'MOVIE') return `${formatter(duration * 6e4)} total (${duration} minutes)`;
	else if (episodes > 1) return `${formatter(duration * episodes * 6e4)} total (${duration} minutes each)`;
	else if (episodes <= 1 && format !== 'MOVIE') return `${duration} minutes`;
}

function getDate(startDate: string, endDate: string | null): string {
	if (startDate === endDate) return moment(new Date(startDate)).format('MMM D, YYYY');
	else if (startDate && !endDate) return `${moment(new Date(startDate)).format('MMM D, YYYY')} to ?`;
	return `${moment(new Date(startDate)).format('MMM D, YYYY')} to ${moment(new Date(endDate as string)).format(
		'MMM D, YYYY'
	)}`;
}
