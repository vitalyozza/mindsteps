import { App, Plugin, PluginSettingTab, Setting, Modal, Notice, ItemView, WorkspaceLeaf } from 'obsidian';
import { getFilesByTag } from "./common"
import TrackerModal from "./ui/TrackAddingModal.svelte";
import TracksStatistic from "./ui/TracksStatistic.svelte";

interface MindStepsSettings {
    tag: string;
}

const DEFAULT_SETTINGS: MindStepsSettings = {
    tag: '#track'
};

export class TrackModal extends Modal {
    private component: TrackerModal | null = null;
    settings: MindStepsSettings;

    constructor(app: App, settings: MindStepsSettings) {
        super(app);
        this.settings = settings
    }

    onOpen() {
        this.component = new TrackerModal({
            target: this.contentEl, props: {
                app: this.app,
                modal: this,
                settings: this.settings
            }
        });
    }

    onClose() {
        try {
            this.close()
        } catch (RangeError) {
            return true
        }
    }
}

const VIEW_TYPE = "svelte-view";

class TracksStatisticView extends ItemView {
    private component: TracksStatistic | null = null;
    settings: MindStepsSettings;

    constructor(leaf: WorkspaceLeaf, app: App, settings: MindStepsSettings) {
        super(leaf);
        this.app = app;
        this.settings = settings;
    }

    getViewType(): string {
        return VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Tracks Statistic";
    }

    getIcon(): string {
        return "track";
    }

    async onOpen(): Promise<void> {
        this.component = new TracksStatistic({
            target: this.contentEl, props: {
                app: this.app,
                settings: this.settings
            }
        });
    }
}

export default class MindSteps extends Plugin {
    private view: TracksStatisticView | null = null;
    settings: MindStepsSettings = DEFAULT_SETTINGS;
    statusBarItem: HTMLElement | undefined;

    async onload() {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE,
            (leaf) => new TracksStatisticView(leaf, this.app, this.settings)
        );

        this.addRibbonIcon("dice", "Tracks Statistic", (evt: MouseEvent) => {
            this.showView();
        });

        this.addCommand({
            id: "display-modal",
            name: "Track habit or chronology",
            callback: () => {
                new TrackModal(this.app, this.settings).open();
                this.updateStatusBar();
            },
        });

        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar();

        // This creates an icon in the left ribbon.
        this.addRibbonIcon('calendar-with-checkmark', 'mindsteps', (evt: MouseEvent) => {
            new TrackModal(this.app, this.settings).open()
            this.updateStatusBar();
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        new Notice("Mind Steps: Settings updated!")
        this.updateStatusBar();
    }

    updateStatusBar() {
        this.statusBarItem.setText(`🏃🏻 ${getFilesByTag(this.app, this.settings.tag).length} tracked`);
    }

    async showView() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);

        await this.app.workspace.getLeaf(false).setViewState({
            type: VIEW_TYPE,
            active: true,
        });
    }

}

class SampleSettingTab extends PluginSettingTab {
    plugin: MindSteps;

    constructor(app: App, plugin: MindSteps) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Mind Steps' });

        new Setting(containerEl)
            .setName('Track Tag')
            .setDesc('Enter your special tag by which you will track your progress')
            .addText(text => text
                .setPlaceholder('#example')
                .setValue(this.plugin.settings.tag)
                .onChange(async (value) => {
                    this.plugin.settings.tag = value;
                    await this.plugin.saveSettings();
                }));
    }
}
