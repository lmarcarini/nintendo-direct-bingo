import type { RefObject } from "react";
import { useNotice } from "../../hooks/useNotice";
import { useMessages } from "../../i18n/MessagesContext";
import { copyImage, copyLink } from "../../lib/clipboard";
import { screenshot } from "../../lib/screenshot";
import { canShare, share } from "../../lib/share";
import { Icon } from "../ui/Icon";

// Copy or share the card (as a screenshot of `cardRef`) or its link, with
// a short notice saying how it went
export function ShareActions({
  cardRef,
  title,
}: {
  cardRef: RefObject<HTMLElement | null>;
  title: string;
}) {
  const t = useMessages();
  const { notice, notify } = useNotice();
  const cardImage = () => screenshot(cardRef.current!);

  return (
    <div className="button-group">
      <button
        type="button"
        onClick={() =>
          notify(copyImage(cardImage()), t.imageCopied, t.imageCopyFailed)
        }
        className="button button-secondary"
      >
        <Icon name="image" />
        {t.copyImage}
      </button>
      <button
        type="button"
        onClick={() => notify(copyLink(), t.linkCopied, t.linkCopyFailed)}
        className="button button-secondary"
      >
        <Icon name="link" />
        {t.copyLink}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() =>
            notify(share(title, cardImage()), t.shared, t.shareFailed)
          }
          className="button button-secondary"
        >
          <Icon name="share" />
          {t.share}
        </button>
      )}
      <span role="status" className="share-notice">
        {notice && (
          <>
            <Icon name={notice.ok ? "check" : "alert"} />
            {notice.text}
          </>
        )}
      </span>
    </div>
  );
}
