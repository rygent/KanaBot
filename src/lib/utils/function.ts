export function titleCase(input: string): string {
	return input.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export function formatNumber(input: number): string {
	return input.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

export function formatArray(input: string[], options: { style?: Intl.ListFormatStyle; type?: Intl.ListFormatType } = {}): string {
	const { style = 'short', type = 'conjunction' } = options;
	return new Intl.ListFormat('en-US', { style, type }).format(input);
}
