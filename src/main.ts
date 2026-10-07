import './styles.css';
import { createApp } from './ui/app';
import { homeScreen, learnScreen, lessonScreen, arcadeScreen } from './ui/menus';
import { gameScreen } from './ui/game';
import { freePlayScreen } from './ui/freeplay';
import { settingsScreen } from './ui/settings';

// iOS Safari ignores user-scalable=no for pinch gestures; block them explicitly.
for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });

createApp(document.getElementById('app')!, {
  home: homeScreen,
  learn: learnScreen,
  lesson: lessonScreen,
  play: gameScreen,
  arcade: arcadeScreen,
  free: freePlayScreen,
  settings: settingsScreen,
});
