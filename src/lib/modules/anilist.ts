import he from 'he';
const { decode } = he;

function gql(...args: any[]): string {
	return args[0].reduce((acc: string, str: string, idx: number) => {
		acc += str;
		if (Reflect.has(args, idx + 1)) acc += args[idx + 1];
		return acc;
	}, '');
}

const MediaFragment = gql`
	fragment MediaFragment on Media {
		id
		idMal
		title {
			english
			romaji
			native
		}
		format
		status(version: 2)
		description
		startDate {
			month
			day
			year
		}
		endDate {
			month
			day
			year
		}
		countryOfOrigin
		source(version: 3)
		genres
		synonyms
		averageScore
		popularity
		favourites
		characters(sort: RELEVANCE) {
			nodes {
				name {
					full
					native
				}
			}
		}
		isAdult
		externalLinks {
			type
			url
			site
		}
		siteUrl
	}
`;

const AnimeFragment = gql`
	${MediaFragment}
	query ($id: Int, $search: String, $page: Int, $perPage: Int) {
		Page(page: $page, perPage: $perPage) {
			media(id: $id, search: $search, type: ANIME) {
				...MediaFragment
				season
				seasonYear
				episodes
				duration
				studios(sort: NAME, isMain: true) {
					nodes {
						name
						isAnimationStudio
					}
				}
				nextAiringEpisode {
					airingAt
					episode
				}
			}
		}
	}
`;

const MangaFragment = gql`
	${MediaFragment}
	query ($id: Int, $search: String, $page: Int, $perPage: Int) {
		Page(page: $page, perPage: $perPage) {
			media(id: $id, search: $search, type: MANGA) {
				...MediaFragment
				chapters
				volumes
			}
		}
	}
`;

export class Anilist {
	private readonly endpoint = 'https://graphql.anilist.co/';

	public async search<C extends SearchType>(variables: {
		type: C;
		search: string;
		page?: number;
		perPage?: number;
	}): Promise<any> {
		const { type, search, page = 1, perPage = 10 } = variables;
		try {
			const res = await fetch(this.endpoint, {
				method: 'POST',
				body: JSON.stringify({ query: resolveQueryFragment(type), variables: { search, page, perPage } }),
				headers: { 'Content-Type': 'application/json' }
			});

			if (res.status === 200) {
				return await res.json();
			}

			throw new Error(`Received status ${res.status} (${res.statusText})`);
		} catch (error: unknown) {
			throw error;
		}
	}

	public async getAnime(variables: { id: number }) {
		const { id } = variables;
		try {
			const res = await fetch(this.endpoint, {
				method: 'POST',
				body: JSON.stringify({ query: resolveQueryFragment('anime'), variables: { id } }),
				headers: { 'Content-Type': 'application/json' }
			});

			if (res.status === 200) {
				return await res.json();
			}

			throw new Error(`Received status ${res.status} (${res.statusText})`);
		} catch (error: unknown) {
			throw error;
		}
	}

	public async getManga(variables: { id: number }) {
		const { id } = variables;
		try {
			const res = await fetch(this.endpoint, {
				method: 'POST',
				body: JSON.stringify({ query: resolveQueryFragment('manga'), variables: { id } }),
				headers: { 'Content-Type': 'application/json' }
			});

			if (res.status === 200) {
				return await res.json();
			}

			throw new Error(`Received status ${res.status} (${res.statusText})`);
		} catch (error: unknown) {
			throw error;
		}
	}
}

function resolveQueryFragment<C extends SearchType>(type: C): string {
	switch (type) {
		case 'anime':
			return AnimeFragment;
		case 'manga':
			return MangaFragment;
		default:
			return '';
	}
}

const excessiveNewLinesRegex = /\n{3,}/g;

const htmlEntityRegex = /<\/?(i|b|br)>/g;

const htmlEntityReplacements = Object.freeze({
	i: '',
	em: '',
	var: '',
	b: '',
	br: '\n',
	code: '',
	pre: '',
	mark: '',
	kbd: '',
	s: '',
	wbr: '',
	u: ''
} as const);

export function parseDescription(description: string) {
	return decode(
		description.replace(htmlEntityRegex, (_, type: keyof typeof htmlEntityReplacements) => htmlEntityReplacements[type])
	).replace(excessiveNewLinesRegex, '\n\n');
}

type SearchType = 'anime' | 'manga';
