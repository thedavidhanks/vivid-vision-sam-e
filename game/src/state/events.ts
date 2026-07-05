// Typed event names shared between gameplay (GameScene) and UI (HUDScene).
export const EV = {
  moneyChanged: "money:changed",
  powerChanged: "power:changed",
  powerToggled: "power:toggled",
  reputationChanged: "reputation:changed",
  waveChanged: "wave:changed",
  // Fired when the player actually gains control of a wave — immediately for
  // normal waves, or when the tutorial's START button is clicked on waves 1-3.
  // This is the "class bell rings" moment (distinct from waveChanged, which
  // fires while a tutorial may still be paused over the board).
  classInSession: "class:insession",
  brownout: "power:brownout",
  personDelivered: "person:delivered",
  personRageQuit: "person:ragequit",
  waveCleared: "wave:cleared",
  gameOver: "game:over",
  gameWon: "game:won",
} as const;
