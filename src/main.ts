import './styles.css';
import { createApp } from './ui/app';
import { homeScreen, learnScreen, lessonScreen, arcadeScreen } from './ui/menus';
import { gameScreen } from './ui/game';
import { freePlayScreen } from './ui/freeplay';
import { settingsScreen } from './ui/settings';

createApp(document.getElementById('app')!, {
  home: homeScreen,
  learn: learnScreen,
  lesson: lessonScreen,
  play: gameScreen,
  arcade: arcadeScreen,
  free: freePlayScreen,
  settings: settingsScreen,
});
