import type { BunPlugin } from 'bun';
interface CopyBunPluginConfig {
    patterns?: CopyPluginPattern[];
}
interface CopyPluginPattern {
    from: string;
    to?: string;
}
export default function CopyBunPlugin(pluginConfig: CopyBunPluginConfig): BunPlugin;
export {};
