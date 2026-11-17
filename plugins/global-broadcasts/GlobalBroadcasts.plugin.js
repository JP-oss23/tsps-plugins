const { itemValue } = require("../interface/ValueWarning");

const LEVEL_99 = "GlobalBroadcasts:level99Message";
const COLLECTION_LOG = "GlobalBroadcasts:collectionLogMessage";
const PET = "GlobalBroadcasts:petMessage";
const VALUABLE_DROP = "GlobalBroadcasts:valuableDropMessage";
const FIRST_JOIN = "GlobalBroadcasts:firstJoinMessage";
const DROP_MIN_GP = "GlobalBroadcasts:valuableDropMinGp";
const CHATBOX_TRANSPARENCY_VARBIT = 4608;

const config = {
  [LEVEL_99]: {
    type: "string", label: "Level 99 message",
    default: "{player} has reached level 99 in {skill}!",
    help: "Supports {player} and {skill}. Leave blank to disable.",
  },
  [COLLECTION_LOG]: {
    type: "string", label: "Collection Log message",
    default: "{player} has unlocked a new Collection Log slot: {item}!",
    help: "Supports {player} and {item}. Leave blank to disable.",
  },
  [PET]: {
    type: "string", label: "Pet message",
    default: "{player} has obtained a pet: {item}!",
    help: "Supports {player} and {item}. Leave blank to disable.",
  },
  [VALUABLE_DROP]: {
    type: "string", label: "Valuable drop message",
    default: "{player} received {quantity} × {item}, worth {value} GP!",
    help: "Supports {player}, {item}, {quantity} and {value}. Leave blank to disable.",
  },
  [FIRST_JOIN]: {
    type: "string", label: "First join message",
    default: "Welcome {player} to the world!",
    help: "Supports {player}. Leave blank to disable.",
  },
  [DROP_MIN_GP]: {
    type: "number", label: "Valuable drop threshold (GP)", default: 1000000, integer: true, min: 0,
    help: "A stack's Grand Exchange guide value must exceed this amount.",
  },
};

let pluginApi;

function broadcast(template, player, fields = {}) {
  if (typeof template !== "string" || !template.trim() || player.isPlayerBot?.()) return;

  const name = player.getDisplayName();
  const { ChatType, World } = pluginApi.core;
  World.forEachNetworkPlayer((recipient) => {
    const sender = recipient.getPacketSender();
    const nameColour = sender.getVarbit(CHATBOX_TRANSPARENCY_VARBIT) === 1 ? "ff3045" : "e00a19";
    const values = { player: `<col=${nameColour}>${name}</col>`, ...fields };
    const message = template.replace(/\{([a-z]+)\}/g, (token, field) => Object.hasOwn(values, field) ? values[field] : token);
    sender.sendTypedMessage(ChatType.BROADCAST, message);
  });
}

function levelUp({ player, skill, oldLevel, newLevel }) {
  if (oldLevel < 99 && newLevel >= 99) {
    const template = pluginApi.getPluginConfig(LEVEL_99) ?? config[LEVEL_99].default;
    broadcast(template, player, { skill: skill.getName() });
  }
}

function itemName(itemId) {
  return pluginApi.core.ItemDefinition.forId(itemId).getName();
}

function collectionLog({ player, itemId }) {
  const template = pluginApi.getPluginConfig(COLLECTION_LOG) ?? config[COLLECTION_LOG].default;
  broadcast(template, player, { item: itemName(itemId) });
}

function petObtained({ player, itemId }) {
  const template = pluginApi.getPluginConfig(PET) ?? config[PET].default;
  broadcast(template, player, { item: itemName(itemId) });
}

function firstJoin({ player, isNewAccount }) {
  if (isNewAccount === true) {
    const template = pluginApi.getPluginConfig(FIRST_JOIN) ?? config[FIRST_JOIN].default;
    queueMicrotask(() => broadcast(template, player));
  }
}

function receivedDrops({ player, drops }) {
  const minimum = pluginApi.getPluginConfig(DROP_MIN_GP) ?? config[DROP_MIN_GP].default;
  const template = pluginApi.getPluginConfig(VALUABLE_DROP) ?? config[VALUABLE_DROP].default;
  for (const { itemId, amount } of drops ?? []) {
    if (!Number.isInteger(itemId) || !Number.isSafeInteger(amount) || amount <= 0) continue;
    const value = itemValue(pluginApi.core, itemId, amount);
    if (!(value > minimum)) continue;
    broadcast(template, player, {
      item: itemName(itemId),
      quantity: amount.toLocaleString("en-GB"),
      value: value.toLocaleString("en-GB"),
    });
  }
}

function rolledDrops(event) {
  // Other roll listeners can edit the drops, including removing pets before placement.
  if (event.npc) queueMicrotask(() => receivedDrops(event));
}

module.exports = {
  name: "GlobalBroadcasts",
  description: "World chat announcements for level 99, new Collection Log slots, pets, valuable drops and first joins.",
  config,
  register(api) {
    pluginApi = api;
    api.onPlayerLevelUp(levelUp);
    api.onPlayerLogin(firstJoin);
    api.onCustomEvent("collection-log:new-item", collectionLog);
    api.onCustomEvent("pets:obtained", petObtained);
    api.onCustomEvent("npc-drops:roll", rolledDrops);
    api.onCustomEvent("drops:received", receivedDrops);
  },
};