<script lang="ts">
    import moment from "moment";
    // @ts-ignore
    import Heatmap from "svelte-heatmap";
    import { getFilesByTag } from "../common";

    export let app: any;
    export let settings: any;
    let documentsData: any[] = [];

    let files = getFilesByTag(app, settings.tag);

    interface TrackRecord {
        date: string;
        title: string;
        duration: number;
    }

    interface TrackHeatmapData {
        name: string;
        path: string;
        data: {
            date: string;
            count: number;
            duration: number;
        }[];
    }

    function parseTracksSection(section: string): TrackRecord[] {
        // Регулярное выражение для извлечения даты, названия и длительности
        const regex = /\[\[([^\]]+)\|([^\]]+)\]\]: (.*) \((\d+) mins\)/g;

        const tracks: TrackRecord[] = [];
        let match;
        while ((match = regex.exec(section)) !== null) {
            tracks.push({
                date: match[2],
                title: match[3],
                duration: parseInt(match[4]),
            });
        }

        return tracks;
    }

    function countRecordsByDate(
        tracks: TrackRecord[],
    ): { date: string; count: number; duration: number }[] {
        const countsByDate = new Map<
            string,
            { count: number; duration: number }
        >();

        tracks.forEach((track) => {
            const entry = countsByDate.get(track.date) || {
                count: 0,
                duration: 0,
            };
            entry.count++;
            entry.duration += track.duration;
            countsByDate.set(track.date, entry);
        });

        return Array.from(countsByDate.entries()).map(
            ([date, { count, duration }]) => ({
                date,
                count,
                duration,
            }),
        );
    }

    function processDocuments(
        documents: string[],
    ): { date: string; count: number; duration: number }[] {
        const allTracks: TrackRecord[] = [];

        documents.forEach((document) => {
            // Находим секции "Tracks" в документе (здесь упрощенный пример)
            const tracksSections = document.split("## Tracks");
            tracksSections.forEach((section) => {
                allTracks.push(...parseTracksSection(section));
            });
        });

        return countRecordsByDate(allTracks);
    }

    async function getDocumentData() {
        documentsData = await Promise.all(
            files.map(async (file) => {
                let documentData: TrackHeatmapData;
                const fileContent = await app.vault.read(file);
                const result = processDocuments([fileContent]);

                documentData = {
                    name: file.basename,
                    path: file.path,
                    data: result,
                };

                return documentData;
            }),
        );
    }

    $: getDocumentData();

    // Generate dummy data for a heatmap
    function generateData(days) {
        const data = [];

        days.forEach((day) => {
            data.push({
                date: day.date,
                value: day.duration,
            });
        });

        return data;
    }

    function sumAllDuration(days) {
        let data: number = 0;

        days.forEach((day) => {
            data += day.duration;
        });

        return data;
    }

    async function openDocument(path: string) {
        const file = app.vault.getAbstractFileByPath(path);
        if (file) {
            await app.workspace.openLinkText(file.path, "", false);
        } else {
            console.error(`File not found: ${path}`);
        }
    }
</script>

<h1>Tracks</h1>

<div class="heatmap_wrapper">
    {#each documentsData as document}
        <div class="heatmap">
            <div class="button-container">
                <button
                    class="open"
                    on:click={() => openDocument(document.path)}>Open</button
                >
            </div>
            <h2>{document.name}</h2>
            <span class="text">Spent: {sumAllDuration(document.data)} mins</span
            >
            <Heatmap
                allowOverflow={true}
                cellGap={2}
                cellRadius={1}
                cellSize={8}
                fontColor={"#777"}
                colors={[
                    "#b1e1c6",
                    "#9ed9b8",
                    "#8ad1aa",
                    "#77ca9c",
                    "#18482d",
                    "#50bb7f",
                    "#3cb371",
                ]}
                data={generateData(document.data)}
                dayLabelWidth={20}
                monthGap={16}
                monthLabelHeight={20}
                emptyColor={"rgb(0,0,0,0.1)"}
                endDate={moment().toDate()}
                startDate={moment().subtract(5, "months").toDate()}
                view={"yearly"}
            />
        </div>
    {/each}
</div>

<style lang="css">
    h1 {
        text-align: center;
    }
    .heatmap_wrapper {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px 16px;
        padding: 24px;
    }

    .heatmap {
        width: 380px;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 16px;
        display: flex;
        padding: 24px 16px;
        background-color: #fff;
        border: 1px solid #77777725;
        border-radius: 8px;
        overflow: hidden;

        & > .button-container {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            align-items: flex-end;
            height: 0;
            & > button.open {
                width: auto;
                text-align: right;
                color: white;
                cursor: pointer;
                background-color: #333;
            }
        }

        & > h2 {
            margin-top: -30px;
            color: #333;
        }

        & > .text {
            color: #777;
            margin-top: 8px;
            margin-bottom: 16px;
        }

        & > svg {
            width: 320px;
        }
    }
</style>
