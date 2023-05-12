import { URL, fileURLToPath, pathToFileURL } from 'node:url';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Command } from 'commander';
import { globby } from 'globby';
import path from 'node:path';
import createLogger from 'pino';
import dotenv from 'dotenv-cra';
dotenv.config();

const logger = createLogger();
const program = new Command();

program.option('-g, --global', 'register commands globally.');
program.option('-l, --local', 'register commands locally.');

program.parse(process.argv);

const token = process.env.DISCORD_TOKEN;
if (!token) {
	throw new Error('The DISCORD_TOKEN environment variable is required.');
}

const applicationId = process.env.DISCORD_APPLICATION_ID;
if (!applicationId) {
	throw new Error('The DISCORD_APPLICATION_ID environment variable is required.');
}

const options = program.opts();
if (!options.global && !options.dev) console.log(program.helpInformation());

async function loadCommands() {
	const main = fileURLToPath(new URL('../dist/index.js', import.meta.url));
	const directory = `${path.dirname(main) + path.sep}`.replace(/\\/g, '/');

	const commands = [];
	await globby(`${directory}interactions/**/*.js`).then(async (interactions) => {
		for (const interactionFile of interactions) {
			const { default: interaction } = await import(pathToFileURL(interactionFile));
			commands.push(interaction);
		}
	});

	return commands;
}

async function registerCommands() {
	const commands = await loadCommands();
	const rest = new REST({ version: '10' }).setToken(token);

	try {
		logger.info('Started refreshing application (/) commands.');

		if (options.global) {
			await rest.put(Routes.applicationCommands(applicationId), { body: [...commands] });
		}

		if (options.local) {
			const guildId = process.env.DISCORD_GUILD_ID;
			if (!guildId) {
				throw new Error('The DISCORD_GUILD_ID environment variable is required.');
			}

			await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: [...commands] });
		}

		logger.info('Successfully reloaded application (/) commands.');
	} catch (error) {
		logger.error(error);
	}
}

await registerCommands();
