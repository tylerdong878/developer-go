"use client";

import { eggs, gyms, raids, stops } from "@/content";
import { slots } from "../../base";
import { Egg } from "./Egg";
import { Gym } from "./Gym";
import { PlateLayout } from "./Nameplate";
import { Stop } from "./Stop";
import { WildSpawns } from "./WildSpawns";

/** Every gym, stop, raid and egg at its spot in the base, and the wild Pokémon out on the spawn points. */
export function Objects({ grass }: { grass: string }) {
  return (
    <>
      <PlateLayout />
      <WildSpawns grass={grass} />
      {gyms.map((gym) => {
        const [x, z] = slots[gym.slug];
        return <Gym key={gym.slug} gym={gym} x={x} z={z} />;
      })}
      {raids.map((raid, i) => {
        const [x, z] = slots[raid.slug];
        return <Gym key={raid.slug} raid={raid} x={x} z={z} index={i} />;
      })}
      {stops.map((stop) => {
        const [x, z] = slots[stop.slug];
        return <Stop key={stop.slug} stop={stop} x={x} z={z} />;
      })}
      {eggs.map((egg) => {
        const [x, z] = slots[egg.slug];
        return <Egg key={egg.slug} egg={egg} x={x} z={z} />;
      })}
    </>
  );
}
