import { createThemes, defaultComponentThemes } from '@tamagui/theme-builder'
import * as Colors from '@tamagui/colors'

const darkPalette = ['hsla(220, 15%, 3%, 1)','hsla(219, 16%, 10%, 1)','hsla(218, 18%, 16%, 1)','hsla(216, 19%, 23%, 1)','hsla(215, 20%, 30%, 1)','hsla(214, 19%, 34%, 1)','hsla(213, 18%, 38%, 1)','hsla(212, 17%, 42%, 1)','hsla(211, 16%, 46%, 1)','hsla(210, 15%, 50%, 1)','hsla(210, 15%, 80%, 1)','hsla(210, 15%, 95%, 1)']
const lightPalette = ['hsla(220, 15%, 98%, 1)','hsla(219, 16%, 91%, 1)','hsla(218, 18%, 84%, 1)','hsla(216, 19%, 77%, 1)','hsla(215, 20%, 70%, 1)','hsla(214, 19%, 66%, 1)','hsla(213, 18%, 62%, 1)','hsla(212, 17%, 58%, 1)','hsla(211, 16%, 54%, 1)','hsla(210, 15%, 50%, 1)','hsla(210, 15%, 20%, 1)','hsla(210, 15%, 10%, 1)']

const lightShadows = {
  shadow1: 'rgba(0,0,0,0.04)',
  shadow2: 'rgba(0,0,0,0.08)',
  shadow3: 'rgba(0,0,0,0.16)',
  shadow4: 'rgba(0,0,0,0.24)',
  shadow5: 'rgba(0,0,0,0.32)',
  shadow6: 'rgba(0,0,0,0.4)',
}

const darkShadows = {
  shadow1: 'rgba(0,0,0,0.2)',
  shadow2: 'rgba(0,0,0,0.3)',
  shadow3: 'rgba(0,0,0,0.4)',
  shadow4: 'rgba(0,0,0,0.5)',
  shadow5: 'rgba(0,0,0,0.6)',
  shadow6: 'rgba(0,0,0,0.7)',
}

// we're adding some example sub-themes for you to show how they are done, "success" "warning", "error":

const builtThemes = createThemes({
  componentThemes: defaultComponentThemes,

  base: {
    palette: {
      dark: darkPalette,
      light: lightPalette,
    },

    extra: {
      light: {
        ...Colors.green,
        ...Colors.red,
        ...Colors.yellow,
        ...lightShadows,
        shadowColor: lightShadows.shadow1,
      },
      dark: {
        ...Colors.greenDark,
        ...Colors.redDark,
        ...Colors.yellowDark,
        ...darkShadows,
        shadowColor: darkShadows.shadow1,
      },
    },
  },

  accent: {
    palette: {
      dark: ['hsla(210, 70%, 30%, 1)','hsla(210, 70%, 35%, 1)','hsla(210, 70%, 40%, 1)','hsla(210, 70%, 45%, 1)','hsla(210, 70%, 50%, 1)','hsla(210, 70%, 52%, 1)','hsla(210, 70%, 54%, 1)','hsla(210, 70%, 56%, 1)','hsla(210, 70%, 58%, 1)','hsla(210, 70%, 60%, 1)','hsla(210, 70%, 80%, 1)','hsla(210, 70%, 95%, 1)'],
      light: ['hsla(210, 70%, 90%, 1)','hsla(210, 70%, 83%, 1)','hsla(210, 70%, 75%, 1)','hsla(210, 70%, 68%, 1)','hsla(210, 70%, 60%, 1)','hsla(210, 70%, 58%, 1)','hsla(210, 70%, 56%, 1)','hsla(210, 70%, 54%, 1)','hsla(210, 70%, 52%, 1)','hsla(210, 70%, 50%, 1)','hsla(210, 70%, 30%, 1)','hsla(210, 70%, 10%, 1)'],
    },
  },

  childrenThemes: {
    warning: {
      palette: {
        dark: Object.values(Colors.yellowDark),
        light: Object.values(Colors.yellow),
      },
    },

    error: {
      palette: {
        dark: Object.values(Colors.redDark),
        light: Object.values(Colors.red),
      },
    },

    success: {
      palette: {
        dark: Object.values(Colors.greenDark),
        light: Object.values(Colors.green),
      },
    },
  },

  // optionally add more, can pass palette or template

  // grandChildrenThemes: {
  //   alt1: {
  //     template: 'alt1',
  //   },
  //   alt2: {
  //     template: 'alt2',
  //   },
  //   surface1: {
  //     template: 'surface1',
  //   },
  //   surface2: {
  //     template: 'surface2',
  //   },
  //   surface3: {
  //     template: 'surface3',
  //   },
  // },
})

export type Themes = typeof builtThemes

// the process.env conditional here is optional but saves web client-side bundle
// size by leaving out themes JS. tamagui automatically hydrates themes from CSS
// back into JS for you, and the bundler plugins set TAMAGUI_ENVIRONMENT. so
// long as you are using the Vite, Next, Webpack plugins this should just work,
// but if not you can just export builtThemes directly as themes:
export const themes: Themes =
  process.env.TAMAGUI_ENVIRONMENT === 'client' &&
  process.env.NODE_ENV === 'production'
    ? ({} as any)
    : (builtThemes as any)
