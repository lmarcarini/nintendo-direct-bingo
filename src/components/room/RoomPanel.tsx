import { useState, type FormEvent } from "react";
import { DEFAULT_CARD, MAX_SQUARES, type Card } from "../../card/card";
import { useMessages } from "../../i18n/MessagesContext";
import {
  MAX_PLAYER_NAME_LENGTH,
  randomRoomName,
  readRoomParam,
  savedPlayerName,
} from "../../room/remembered";
import type { RoomState } from "../../room/session";

const hasContent = (card: Card) =>
  card.values.slice(0, MAX_SQUARES).some(Boolean) ||
  card.marks !== 0 ||
  card.title !== DEFAULT_CARD.title;

// Join a room by name, or see who's in it and leave. Shown in edit and view
// mode, since marking together is the point
export function RoomPanel({
  state,
  card,
  onJoin,
  onLeave,
}: {
  state: RoomState;
  card: Card;
  onJoin: (room: string, name: string) => void;
  onLeave: () => void;
}) {
  const t = useMessages();
  // A link with a room in it was an invitation: open, with the room filled in
  const [invitedTo] = useState(readRoomParam);
  const [room, setRoom] = useState(() => invitedTo || randomRoomName());
  const [name, setName] = useState(savedPlayerName);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const roomName = room.trim().toLowerCase();
    // Joining a room that exists replaces the card, and the URL is its only
    // copy. Following an invitation, that's what was asked for
    if (roomName !== invitedTo && hasContent(card) && !window.confirm(t.confirmJoin))
      return;
    onJoin(roomName, name.trim());
  };

  return (
    <details className="options room" open={Boolean(invitedTo) || undefined}>
      <summary className="options-summary">
        <span className="room-summary">
          {t.playTogether}
          {state.status !== "idle" && (
            <span className={`room-dot room-dot--${state.status}`} aria-hidden="true" />
          )}
        </span>
      </summary>
      <div className="options-body">
        {state.status === "idle" ? (
          <form className="room-form" onSubmit={onSubmit}>
            <label className="room-field">
              <span className="room-label">{t.roomName}</span>
              <input
                className="room-input"
                value={room}
                onChange={(e) => setRoom(e.currentTarget.value)}
                required
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9\-]{3,32}"
                autoCapitalize="off"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="room-name-hint"
              />
              <span id="room-name-hint" className="room-hint">
                {t.roomNameHint}
              </span>
            </label>
            <label className="room-field">
              <span className="room-label">{t.playerName}</span>
              <input
                className="room-input"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                required
                maxLength={MAX_PLAYER_NAME_LENGTH}
                autoComplete="nickname"
              />
            </label>
            <p className="room-hint">{t.joinHint}</p>
            {state.error && (
              <p className="room-error" role="alert">
                {t.roomErrors[state.error]}
              </p>
            )}
            <div>
              <button type="submit" className="button button-primary">
                {t.joinRoom}
              </button>
            </div>
          </form>
        ) : (
          <div className="room-status">
            <p role="status">
              {state.status === "joined"
                ? t.inRoom(state.room)
                : state.status === "connecting"
                  ? t.connecting
                  : t.reconnecting}
            </p>
            {state.status === "joined" && (
              <>
                <p className="room-label">{t.players}</p>
                <ul className="room-players">
                  {state.players.map((player) => (
                    <li key={player.id}>
                      {player.name}
                      {player.id === state.you && (
                        <span className="room-you"> ({t.you})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div>
              <button type="button" className="button button-secondary" onClick={onLeave}>
                {t.leaveRoom}
              </button>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
