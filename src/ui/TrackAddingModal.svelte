<script lang="ts">
    import { FileSystemAdapter, Notice } from "obsidian";
    import RangeSlider from "svelte-range-slider-pips";
    import Toggle from "svelte-switcher";
    import { onMount } from "svelte";
    import { getFilesByTag } from "../common";

    export let app: any;
    export let modal: any;
    export let settings: any;

    // let allDocuments = [];
    let selectedDocuments: any[] = [];
    let documentValue = "";
    let timeValue = 0;
    let formValidation = {
        fields: {
            document: {
                value: "",
                path: "",
                url: "",
                isFilled: false,
            },
            note: {
                value: null,
                isFilled: false,
            },
            time: {
                value: 0,
                isNeeded: false,
            },
            date: {
                path: `Base/${new Date().toISOString().split("T")[0]}.md`,
                value: new Date().toISOString().split("T")[0],
                url: `[[Base/${new Date().toISOString().split("T")[0]}.md|${new Date().toISOString().split("T")[0]}]]`,
            },
        },
        isFilled: false,
    };

    $: formValidation.isFilled =
        formValidation.fields.document.isFilled &&
        formValidation.fields.note.isFilled;

    let clearDocumentName = (path: string) => {
        let item = path.replace(".md", "").split("/").pop();
        return item;
    };

    formValidation.fields.document.value = documentValue;

    $: formValidation.fields.document.path = documentValue;
    $: formValidation.fields.time.value = timeValue;
    $: formValidation.fields.document.url = `[[${formValidation.fields.document.path}|${clearDocumentName(documentValue)}]]`;
    $: outputForToday =
        formValidation.fields.note.value === null
            ? ""
            : `- ${formValidation.fields.document.url}: ${formValidation.fields.note.value} ${displayMinutes()}`;
    $: outputForNote =
        formValidation.fields.note.value === null
            ? ""
            : `- ${formValidation.fields.date.url}: ${formValidation.fields.note.value} ${displayMinutes()}`;

    let writeLineToFile = async (file: string, line: string) => {
        const adapter = app.vault.adapter as FileSystemAdapter;
        const fileContent = await adapter.read(file);
        const lines = fileContent.split("\n");

        let headerIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === "## Tracks") {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            lines.push("## Tracks");
            lines.push("%%Habits or chronology%%");
        }

        lines.push(line);

        await adapter.write(file, lines.join("\n"));
    };

    onMount(async () => {
        selectedDocuments = getFilesByTag(app, settings.tag);
    });

    let handleButtonClick = async () => {
        try {
            await writeLineToFile(
                formValidation.fields.document.path,
                outputForNote,
            );
            await writeLineToFile(
                formValidation.fields.date.path,
                outputForToday,
            );
        } catch (ENOENT) {
            new Notice("You need to create Daily note before track data");
        }

        // Add your post-action logic here (e.g., close modal, display success message)
        try {
            modal.close();
            new Notice("Mind Steps: Added new data!");
        } catch (RangeError) {
            return true;
        }
    };

    let displayMinutes = () => {
        if (formValidation.fields.time.isNeeded) {
            return `(${formValidation.fields.time.value} mins)`;
        } else {
            return ``;
        }
    };
</script>

<div>
    <h2>Track</h2>
    <p><label for="tracker_documents">Choose document</label></p>
    <p>
        <select
            placeholder="Choose tracker"
            name="tracker_documents"
            id="tracker_documents"
            class="tracker_documents"
            on:input={(e) => {
                formValidation.fields.document.isFilled = true;
            }}
            bind:value={documentValue}
        >
            {#each selectedDocuments as document}
                <option value={document.path}>{document.path}</option>
            {/each}
        </select>
    </p>
    <p>
        <span style="display: flex; gap: 16px;"
            ><Toggle
                id="svelte-toggle"
                name="theme-toggle"
                onChange={() => {
                    formValidation.fields.time.isNeeded =
                        !formValidation.fields.time.isNeeded;
                }}
                defaultChecked={formValidation.fields.time.isNeeded}
            />Allow Tracking Time</span
        >
    </p>
    {#if formValidation.fields.time.isNeeded}
        <br />
        <p>
            <RangeSlider
                values={[50]}
                step={1}
                min={1}
                max={560}
                pipstep={60}
                first="label"
                last="label"
                pips="true"
                on:change={(e) => {
                    formValidation.fields.time.value = e.detail.value;
                }}
            />
            <span>{formValidation.fields.time.value} mins</span>
        </p>
    {/if}
    <p>
        <textarea
            name="note"
            class="tracker_note"
            placeholder="Enter note..."
            bind:value={formValidation.fields.note.value}
            on:input={() => {
                formValidation.fields.note.isFilled = true;
            }}
            disabled={!formValidation.fields.document.isFilled}
        ></textarea>
    </p>
    <p></p>
    <p>
        <button
            class="tracker_button"
            disabled={!formValidation.isFilled}
            on:click={handleButtonClick}
        >
            Add Note
        </button>
    </p>
</div>

<style lang="css">
    .tracker_documents {
        width: 100%;
    }

    .tracker_note {
        width: 100%;
        min-height: 240px;

        &:disabled {
            background: rgba(172, 172, 172, 0.451);
            color: #303030;
        }
    }

    .tracker_button {
        width: 100%;
        padding: 16px 32px;
        height: auto;
        background: rgb(13, 111, 13);
        color: white;
        font-size: 18px;
        border-radius: 8px;

        &:disabled {
            background: rgba(90, 90, 90, 0.451);
            color: #303030;
        }
    }
</style>
