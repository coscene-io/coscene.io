import * as THREE from 'three'
import { STORY_GLSL as G } from './particle-story-clock'

export type ParticleTransfer = ReturnType<typeof createParticleTransfer>

/** One identity per scene particle: sphere → sentences → task → copy / chart. */
export function createParticleTransfer(count: number) {
  const geometry = new THREE.BufferGeometry()
  for (const name of ['position', 'aSource', 'aFirst', 'aSecond', 'aTaskStart', 'aTaskEnd', 'aFinal', 'aNativeColor', 'aFinalColor']) {
    geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  }
  geometry.setAttribute('aMotion', new THREE.BufferAttribute(new Float32Array(count * 4), 4))
  geometry.setAttribute('aStyle', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  geometry.setAttribute('aOptics', new THREE.BufferAttribute(new Float32Array(count * 2), 2))
  const packed: Record<string, [string, number]> = { aSeed: ['aMotion', 0], aRelease: ['aMotion', 1], aLane: ['aMotion', 2], aKind: ['aMotion', 3], aParameter: ['aStyle', 0], aStrength: ['aStyle', 1], aAttachment: ['aStyle', 2], aSourceWeight: ['aOptics', 0], aSourceScale: ['aOptics', 1] }
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: {
      uUnits: { value: 0 }, uPixelRatio: { value: 1 },
      uCopyCenter: { value: new THREE.Vector3() },
      uRoutes: { value: null }, uRouteHeads: { value: [0.6, 0.6, 0.6] },
      uSphereCenter: { value: new THREE.Vector3() }, uSpan: { value: 1 },
      uSourceDensity: { value: 1 }, uCopyDensity: { value: 1 }, uChartDensity: { value: 1 },
      uColors: { value: [new THREE.Color('#ff8c42'), new THREE.Color('#e1e4e8'), new THREE.Color('#3274ff')] },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aSource, aFirst, aSecond, aTaskStart, aTaskEnd, aFinal, aNativeColor, aFinalColor;
      attribute vec4 aMotion;
      attribute vec3 aStyle;
      attribute vec2 aOptics;
      #define aSeed aMotion.x
      #define aRelease aMotion.y
      #define aLane aMotion.z
      #define aKind aMotion.w
      #define aParameter aStyle.x
      #define aStrength aStyle.y
      #define aAttachment aStyle.z
      #define aSourceWeight aOptics.x
      #define aSourceScale aOptics.y
      uniform float uUnits, uPixelRatio, uSpan, uSourceDensity, uCopyDensity, uChartDensity;
      uniform vec3 uCopyCenter, uSphereCenter, uColors[3];
      uniform sampler2D uRoutes;
      uniform float uRouteHeads[3];
      varying vec3 vColor; varying float vAlpha;
      float part(float a,float b,float v){return clamp((v-a)/(b-a),0.,1.);}
      float ease(float v){return v*v*(3.-2.*v);}
      vec3 travel(vec3 a,vec3 b,float t,float lift){
        vec3 p=mix(a,b,ease(t));
        float envelope=pow(sin(t*3.14159265),2.);
        p.y+=envelope*lift;
        p.z+=envelope*uSpan*.12;
        return p;
      }
      float cruise(float t){
        if(t<.1)return t*t/.18;
        if(t>.9)return 1.-(1.-t)*(1.-t)/.18;
        return (t-.05)/.9;
      }
      vec3 routeAt(float t){
        float pixel=clamp(t,0.,1.)*255.;
        float lower=floor(pixel);
        vec3 a=texture2D(uRoutes,vec2((lower+.5)/256.,(aLane+.5)/3.)).xyz;
        vec3 b=texture2D(uRoutes,vec2((min(lower+1.,255.)+.5)/256.,(aLane+.5)/3.)).xyz;
        return mix(a,b,fract(pixel));
      }
      vec3 surfaceJoin(vec3 from,vec3 to,float amount){
        vec3 a=from-uSphereCenter,b=to-uSphereCenter;
        vec3 n0=normalize(a),n1=normalize(b);
        float cosine=clamp(dot(n0,n1),-1.,1.);
        vec3 orth=n1-n0*cosine;
        float t=ease(amount);
        vec3 direction;
        if(length(orth)<.00001){
          if(cosine>0.)direction=normalize(mix(n0,n1,t));
          else{
            vec3 axis=abs(n0.x)<.8?vec3(1.,0.,0.):vec3(0.,1.,0.);
            direction=cos(3.14159265*t)*n0+sin(3.14159265*t)*normalize(cross(n0,axis));
          }
        }else direction=cos(acos(cosine)*t)*n0+sin(acos(cosine)*t)*normalize(orth);
        return uSphereCenter+direction*mix(length(a),length(b),t);
      }
      void main(){
        float u=uUnits;
        vec3 silver=vec3(.84,.88,.94);
        vec3 color=uColors[int(aLane)];
        float joinedAt=aRelease+${G.sphereJoinDuration};
        float join=part(aRelease,joinedAt,u);
        float flow=cruise(part(joinedAt,${G.firstArrivalStart}+aSeed*(${G.firstComplete}-${G.firstArrivalStart}),u));
        float routeProgress=mix(aAttachment,1.,flow);
        vec3 channel=routeAt(routeProgress);
        // Particles travel around the sphere and join different places on the
        // real ribbon. They never cut through its centre towards a fixed sink.
        vec3 p=surfaceJoin(aSource,channel,join);
        float width=uSpan*.0045*sin(flow*3.14159265)*ease(join);
        p+=vec3(cos(aSeed*37.),sin(aSeed*41.),sin(aSeed*29.))*width;
        float head=uRouteHeads[int(aLane)];
        float land=smoothstep(head+(1.-head)*.12,1.,routeProgress);
        p=mix(p,aFirst,land);
        color=mix(color,silver,land);
        float copyAlpha=uCopyDensity*.72;
        float ownership=smoothstep(aRelease,aRelease+${G.sphereReleaseFade},u);
        float alpha=ownership*mix(.22*aSourceWeight,copyAlpha,land);
        float size=mix(mix(max(.7,aSourceScale*1.75),2.1,ease(join)),1.5,land);
        if(u>=${G.firstComplete}){p=aFirst;color=silver;alpha=copyAlpha;size=1.5;}
        if(u>=${G.firstRelease} && u<${G.secondComplete}){
          float morph=part(${G.firstRelease},${G.secondComplete},u);
          p=travel(aFirst,aSecond,morph,uSpan*(.19+(aSeed-.5)*.04));
          // Letters release together; the next sentence only settles at the end.
          color=mix(silver,uColors[int(aLane)],sin(morph*3.14159265)*.38);
        }else if(u>=${G.secondComplete} && u<${G.secondRelease}){p=aSecond;}
        if(u>=${G.secondRelease} && u<${G.taskAssembled}){
          float morph=part(${G.secondRelease},${G.taskAssembled},u);
          p=travel(aSecond,aTaskStart,morph,uSpan*.11);
          color=mix(silver,aNativeColor,ease(morph));
          alpha=mix(copyAlpha,aStrength*.60,ease(morph));
          size=mix(1.5,1.4,ease(morph));
        }else if(u>=${G.taskAssembled} && u<${G.taskStart}){
          p=aTaskStart;color=aNativeColor;alpha=aStrength*.60*(1.-part(${G.taskAssembled},${G.taskStart},u));size=1.4;
        }else if(u>=${G.taskStart} && u<${G.taskEnd}){alpha=0.;}
        else if(u>=${G.taskEnd} && u<${G.taskHandoff}){
          p=aTaskEnd;color=aNativeColor;alpha=aStrength*.60*part(${G.taskEnd},${G.taskHandoff},u);size=1.4;
        }else if(u>=${G.taskHandoff}){
          // Both destinations come from the actual final robot/environment pose.
          // Future curve grains remain in flight, never parked in a data queue.
          float arrive=aKind>1.5?${G.thirdComplete}:(aKind<.5?${G.axesComplete}:${G.axesComplete}+aParameter*(${G.curveComplete}-${G.axesComplete}));
          float morph=part(${G.taskHandoff},arrive,u);
          p=travel(aTaskEnd,aFinal,morph,uSpan*(aKind>1.5?.16:.09));
          color=mix(aNativeColor,aFinalColor,ease(morph));
          float finalAlpha=aKind>1.5?.64:uChartDensity*(aKind<.5?.44:.63);
          alpha=mix(aStrength*.60,finalAlpha,ease(morph));
          size=mix(1.4,aKind>1.5?1.35:1.6,ease(morph));
        }
        vColor=color;vAlpha=alpha;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(size*uPixelRatio*12.5/max(4.,-mv.z),.8*uPixelRatio,3.5*uPixelRatio);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;varying float vAlpha;
      void main(){
        float radius=length(gl_PointCoord-.5)*2.;
        if(radius>1. || vAlpha<.001)discard;
        float disc=exp(-radius*radius*3.3)*(1.-smoothstep(.7,1.,radius));
        gl_FragColor=vec4(vColor,disc*vAlpha);
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 12
  return {
    points, geometry, material,
    set(name: string, values: ArrayLike<number>) {
      const component = packed[name]
      const attribute = geometry.getAttribute(component ? component[0] : name) as THREE.BufferAttribute
      if (component) {
        for (let i = 0; i < values.length; i++) (attribute.array as Float32Array)[i * attribute.itemSize + component[1]] = values[i]
      } else (attribute.array as Float32Array).set(values)
      attribute.needsUpdate = true
    },
    dispose() { (material.uniforms.uRoutes.value as THREE.Texture | null)?.dispose(); geometry.dispose(); material.dispose() },
  }
}
