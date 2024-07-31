<script lang="ts">
    import { getAllTags, TFile } from "obsidian";
    import { onMount } from "svelte";

    export let app: any;

    // let allDocuments = [];
    let selectedDocuments: any[] = [];
    let selectedDocument: any = "";
    let note: string = "";

    $: output = note === "" ? "" : `-[t] [[${selectedDocument}]]: ${note}`;

    const getFilesByTag = (tag: string): TFile[] => {
        const cache = app.metadataCache;
        const files = app.vault.getMarkdownFiles();
        const files_with_tag = [] as TFile[];

        files.forEach((file: { path: TFile }) => {
            const file_cache:any = cache.getFileCache(file);
            const tags = getAllTags(file_cache);
            if (tags.includes(tag)) {
                files_with_tag.push(file.path);
            }
        });

		return files_with_tag
    };

    onMount(async () => {
        // Call the Obsidian API to get the document list
        // const adapter = app.vault.adapter as FileSystemAdapter;
        // allDocuments = await adapter.list("base"); // Replace '' with desired path
        selectedDocuments = getFilesByTag("#track");
    });
</script>

<div>
    <h2>Track</h2>
    <p>
        <select
            placeholder="Choose tracker"
            name="tracker_documents"
            class="tracker_documents"
            bind:value={selectedDocument}
        >
            {#each selectedDocuments as document}
                <option value={document}>{document}</option>
            {/each}
        </select>
    </p>

    <p>
        <textarea
            name="note"
            class="tracker_note"
            placeholder="Enter note..."
            bind:value={note}
        ></textarea>
    </p>
    <p>
        Output: {output}
    </p>
</div>

<style lang="css">
    .tracker_documents {
        width: 100%;
    }

    .tracker_note {
        width: 100%;
        min-height: 240px;
    }
</style>
