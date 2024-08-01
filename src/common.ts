import { TFile, getAllTags, App } from "obsidian";

export const getFilesByTag = (app: App, tag: string): TFile[] => {
	const cache = app.metadataCache;
	const files = app.vault.getMarkdownFiles();
	const filesWithTag: TFile[] = [];

	files.forEach((file) => {
		const fileCache = cache.getFileCache(file);
		const tags = getAllTags(fileCache);
		if (tags.includes(tag)) {
			filesWithTag.push(file);
		}
	});

	return filesWithTag;
};