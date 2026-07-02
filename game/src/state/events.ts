// Typed event names shared between gameplay (GameScene) and UI (HUDScene).
export const EV = {
  moneyChanged: "money:changed",
  powerChanged: "power:changed",
  powerToggled: "power:toggled",
  reputationChanged: "reputation:changed",
  waveChanged: "wave:changed",
  brownout: "power:brownout",
  personDelivered: "person:delivered",
  personRageQuit: "person:ragequit",
  waveCleared: "wave:cleared",
  gameOver: "game:over",
  gameWon: "game:won",
} as const;
