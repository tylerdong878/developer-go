import { ShaderChunk } from "three";

/*
 * The town's lighting, the way the best stylized worlds do it (bruno-simon.com,
 * Coastal World, notes/research/gfx-references.md): one sun and no fill. A
 * face toward the sun shows its own color; a face away from it, or in a cast
 * shadow, shows its color times a cool tint, never gray. The edge between
 * the two is soft, and low faces near the ground pick up the ground's color.
 *
 * The hemisphere light carries the two colors (sky = shadow tint, ground =
 * bounce), so day and night change them with no recompiles. Only Lambert
 * materials are patched: the town, trees, people, props. Pokémon (toon) keep
 * their own shading.
 */

let patched = false;

/** Patch three's shader chunks once, before anything compiles. */
export function patchLook() {
  if (patched) return;
  patched = true;
  ShaderChunk.lights_pars_begin += "\nfloat sunLit = 1.0;\n";
  ShaderChunk.lights_fragment_begin = ShaderChunk.lights_fragment_begin.replace(
    /directLight\.color \*= (\( directLight\.visible && receiveShadow \) \? getShadow\( directionalShadowMap\[ i \][^;]*;)/,
    "sunLit = $1\n\t\tdirectLight.color *= sunLit;",
  );
  ShaderChunk.opaque_fragment =
    /* glsl */ `
#if defined( LAMBERT ) && NUM_DIR_LIGHTS > 0 && NUM_HEMI_LIGHTS > 0
{
  // soft terminator, plus the cast shadow
  float core = smoothstep( 1.0, -0.25, dot( normal, directionalLights[ 0 ].direction ) );
  float shade = max( core, 1.0 - sunLit );
  vec3 lit = diffuseColor.rgb * directionalLights[ 0 ].color;
  vec3 dark = diffuseColor.rgb * hemisphereLights[ 0 ].skyColor;
  // ground bounce on faces that point down and sit low
  vec3 wn = ( vec4( normal, 0.0 ) * viewMatrix ).xyz;
  vec3 wp = cameraPosition + ( vec4( -vViewPosition, 0.0 ) * viewMatrix ).xyz;
  float low = pow( max( 0.0, 1.5 - max( 0.0, wp.y ) ) / 1.5, 2.0 );
  float bounce = smoothstep( -1.0, 1.0, -wn.y ) * low;
  outgoingLight = mix( mix( lit, dark, shade ), diffuseColor.rgb * hemisphereLights[ 0 ].groundColor, bounce * 0.35 ) + totalEmissiveRadiance;
}
#endif
` + ShaderChunk.opaque_fragment;
}
