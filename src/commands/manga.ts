import {
	type APIActionRowComponent,
	type APIApplicationCommandInteraction,
	type APIEmbed,
	type APIMessageActionRowComponent,
	type APIMessageComponentInteraction,
	ButtonStyle,
	ComponentType
} from 'discord-api-types/v10';
import { Anilist, parseDescription } from '@rygent/anilist';
import { prepareReply, prepareUpdate } from '#lib/utils/respond.js';
import { cutText } from '@sapphire/utilities';
import { bold, italic, underscore } from '@discordjs/formatters';
import moment from 'moment';
import { formatArray, formatNumber, titleCase } from '#lib/utils/function.js';

const anilist = new Anilist();
let selectId: string;

export async function mangaCommand(interaction: APIApplicationCommandInteraction, search: string) {
	const response = await anilist.search({ type: 'manga', search, perPage: 25 }).then(
		({
			data: {
				Page: { media }
			}
		}) => media
	);
	if (!response?.length) return prepareReply({ content: 'Nothing found for this search.', ephemeral: true });

	selectId = `manga-select-${interaction.id}`;

	const select = {
		type: ComponentType.ActionRow,
		components: [
			{
				type: ComponentType.StringSelect,
				custom_id: selectId,
				placeholder: 'Select a manga',
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

export async function mangaComponents(interaction: APIMessageComponentInteraction, search: string) {
	const data = await anilist.getManga({ id: Number(search) }).then(({ data: { Media } }) => Media);

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
					`${bold(italic('Type:'))} ${getType(data.format!, data.countryOfOrigin!)}`,
					`${bold(italic('Status:'))} ${titleCase(data.status!.replace(/_/g, ' '))}`,
					`${bold(italic('Source:'))} ${titleCase(data.source!.replace(/_/g, ' '))}`,
					...(startDate ? [`${bold(italic('Published:'))} ${getDate(startDate, endDate)}`] : []),
					...(data.volumes ? [`${bold(italic('Volumes:'))} ${data.volumes}`] : []),
					...(data.chapters ? [`${bold(italic('Chapters:'))} ${data.chapters}`] : []),
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

function getType(format: string, countryOfOrigin: string): string {
	if (format === 'MANGA' && countryOfOrigin === 'KR') return 'Manhwa';
	else if (format === 'MANGA' && countryOfOrigin === 'CN') return 'Manhua';
	else if (format === 'NOVEL') return 'Light Novel';
	return titleCase(format.replace(/_/g, ' '));
}

function getDate(startDate: string, endDate: string | null): string {
	if (startDate === endDate) return moment(new Date(startDate)).format('MMM D, YYYY');
	else if (startDate && !endDate) return `${moment(new Date(startDate)).format('MMM D, YYYY')} to ?`;
	return `${moment(new Date(startDate)).format('MMM D, YYYY')} to ${moment(new Date(endDate!)).format('MMM D, YYYY')}`;
}
