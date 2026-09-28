"use client";

import { gyms, raids, stops } from "@/content";
import { slots } from "../../base";
import { Gym } from "./Gym";
import { PlateLayout } from "./Nameplate";
import { Stop } from "./Stop";

/** Every gym, stop, and raid, each at its spot in the base. */
export function Objects() {
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
    </>
  );
}
