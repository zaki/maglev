#version 330 core

layout (location = 0) out vec4 FragColor;

uniform float _Time;
uniform vec2 _Resolution;
uniform vec4 _FFT;

#define Time _Time

#define PI acos(-1)
#define MAX_MARCH 200
#define MAX_DIST 400.0
#define MIN_DIST 0.001
#define BPM 123.0

vec2 g = vec2(0.0);

float sphere(vec3 p, vec4 s)
{
    return length(p - s.xyz) - s.w;
}

float box(vec3 pos, vec3 dim)
{
    vec3 d = abs(pos) - dim;

    return length(max(d, 0.0))
         + min(max(d.x, max(d.y, d.z)), 0.0);
}

mat2 rot(float a)
{
    float sa = sin(a);
    float ca = cos(a);

    return mat2(ca, sa, -sa, ca);
}

float smin(float d1, float d2, float k)
{
  float h = clamp(0.5 + 0.5 * (d1 - d2) / k, 0.0, 1.0);
  return mix(d1, d2, h) - k * h * (1.0 - h);
}

vec3 rep(vec3 p, vec3 r)
{
    return mod(p, r) - 0.5 * r;
}

vec3 fog(vec3 col, vec2 dd)
{
    float f = 1.0 - exp(MAX_DIST - dd.x);
    vec3 fc = vec3(0.45, 0.3, 0.66);

    return mix(col, fc, f);
}

float beat()
{
    float pw = _FFT.x;

    float b = 600.0 / BPM;
    float s = mod(Time, b) / b;
    return smoothstep(0.5, 1.0, pw) * 2.0;
}

float rnd(float t)
{
    return fract(sin(t * 2838.237) * 237.1236);
}

float curve(float t, float d)
{
    float g = t / d;

    return mix(rnd(floor(g)), rnd(floor(g) + 1.0), pow(smoothstep(0.0, 1.0, fract(g)), 10.0));
}

vec3 offset(vec3 pos)
{
    vec3 off = vec3(0.0, 0.0, 0.0);

    off.x += curve(pos.z / 20.0, 10.0) * 3.0 * smoothstep(0.0, 1.0, _Time - 15.0);
    off.y += curve(pos.z / 40.0, 10.0) * 4.0 * smoothstep(0.0, 1.0, _Time - 15.0);
    return off;
}

float bend()
{
    return smoothstep(0.0, 1.0, clamp(_Time - 14.5, 0.0, 1.0));
}

float lll()
{
    return smoothstep(0.9, 1.0, clamp(_Time - 14.5, 0.0, 1.0)) * -1.0;
}

float rail(vec3 pos)
{
    vec3 rep = vec3(24.6, 15.4, 10.0);
    vec2 r = vec2(sin(pos.z / 40.0) * -0.6 * cos(Time * 10), sin(pos.z / 55.0) * 1.0 * cos(Time));
    float d = MAX_DIST;
    vec3 off = vec3(-11.0, 9.0, 0.0);

    for (int i = 0; i < 3; ++i)
    {
        vec3 p = pos + off + vec3(sin(i * Time) * 0.16 * i, cos(i * Time) * 0.7 * i, 0);
        p.yx += r * bend();
        p = mod(p, rep) - 0.5*rep;
        p += offset(pos) * 0.3 * i;

        float s = sin(_Time * 0.5) * 0.03 + _FFT.x * 0.9;
        float b = box(p, vec3(0.3 + s, 0.3 + s, 5.2));

        d = smin(d, b, 0.6);
    }

    g.x += 0.2 / (1.3 + pow(abs(d), 2));

    return d;
}

float lights(vec3 pos)
{
    vec2 r = vec2(sin(pos.z / 40.0) * 2.0, sin(pos.z / 55.0) * 3.0);
    vec3 rep = vec3(12.3, 15.4, 340.0);
    float d = MAX_DIST;
    vec3 off = vec3(13.0, 1.0, 0.0);

    vec3 p = pos + off;
    p.yx += r * bend();
    p = mod(p, rep) - 0.5*rep;
    p += offset(pos);
    d = sphere(p, vec4(0.1));

    g.y += 7.3 / (0.1 + pow(abs(d), 2));

    return MAX_DIST;
}

float ll(vec3 pos)
{
    vec3 rep = vec3(24.6, 15.4, 40.0);
    float r = -sin(pos.z / 40.0);
    float d = MAX_DIST;
    vec3 off = vec3(-11.0, 9.0, lll() * _Time * 300);

    vec3 p = pos + off;
    p.z += r * bend();
    p = mod(p, rep) - 0.5*rep;
    p += offset(pos);

    d = sphere(p, vec4(0.2));
    g.y += 1.7 / (5.1 + pow(abs(d), 2));

    return MAX_DIST;
}

float guard(vec3 pos)
{
    vec2 r = vec2(sin(pos.z / 40.0) * 2.0, sin(pos.z / 55.0) * 3.0) * bend();
    vec3 rep = vec3(12.3, 15.4, 10.0);
    vec3 p1 = pos;
    vec3 p2 = pos + vec3(0.0, 2.0, 5.5);
    vec3 p3 = pos + vec3(0.0, -2.0, 0.0);
    vec3 p4 = pos + vec3(0.0, -2.3, 0.0);
    vec3 p5 = pos + vec3(0.0, -2.3, 0.0);

    p1.yx += r;
    p1 = mod(p1, rep) - 0.5*rep;
    p1 += offset(pos);

    p2.yx += r;
    p2 = mod(p2, rep) - 0.5*rep;
    p2 += offset(pos);

    p3.yx += r;
    p3 = mod(p3, rep) - 0.5*rep;
    p3 += offset(pos);

    p4.yx += r;
    p4 = mod(p4, rep) - 0.5*rep;
    p4 += offset(pos);

    p5.yx += r;
    p5 = mod(p5, rep) - 0.5*rep;
    p5 += offset(pos);

    float b1 = box(p1, vec3(0.3, 1.6, 3.0));
    float b2 = box(p2, vec3(0.3, 0.8, 5.0));
    float b3 = box(p3, vec3(0.3, 0.8, 5.0));
    float b4 = box(p4, vec3(10.3, 0.2, 0.2));
    float b5 = box(p5, vec3(0.3, 10.2, 0.2));

    return min(min(min(min(b1, b2), b3), b4), b5);
}

float sdf(vec3 pos)
{
    return  min(
                min(
                    min(guard(pos), rail(pos)),
                    lights(pos)),
                ll(pos));
}

vec3 march(vec3 pos, vec3 ray)
{
    float d = 0.0;
    int mi = 0;
    int mat = 0;

    for(mi = 0; mi < MAX_MARCH; ++mi)
    {
        vec3 r = pos + ray * d;
        float s = sdf(r);
        d += s;
        if (s < MIN_DIST) break;

        if (d > MAX_DIST)
        {
            mat = 1;
            break;
        }
    }

    float m = float(mi);
    return vec3(d, m, mat);
}

vec3 getNormal(vec3 pos)
{
    float d = sdf(pos);
    vec2 offset = vec2(.01, 0);
    
    vec3 n = d - vec3(
        sdf(pos - offset.xyy),
        sdf(pos - offset.yxy),
        sdf(pos - offset.yyx));
    
    return normalize(n);
}

vec3 campos(float time)
{
    vec3 cp = vec3(0.0, 5.0, time * 100.0);
    return cp - offset(cp);
}

vec3 color(vec2 uv, vec3 px, vec3 normal)
{
    vec3 lightPos = normalize(vec3(10.0, 7.0, 5.0));

    vec3 col = vec3(0.5, 0.1, 0.1) * pow(1.0 - px.x / MAX_DIST, 1.7);
    col += dot(lightPos, normal) * vec3(0.1, 0.1, 0.1);
    if (px.z == 1.0) col = vec3(0.3, 0.3, 0.3);

    vec3 fog = vec3(0.2, 0.5, 0.9) * pow(px.x / MAX_DIST, 0.3);

    if (px.z == 0)
    {
        col *= vec3(0.6, 0.3, 0.1);
    }

    col += mix(col, vec3(1.0, 0.6, 0.4), g.x * 0.04);
    col += mix(col, vec3(0.9, 0.9, 0.9), g.y * 0.04);

    return mix(col, fog, px.x / MAX_DIST);
}

void main()
{
    vec2 uv = (gl_FragCoord.xy - 0.5 * _Resolution.xy) / _Resolution.y;

    vec3 camPos = campos(Time);
    float fov = 1.0 + (1.0 * (1.0 - bend())) + curve(_Time * 2.0, 10.0) * bend();
    vec3 rayDir = normalize(vec3(uv.x, uv.y, fov));

    vec3 dd = march(camPos, rayDir);

    vec3 n = getNormal(camPos + dd.x * rayDir);
    vec3 col = color(uv, dd, n);

    col *= vec3(0.8, 0.8, 0.8) * (1.0 - length(uv));

    FragColor = vec4(col, 1.0);
}
