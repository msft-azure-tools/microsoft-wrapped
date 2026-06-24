import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Story, WrappedStats } from "../types";
import { buildStories } from "../lib/stories";

type Props = {
  stats: WrappedStats;
};

export function StoryDeck({ stats }: Props) {
  const stories = useMemo(() => buildStories(stats), [stats]);
  const [index, setIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const story = stories[index];

  function next() {
    setIndex((current) => Math.min(current + 1, stories.length - 1));
  }

  function previous() {
    setIndex((current) => Math.max(current - 1, 0));
  }

  async function exportPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--cp-bg").trim(),
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `teams-outlook-wrapped-${index + 1}.png`;
    link.click();
  }

  return (
    <section className="deck" aria-label="Wrapped stories">
      <div className="progress" aria-hidden="true">
        {stories.map((item, itemIndex) => (
          <span className={itemIndex <= index ? "active" : ""} key={item.title} />
        ))}
      </div>

      <WrappedCard story={story} index={index} total={stories.length} cardRef={cardRef} />

      <div className="deckActions">
        <button onClick={previous} disabled={index === 0}>Tillbaka</button>
        <button className="primary" onClick={next} disabled={index === stories.length - 1}>Nästa kort</button>
        <button onClick={exportPng}>Exportera PNG</button>
      </div>
    </section>
  );
}

function WrappedCard({
  story,
  index,
  total,
  cardRef,
}: {
  story: Story;
  index: number;
  total: number;
  cardRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="storyCard" ref={cardRef}>
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
          <span>{story.collaborator.meetings} möten</span>
          <span>{story.collaborator.mail} mail</span>
          <span>{story.collaborator.chats} Teams</span>
        </div>
      ) : (
        <div className="miniStats">
          <span>Metadata only</span>
          <span>No content</span>
          <span>/me scoped</span>
        </div>
      )}
    </div>
  );
}

