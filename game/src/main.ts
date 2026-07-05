import Phaser from "phaser";
import { gameConfig } from "./config";
import { initAudio } from "./audio/AudioManager";

const game = new Phaser.Game(gameConfig);
initAudio(game);
