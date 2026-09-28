"use client";

import { eggs, gyms, raids, spawns, stops } from "@/content";
import { slots } from "../../base";
import { Egg } from "./Egg";
import { Gym } from "./Gym";
import { PlateLayout } from "./Nameplate";
import { Spawn } from "./Spawn";
import { Stop } from "./Stop";

/** Every gym, stop, raid, wild Pokémon, and egg, each at its spot in the base. */
export function Objects({ grass }: { grass: string }) {
  return (
    <>
      <PlateLayout />
      {gyms.map((gym) => {
        const [x, z] = slots[gym.slug];
        return <Gym key={gym.slug} gym={gym} x={x} z={z} />;
      })}
      {raids.map((raid) => {
        const [x, z] = slots[raid.slug];
        return <Gym key={raid.slug} raid={raid} x={x} z={z} />;
      })}
      {stops.map((stop) => {
        const [x, z] = slots[stop.slug];
        return <Stop key={stop.slug} stop={stop} x={x} z={z} />;
      })}
      {spawns.map((spawn) => {
        const [x, z] = slots[spawn.slug];
        return <Spawn key={spawn.slug} spawn={spawn} x={x} z={z} grass={grass} />;
      })}
      {eggs.map((egg) => {
        const [x, z] = slots[egg.slug];
        return <Egg key={egg.slug} egg={egg} x={x} z={z} />;
      })}
    </>
  );
}
