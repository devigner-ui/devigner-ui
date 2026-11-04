"use client";

import { FlickCardsSlider, type FlickCardsSliderItem } from "devignerui";
import { cn } from "cn";
// Free photos from Unsplash (Unsplash License), ids 1760160741769-c5212246e4c8,
// 1747903239211-ea42ad341368, 1727341552909-559eef4c18f0,
// 1792649660755-802e290d85a4 and 1764144911251-83e6f02de877.
import red from "../assets/flick-cards/1.jpg";
import green from "../assets/flick-cards/2.jpg";
import mono from "../assets/flick-cards/3.jpg";
import blue from "../assets/flick-cards/4.jpg";
import night from "../assets/flick-cards/5.jpg";

const PHOTOS = [
  [red, "Ember", "Someone seated against a red wall, face blurred by motion"],
  [green, "Drift", "A figure in a pale suit mid-turn against a green backdrop"],
  [mono, "Grain", "A black and white portrait smeared sideways by a long exposure"],
  [blue, "Tide", "A face lost in blue light and haze"],
  [night, "Noir", "A woman in a dark room, her hands blurred, string lights behind"],
] as const;

export const FLICK_CARDS_SIZES = ["sm", "md", "lg"] as const;
export type FlickCardsSize = (typeof FLICK_CARDS_SIZES)[number];
/** Deck width per size; the fan reaches half a card past each edge. */
export const FLICK_CARDS_WIDTH: Record<FlickCardsSize, string> = { sm: "w-56", md: "w-72", lg: "w-96" };
const ROOM: Record<FlickCardsSize, string> = { sm: "px-28", md: "px-36", lg: "px-48" };

/** What the docs Settings panel drives; the gallery demo uses the defaults. */
export const FLICK_CARDS_DEFAULTS = {
  size: "md" as FlickCardsSize,
  action: true,
};
export type FlickCardsConfig = typeof FLICK_CARDS_DEFAULTS;

export const flickCardsItems = (action: boolean): FlickCardsSliderItem[] =>
  PHOTOS.map(([photo, title, alt]) => ({
    image: photo.src,
    alt,
    title,
    action: action ? { label: "View collection" } : undefined,
  }));

export default function FlickCardsSliderDemo(props: Partial<FlickCardsConfig>) {
  const { size, action } = { ...FLICK_CARDS_DEFAULTS, ...props };
  return (
    // Room for the side cards, so the stage fits the whole fan.
    <div className={cn("pb-1", ROOM[size])}>
      <FlickCardsSlider
        aria-label="Collections"
        items={flickCardsItems(action)}
        className={FLICK_CARDS_WIDTH[size]}
      />
    </div>
  );
}
