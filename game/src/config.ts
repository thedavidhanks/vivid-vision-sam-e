import Phaser from "phaser";
import { TUNING } from "./data/tuning";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { HUDScene } from "./scenes/HUDScene";
import { ShopScene } from "./scenes/ShopScene";
import { ManualScene } from "./scenes/ManualScene";
import { EndScene } from "./scenes/EndScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#0d1117",
  width: TUNING.board.width,
  height: TUNING.board.height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, HUDScene, ShopScene, ManualScene, EndScene],
};
