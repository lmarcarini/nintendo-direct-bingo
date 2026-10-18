// What the browser remembers about rooms, outside the card: the room being
// played in the URL's `room` param (so a copied link invites, and a reload
// rejoins), and the player's name in localStorage. Loaded at startup, so
// it imports nothing from the room client

const PARAM = "room";
const NAME_KEY = "bingo-player-name";
// The server's rules (protocol.ts), repeated so this stays out of the room
// client. A room in the URL that breaks them is ignored
const ROOM_NAME = /^[a-z0-9-]{3,32}$/;
export const MAX_PLAYER_NAME_LENGTH = 20;

export const readRoomParam = () => {
  const room = new URL(window.location.href).searchParams.get(PARAM)?.toLowerCase();
  return room && ROOM_NAME.test(room) ? room : "";
};

export const writeRoomParam = (room: string) => {
  const url = new URL(window.location.href);
  if (room) url.searchParams.set(PARAM, room);
  else url.searchParams.delete(PARAM);
  window.history.replaceState(null, "", url);
};

// localStorage can be missing or throw (private windows, blocked storage)
export const savedPlayerName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
};

export const savePlayerName = (name: string) => {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Not remembered, which only means typing it again next time
  }
};

// A suggestion that's hard to guess: anyone with a room's name can join it
export const randomRoomName = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `bingo-${Array.from(bytes, (b) => (b % 36).toString(36)).join("")}`;
};
