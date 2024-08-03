<script lang="ts">
    import { getFilesByTag } from "../common";

    export let app: any;
    export let settings: any;
    let documentsData: any[] = [];

    let files = getFilesByTag(app, settings.tag);

    console.log(files);

    interface TrackRecord {
        date: string;
        title: string;
        duration: number; // или string, если длительность представлена в формате "320 mins"
    }

    interface TrackHeatmapData {
        name: string;
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
                    data: result,
                };

                return documentData;
            }),
        );
    }

    $: getDocumentData();
</script>

<h1>Tracks</h1>

{#each documentsData as document}
    <h2>{document.name}</h2>
    <ul>
        {#each document.data as day}
            <!-- content here -->
            <li>{day.date} • {day.duration} mins</li>
        {/each}
    </ul>
{/each}

<style lang="css"></style>
