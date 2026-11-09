export type LiveTvMode = 'redirect' | 'proxy';

export const isLiveTvMode = (value: unknown): value is LiveTvMode => value === 'redirect' || value === 'proxy';
