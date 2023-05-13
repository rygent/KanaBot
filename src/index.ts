import { APIInteraction, InteractionType } from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import { Router, IRequest } from 'itty-router';
import { JsonResponse, prepareAck } from './lib/utils/respond.js';
import { logger } from './lib/utils/logger.js';
import url from 'url';
import { handleApplicationCommand } from './handling/handleApplicationCommand.js';
import { handleMessageComponents } from './handling/handleMessageComponents.js';
import { handleApplicationCommandAutocomplete } from './handling/handleApplicationCommandAutocomplete.js';

const router = Router();

router.get('/', (request: IRequest, env: any) => new Response(`👋 ${env.DISCORD_APPLICATION_ID}`));

router.post('/interactions', async (request: IRequest, env: any) => {
	const interaction = (await request.json()) as APIInteraction;
	switch (interaction.type) {
		case InteractionType.Ping:
			return prepareAck();
		case InteractionType.ApplicationCommand:
			return await handleApplicationCommand(interaction, env);
		case InteractionType.MessageComponent:
			return await handleMessageComponents(interaction);
		case InteractionType.ApplicationCommandAutocomplete:
			return handleApplicationCommandAutocomplete(interaction);
		default:
			logger.error('Unknown Type');
			return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
	}
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
	async fetch(request: Request, env: any) {
		const path = url.parse(request.url).pathname;
		if (request.method === 'POST' && path === '/interactions') {
			const signature = request.headers.get('x-signature-ed25519') as string;
			const timestamp = request.headers.get('x-signature-timestamp') as string;
			const body = await request.clone().arrayBuffer();
			const isValidRequest = verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);

			if (!isValidRequest) {
				logger.error('Invalid Request');
				return new Response('Bad request signature.', { status: 401 });
			}
		}

		return router.handle(request, env);
	}
};
