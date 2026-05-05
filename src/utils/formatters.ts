export function formatBytes(bytes: number, unit: boolean = true, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k: number = 1024;
    const sizes: string[] = ['Bytes', 'KB', 'MB', 'G', 'TB', 'PB'];
    const i: number = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + (unit ? ' ' + sizes[i] : '');
}

/**
 * SABnzbd `queue.speed` format (e.g. "1.3 M", "500.0 K") for API compatibility.
 * Tools like Homepage parse this as `<number> <single-letter>` (K/M/G/T/P tiers of KB/s).
 * @param kbPerSec total speed in kilobytes per second
 */
export function formatSabnzbdSpeedKbps(kbPerSec: number): string {
    if (!kbPerSec || kbPerSec <= 0) {
        return '0 ';
    }
    const units = ['K', 'M', 'G', 'T', 'P'] as const;
    let n = kbPerSec;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i += 1;
    }
    return `${n.toFixed(1)} ${units[i]}`;
}