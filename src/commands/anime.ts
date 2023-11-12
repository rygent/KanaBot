import {
	type APIActionRowComponent,
	type APIApplicationCommandInteraction,
	type APIEmbed,
	type APIMessageActionRowComponent,
	type APIMessageComponentInteraction,
	ButtonStyle,
	ComponentType
} from 'discord-api-types/v10';
import { Anilist, parseDescription } from '../lib/modules/anilist.js';
import { prepareReply, prepareUpdate } from '../lib/utils/respond.js';
import { cutText } from '@sapphire/utilities';
import { bold, italic, time, underscore } from '@discordjs/formatters';
import { DurationFormatter } from '@sapphire/time-utilities';
import moment from 'moment';
import { formatArray, formatNumber, titleCase } from '../lib/utils/function.js';

const anilist = new Anilist();
let selectId: string;

export async function animeCommand(interaction: APIApplicationCommandInteraction, search: string) {
	const response = await anilist.search({ type: 'anime', search, perPage: 25 }).then(
		({
			data: {
				Page: { media }
			}
		}) => media
	);
	if (!response?.length) return prepareReply({ content: 'Nothing found for this search.', ephemeral: true });

	selectId = `anime-select-${interaction.id}`;

	const select = {
		type: ComponentType.ActionRow,
		components: [
			{
				type: ComponentType.StringSelect,
				custom_id: selectId,
				placeholder: 'Select an anime',
				options: [
					...response.map((data: any) => ({
						value: data.id.toString(),
						label:
							cutText(Object.values(data.title!).filter((title: any) => title?.length)[0] as string, 1e2) ??
							'Unknown Name',
						...(data.description?.length && { description: cutText(parseDescription(data.description), 1e2) })
					}))
				]
			}
		]
	} as APIActionRowComponent<APIMessageActionRowComponent>;

	return prepareReply({
		content: `I found ${bold(response.length.toString())} possible matches, please select one of the following:`,
		components: [select]
	});
}

export async function animeComponents(interaction: APIMessageComponentInteraction, search: string) {
	const data = await anilist.getAnime({ id: Number(search) }).then(
		({
			data: {
				Page: { media }
			}
		}: any) => media[0]
	);

	const startDate = !Object.values(data.startDate!).some((value) => value === null)
		? Object.values(data.startDate!).join('/')
		: null;
	const endDate = !Object.values(data.endDate!).some((value) => value === null)
		? Object.values(data.endDate!).join('/')
		: null;

	const button = {
		type: ComponentType.ActionRow,
		components: [
			{
				type: ComponentType.Button,
				style: ButtonStyle.Link,
				label: 'Open in Browser',
				url: data.siteUrl!
			}
		]
	} as APIActionRowComponent<APIMessageActionRowComponent>;

	const embed = {
		color: 3092790,
		author: { name: 'Anilist', icon_url: 'https://i.imgur.com/B48olfM.png', url: 'https://anilist.co/' },
		title: Object.values(data.title!).filter((title: any) => title?.length)[0],
		...(data.description?.length && { description: cutText(parseDescription(data.description), 512) }),
		fields: [
			{
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
			},
			...(data.characters?.nodes?.length
				? [
						{
							name: underscore(italic('Characters')),
							value: formatArray(data.characters.nodes.map((item: any) => item.name!.full!)),
							inline: false
						}
				  ]
				: []),
			...(data.externalLinks?.filter((item: any) => item?.type === 'STREAMING')?.length
				? [
						{
							name: underscore(italic('Networks')),
							value: data.externalLinks
								.filter((item: any) => item?.type === 'STREAMING')
								.map((item: any) => `[${item?.site}](${item?.url})`)
								.join(', '),
							inline: false
						}
				  ]
				: [])
		],
		image: { url: `https://img.anili.st/media/${data.id}` },
		footer: { text: 'Powered by Anilist' }
	} as APIEmbed;

	return prepareUpdate(interaction, { content: null, embeds: [embed], components: [button] });
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
