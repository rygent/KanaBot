import {
	AllowedMentionsTypes,
	APIApplicationCommandInteraction,
	APIApplicationCommandOptionChoice,
	APIEmbed,
	APIInteractionResponse,
	APIMessageComponent,
	APIMessageComponentInteraction,
	InteractionResponseType,
	MessageFlags,
	Routes
} from 'discord-api-types/v10';
import { isObject, type NonNullObject } from '@sapphire/utilities';

export class JsonResponse extends Response {
	public constructor(body?: NonNullObject | string, init?: ResponseInit | undefined) {
		if (isObject(body)) {
			body = JSON.stringify(body);
		}
		init = {
			...init,
			headers: {
				'Content-Type': 'application/json;charset=UTF-8'
			}
		};
		super(body, init);
	}
}

export function prepareAck() {
	const response = {
		type: InteractionResponseType.Pong
	} as APIInteractionResponse;

	return new JsonResponse(response);
}

export function prepareReply(data: { content?: string | null; components?: APIMessageComponent[]; embeds?: APIEmbed[]; ephemeral?: boolean }) {
	const { content, components, embeds, ephemeral = false } = data;
	const response = {
		data: {
			content,
			components,
			embeds,
			flags: ephemeral ? MessageFlags.Ephemeral : 0,
			allowed_mentions: {
				parse: [AllowedMentionsTypes.Role, AllowedMentionsTypes.User],
				replied_user: false
			}
		},
		type: InteractionResponseType.ChannelMessageWithSource
	} as APIInteractionResponse;

	return new JsonResponse(response);
}

export function prepareAutocomplete(options: APIApplicationCommandOptionChoice<string | number>[]) {
	const response = {
		data: {
			choices: options
		},
		type: InteractionResponseType.ApplicationCommandAutocompleteResult
	} as APIInteractionResponse;

	return new JsonResponse(response);
}

export function prepareDeferReply(data?: { ephemeral: boolean }) {
	const { ephemeral = false } = data!;
	const response = {
		data: {
			flags: ephemeral ? MessageFlags.Ephemeral : 0
		},
		type: InteractionResponseType.ChannelMessageWithSource
	} as APIInteractionResponse;

	return new JsonResponse(response);
}

export async function prepareUpdate(
	interaction: APIApplicationCommandInteraction | APIMessageComponentInteraction,
	data: { content?: string | null; components?: APIMessageComponent[]; embeds?: APIEmbed[]; ephemeral?: boolean }
) {
	const { content, components, embeds, ephemeral = false } = data;
	const response = {
		data: {
			content,
			components,
			embeds,
			flags: ephemeral ? MessageFlags.Ephemeral : 0,
			allowed_mentions: {
				parse: [AllowedMentionsTypes.Role, AllowedMentionsTypes.User],
				replied_user: false
			}
		},
		type: InteractionResponseType.UpdateMessage
	} as APIInteractionResponse;

	return await fetch(`https://discord.com/api/v10${Routes.interactionCallback(interaction.id, interaction.token)}`, {
		body: JSON.stringify(response),
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

export function prepareDeferUpdate(data?: { ephemeral: boolean }) {
	const { ephemeral = false } = data!;
	const response = {
		data: {
			flags: ephemeral ? MessageFlags.Ephemeral : 0
		},
		type: InteractionResponseType.DeferredMessageUpdate
	} as APIInteractionResponse;

	return new JsonResponse(response);
}
