import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Story, WrappedStats } from "../types";
import { buildStories } from "../lib/stories";

type Props = {
  stats: WrappedStats;
};

export function StoryDeck({ stats }: Props) {
  const stories = useMemo(() => buildStories(stats), [stats]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const touchStartX = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const story = stories[index];

  function next() {
    setDirection("next");
    setIndex((current) => Math.min(current + 1, stories.length - 1));
  }

  function previous() {
    setDirection("previous");
    setIndex((current) => Math.max(current - 1, 0));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    touchStartX.current = event.clientX;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    if (touchStartX.current === null) return;
    const delta = event.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 42) return;
    if (delta < 0) next();
    if (delta > 0) previous();
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === " ") next();
      if (event.key === "ArrowLeft") previous();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  async function exportPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--cp-bg").trim(),
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = index === stories.length - 1 ? "microsoft-wrapped-share-card.png" : `microsoft-wrapped-story-${index + 1}.png`;
    link.click();
  }

  return (
    <section className="deck" aria-label="Wrapped stories">
      <div className="progress" aria-hidden="true">
        {stories.map((item, itemIndex) => (
          <span className={itemIndex <= index ? "active" : ""} key={item.title} />
        ))}
      </div>

      <WrappedCard
        story={story}
        index={index}
        total={stories.length}
        direction={direction}
        cardRef={cardRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />

      <div className="deckActions">
        <button className="ghost" onClick={previous} disabled={index === 0}>Back</button>
        <button className="primary" onClick={next} disabled={index === stories.length - 1}>Next</button>
        <button className="ghost" onClick={exportPng}>Save card</button>
      </div>
      <p className="deckHint">Swipe. Click. Or use the arrow keys.</p>
    </section>
  );
}

function WrappedCard({
  story,
  index,
  total,
  direction,
  cardRef,
  onPointerDown,
  onPointerUp,
}: {
  story: Story;
  index: number;
  total: number;
  direction: "next" | "previous";
  cardRef: React.RefObject<HTMLDivElement>;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  return (
    <article
      className={`storyCard storyCard-${direction}`}
      key={index}
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="orb orbOne" />
      <div className="orb orbTwo" />
      <div className="orb orbThree" />
      <div className="storyTopline">
        <span>{story.kicker}</span>
        <span>{index + 1}/{total}</span>
      </div>
      <div>
        <div className="storyBadge">{story.badge}</div>
        <h2>{story.title}</h2>
        <div className="storyValue">{story.value}</div>
        <p>{story.body}</p>
      </div>
      {story.collaborator ? (
        <div className="miniStats">
          <span>{story.collaborator.meetings} meetings</span>
          <span>{story.collaborator.mail} mail</span>
          <span>{story.collaborator.chats} Teams</span>
        </div>
      ) : (
        <div className="miniStats">
          <span>Signals only</span>
          <span>No content</span>
          <span>Your data</span>
        </div>
      )}
    </article>
  );
}

