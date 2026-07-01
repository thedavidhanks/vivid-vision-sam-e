import Phaser from "phaser";

// A single app-wide event emitter so gameplay and UI scenes stay decoupled:
// gameplay emits, HUD/audio subscribe. Mirrors the "watch and advise, don't own"
// philosophy from the vivid-vision doc.
export const EventBus = new Phaser.Events.EventEmitter();
