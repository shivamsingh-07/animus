export const SUBTITLES_OFF = -1;
export const QUALITY_AUTO = -1;

export const IDLE_HIDE_DELAY_MS = 3000;

/** Throughput-led ABR so quality ramps to the highest sustainable bitrate. */
export const ABR_SETTINGS = {
  streaming: {
    abr: {
      ABRStrategy: 'abrThroughput',
      additionalAbrRules: {
        switchHistoryRule: false,
        droppedFramesRule: false,
        abandonRequestsRule: false,
      },
    },
  },
} as const;
