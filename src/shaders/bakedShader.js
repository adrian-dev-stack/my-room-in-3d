export const bakedVertexShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;
    gl_Position = projectionPosition;

    vUv = uv;
}
`;

export const bakedFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uBakedDayTexture;
uniform sampler2D uBakedNightTexture;
uniform sampler2D uBakedNeutralTexture;
uniform sampler2D uLightMapTexture;

uniform float uNightMix;
uniform float uNeutralMix;

uniform vec3 uLightTvColor;
uniform float uLightTvStrength;

uniform vec3 uLightDeskColor;
uniform float uLightDeskStrength;

uniform vec3 uLightPcColor;
uniform float uLightPcStrength;

varying vec2 vUv;

// Lighten blend function (glsl-blend/lighten)
vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
    vec3 lightened = max(base, blend);
    return mix(base, lightened, opacity);
}

void main()
{
    vec3 bakedDayColor = texture2D(uBakedDayTexture, vUv).rgb;
    vec3 bakedNightColor = texture2D(uBakedNightTexture, vUv).rgb;
    vec3 bakedNeutralColor = texture2D(uBakedNeutralTexture, vUv).rgb;
    
    vec3 bakedColor = mix(mix(bakedDayColor, bakedNightColor, uNightMix), bakedNeutralColor, uNeutralMix);
    vec3 lightMapColor = texture2D(uLightMapTexture, vUv).rgb;

    // TV light (Red channel)
    float lightTvStrength = lightMapColor.r * uLightTvStrength;
    bakedColor = blendLighten(bakedColor, uLightTvColor, lightTvStrength);

    // PC light (Blue channel)
    float lightPcStrength = lightMapColor.b * uLightPcStrength;
    bakedColor = blendLighten(bakedColor, uLightPcColor, lightPcStrength);

    // Desk light (Green channel)
    float lightDeskStrength = lightMapColor.g * uLightDeskStrength;
    bakedColor = blendLighten(bakedColor, uLightDeskColor, lightDeskStrength);

    gl_FragColor = vec4(bakedColor, 1.0);
}
`;
