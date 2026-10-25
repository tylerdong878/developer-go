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
  // Fog by true distance, so its edge doesn't swing as the camera turns. It's
  // measured per pixel: the ground is a few huge triangles, and a distance
  // worked out at their far corners and blended across would fog the lot.
  ShaderChunk.fog_pars_vertex = ShaderChunk.fog_pars_vertex.replace("varying float vFogDepth;", "varying vec3 vFogPosition;");
  ShaderChunk.fog_vertex = ShaderChunk.fog_vertex.replace("vFogDepth = - mvPosition.z;", "vFogPosition = mvPosition.xyz;");
  ShaderChunk.fog_pars_fragment = ShaderChunk.fog_pars_fragment.replace("varying float vFogDepth;", "varying vec3 vFogPosition;");
  ShaderChunk.fog_fragment = ShaderChunk.fog_fragment.replace("#ifdef USE_FOG", "#ifdef USE_FOG\n\tfloat vFogDepth = length( vFogPosition );");
  // A building in the way used to dissolve into random static (three's alpha hash). Now it's a fine,
  // even 4x4 screen a pixel at a time, and what's left is one pale frosted tint, so it reads as a ghost of the
  // building you can see through (notes/research/town-polish.md 1).
  ShaderChunk.alphahash_fragment = /* glsl */ `
#ifdef USE_ALPHAHASH
  if ( diffuseColor.a < 0.999 ) {
    vec2 cell = floor( gl_FragCoord.xy );
    vec2 m = mod( cell, 4.0 );
    // a 4x4 Bayer matrix, built from two 2x2 ones
    vec2 m2 = mod( m, 2.0 );
    vec2 m4 = floor( m / 2.0 );
    float b2 = m2.x * 2.0 + abs( m2.x - m2.y ) - 0.0;
    float b4 = m4.x * 2.0 + abs( m4.x - m4.y );
    float bayer = ( ( 4.0 * b2 + b4 ) + 0.5 ) / 16.0;
    if ( diffuseColor.a < bayer ) discard;
    #ifdef LAMBERT
    diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.90, 0.94, 0.98 ), ( 1.0 - diffuseColor.a ) * 0.6 );
    #endif
  }
#endif
`;
  ShaderChunk.opaque_fragment =
    /* glsl */ `
#if defined( LAMBERT ) && NUM_DIR_LIGHTS > 0 && NUM_HEMI_LIGHTS > 0
{
  // soft terminator, plus the cast shadow
  float core = smoothstep( 0.75, -0.3, dot( normal, directionalLights[ 0 ].direction ) );
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
