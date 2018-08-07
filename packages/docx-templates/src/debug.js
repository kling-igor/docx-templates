// Cannot be covered by Flow! The purpose of this file is to isolate
// an optional dependency, only used in development (so that Flow
// doesn't throw errors when processing users' projects)
// import { mainStory, chalk, addListener } from 'storyboard';
// import consoleListener from 'storyboard-listener-console';

// addListener(consoleListener);


const chalk = {
  bold: x => x,
  green: () => chalk,
  cyan: () => chalk,
  magenta: () => chalk,
}

const mainStory = {
  debug: x => console.log(x)
}

export { mainStory, chalk };
