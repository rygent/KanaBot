import { defineConfig } from 'tsup';

export default defineConfig({
	bundle: true,
	sourcemap: true,
	format: 'esm',
	target: 'esnext',
	entry: ['src/interactions/**/*.ts', 'src/index.ts'],
	outDir: 'dist',
	platform: 'node'
});
