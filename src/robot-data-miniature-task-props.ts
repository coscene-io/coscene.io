import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { TaskFrame } from './robot-data-miniature-tasks'

export function buildTaskProps(frame: TaskFrame) {
  const root = new THREE.Group()
  const geometries: THREE.BufferGeometry[] = []
  const materials = ['#c48269', '#758c83', '#ecede7', '#b5a68d', '#48718b', '#c1b171', '#b9c5c6', '#263234', '#bf5945', '#b8bb62', '#5e7f43', '#dc9340', '#634e6d', '#dda84c', '#a4b677', '#46734c'].map(color => new THREE.MeshStandardMaterial({ color, roughness: .58 }))
  const add = (group: THREE.Group, geometry: THREE.BufferGeometry, tone: number, position: [number, number, number] = [0, 0, 0]) => {
    geometries.push(geometry)
    const mesh = new THREE.Mesh(geometry, materials[tone])
    mesh.position.set(...position); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh)
    return mesh
  }
  const box = (group: THREE.Group, size: [number, number, number], position: [number, number, number], tone: number, radius = .004) => add(group, new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(n => n / 3))), tone, position)
  const cylinder = (group: THREE.Group, radius: number, height: number, y: number, tone: number) => add(group, new THREE.CylinderGeometry(radius, radius, height, 24), tone, [0, y, 0])
  for (const item of frame.objects) {
    const group = new THREE.Group(); group.name = item.id; group.position.set(...item.position); group.rotation.y = item.rotation; root.add(group)
    if (item.kind === 'wheelieBin') {
      box(group, [.58, .78, .61], [0, .48, 0], item.tone, .035)
      box(group, [.64, .06, .68], [0, .9, 0], item.tone, .02)
      box(group, [.22, .035, .04], [0, .946, .23], 7)
      box(group, [.23, .14, .008], [0, .62, .31], 2)
      for (const x of [-.27, .27]) {
        const wheel = add(group, new THREE.CylinderGeometry(.105, .105, .055, 16), 7, [x, .105, -.23]); wheel.rotation.z = Math.PI / 2
      }
      if (item.form !== 'cleaned') for (let i = 0; i < 5; i++) {
        const stain = add(group, new THREE.SphereGeometry(1, 10, 6), 3, [-.2 + i * .1, .34 + i % 3 * .13, .31]); stain.scale.set(.053, .06, .005)
      }
    } else if (item.kind === 'pottedPlant') {
      const pot = add(group, new THREE.CylinderGeometry(.18, .13, .28, 16), item.tone, [0, .14, 0]); pot.name = 'pot_body'
      cylinder(group, .16, .014, .285, 3)
      for (let i = 0; i < 7; i++) {
        const a = i * Math.PI * 2 / 7, x = Math.cos(a) * .14, z = Math.sin(a) * .14
        const leaf = add(group, new THREE.SphereGeometry(1, 10, 8), i % 2 ? 10 : 15, [x, .46 + i % 3 * .04, z]); leaf.scale.set(.095, .025, .22); leaf.rotation.set(.6, -a, .3)
        const stem = add(group, new THREE.CylinderGeometry(.008, .008, .26, 6), 10, [x / 2, .4, z / 2]); stem.rotation.z = -.35 * Math.cos(a)
      }
      for (let i = 0; i < 3; i++) add(group, new THREE.IcosahedronGeometry(.065, 1), item.tone === 0 ? 5 : 8, [i * .09 - .09, .62, .02])
    } else if (item.kind === 'gardenLeaf') {
      const leaf = add(group, new THREE.SphereGeometry(1, 8, 6), item.tone, [0, .012, 0]); leaf.scale.set(.09, .012, .041)
      box(group, [.135, .004, .004], [0, .025, 0], 3)
    } else if (item.kind === 'broom' || item.kind === 'washBrush') {
      const long = item.kind === 'broom', height = long ? 1.22 : .52
      cylinder(group, .013, height, height / 2 + .075, 3)
      box(group, [long ? .38 : .2, .048, .1], [0, .087, 0], item.tone)
      for (let i = 0; i < 9; i++) box(group, [.022, .065, .09], [(i - 4) * (long ? .041 : .021), .033, 0], 5)
    } else if (item.kind === 'wateringCan') {
      cylinder(group, .13, .24, .12, item.tone)
      const spout = add(group, new THREE.CylinderGeometry(.025, .02, .31, 10), item.tone, [.19, .16, 0]); spout.rotation.z = -1.05
      add(group, new THREE.TorusGeometry(.12, .019, 6, 14, Math.PI), item.tone, [0, .24, 0])
    } else if (item.kind === 'displayRack') {
      const folded = item.form === 'folded', depth = folded ? .16 : .62
      for (const x of [-.61, .61]) for (const z of [-depth / 2, depth / 2]) box(group, [.032, 1.44, .032], [x, .76, z], 7)
      for (const y of [.46, .98, 1.48]) box(group, [1.28, .036, depth], [0, y, 0], item.tone)
      for (const x of [-.56, .56]) for (const z of [-depth / 2, depth / 2]) {
        const wheel = add(group, new THREE.CylinderGeometry(.043, .043, .026, 10), 7, [x, .043, z]); wheel.rotation.z = Math.PI / 2
      }
    } else if (item.kind === 'signBoard') {
      box(group, [.56, .73, .035], [0, .59, 0], item.tone)
      for (const x of [-.25, .25]) box(group, [.035, .9, .035], [x, .45, 0], 3)
      if (item.form !== 'folded') for (const x of [-.25, .25]) {
        const leg = box(group, [.032, .9, .032], [x, .45, -.22], 3); leg.rotation.x = -.35
      }
      for (const y of [.72, .55, .43]) box(group, [.34, .024, .004], [0, y, .021], 2)
    } else if (item.kind === 'outdoorStain') {
      if (item.form !== 'cleaned') {
        const stain = add(group, new THREE.SphereGeometry(1, 12, 6), item.tone, [0, .005, 0]); stain.scale.set(.19, .005, .11)
      }
    } else if (item.kind === 'fruit') {
      const variety = item.produce || (item.tone === 5 ? 'pear' : item.tone === 0 ? 'apple' : 'cucumber')
      const ellipsoid = (scale: [number, number, number], at: [number, number, number], tone: number) => {
        const mesh = add(group, new THREE.SphereGeometry(1, 16, 12), tone, at); mesh.scale.set(...scale); return mesh
      }
      if (variety === 'watermelon') {
        ellipsoid([.17, .135, .135], [0, .135, 0], 15)
        for (let i = 0; i < 9; i++) {
          const a = i * Math.PI * 2 / 9
          if (Math.cos(a) < -.8) continue
          const points = Array.from({ length: 17 }, (_, j) => {
            const p = -1.3 + j * 2.6 / 16
            return new THREE.Vector3(.172 * Math.sin(p), .135 + .136 * Math.cos(p) * Math.cos(a), .136 * Math.cos(p) * Math.sin(a))
          })
          add(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, .004, 5, false), 14)
        }
      } else if (variety === 'strawberry') {
        const profile = [[0, 0], [.009, 0], [.022, .02], [.029, .041], [.022, .058], [0, .062]].map(([x, y]) => new THREE.Vector2(x, y))
        add(group, new THREE.LatheGeometry(profile, 16), 8)
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2
          const leaf = ellipsoid([.018, .003, .006], [Math.cos(a) * .008, .063, Math.sin(a) * .008], 15); leaf.rotation.y = -a
        }
      } else if (variety === 'durian') {
        ellipsoid([.12, .145, .115], [0, .155, 0], 9)
        cylinder(group, .044, .012, .006, 9)
        cylinder(group, .013, .045, .318, 3)
        const geometry = new THREE.ConeGeometry(.012, .028, 5); geometries.push(geometry)
        const spikes = new THREE.InstancedMesh(geometry, materials[10], 48), dummy = new THREE.Object3D()
        for (let row = 0; row < 6; row++) for (let col = 0; col < 8; col++) {
          const latitude = (-60 + row * 24) * Math.PI / 180, angle = (col + row % 2 * .5) * Math.PI / 4
          const direction = new THREE.Vector3(Math.cos(latitude) * Math.cos(angle), Math.sin(latitude), Math.cos(latitude) * Math.sin(angle))
          dummy.position.set(direction.x * .127, .155 + direction.y * .152, direction.z * .122)
          dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction); dummy.updateMatrix(); spikes.setMatrixAt(row * 8 + col, dummy.matrix)
        }
        spikes.instanceMatrix.needsUpdate = true; spikes.castShadow = spikes.receiveShadow = true; group.add(spikes)
      } else if (variety === 'pear') {
        const profile = [[0, 0], [.031, 0], [.055, .035], [.05, .067], [.023, .105], [.019, .13], [0, .135]].map(([x, y]) => new THREE.Vector2(x, y))
        add(group, new THREE.LatheGeometry(profile, 24), 9)
        cylinder(group, .004, .024, .144, 3)
      } else if (variety === 'carrot') {
        const body = add(group, new THREE.ConeGeometry(.033, .23, 16), 11, [0, .034, 0]); body.rotation.z = Math.PI / 2
        for (let i = 0; i < 3; i++) ellipsoid([.05, .006, .012], [.151, .04 + i * .008, (i - 1) * .018], 15).rotation.y = (i - 1) * .3
      } else if (variety === 'eggplant') {
        ellipsoid([.12, .051, .047], [0, .051, 0], 12)
        for (let i = 0; i < 4; i++) ellipsoid([.042, .008, .018], [.086, .055 + i % 2 * .024, (i - 1.5) * .014], 15).rotation.y = (i - 1.5) * .3
      } else if (variety === 'corn') {
        ellipsoid([.128, .044, .044], [0, .044, 0], 13)
        for (let i = 0; i < 6; i++) for (const z of [-.021, .021]) ellipsoid([.013, .006, .013], [-.085 + i * .034, .082, z], 5)
        for (const z of [-.039, .039]) ellipsoid([.14, .008, .017], [-.014, .021, z], 10).rotation.y = z * 3
      } else if (variety === 'cabbage') {
        ellipsoid([.115, .101, .11], [0, .101, 0], 14)
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5
          const leaf = ellipsoid([.079, .013, .12], [Math.cos(a) * .043, .11, Math.sin(a) * .043], i % 2 ? 10 : 14)
          leaf.rotation.set(.9, a, .2)
        }
      } else if (variety === 'broccoli') {
        cylinder(group, .021, .115, .0575, 14)
        for (let i = 0; i < 7; i++) {
          const a = i * Math.PI / 3, r = i === 6 ? 0 : .063
          ellipsoid([.055, .048, .055], [Math.cos(a) * r, i === 6 ? .161 : .125, Math.sin(a) * r], i % 2 ? 10 : 15)
        }
      } else {
        const round = variety !== 'cucumber'
        ellipsoid(round ? [.07, .066, .068] : [.12, .035, .037], [0, round ? .066 : .035, 0], variety === 'apple' ? 8 : variety === 'orange' ? 11 : 10)
        if (variety === 'apple') {
          cylinder(group, .004, .025, .136, 3)
          const leaf = add(group, new THREE.SphereGeometry(1, 12, 8), 10, [.015, .139, 0]); leaf.scale.set(.023, .003, .009); leaf.rotation.z = .3
        } else if (variety === 'orange') {
          cylinder(group, .01, .007, .132, 15)
        }
      }
    } else if (item.kind === 'produceCrate') {
      box(group, [.64, .02, .43], [0, .01, 0], item.tone)
      for (const x of [-.31, .31]) box(group, [.02, .18, .43], [x, .112, 0], item.tone)
      for (const z of [-.205, .205]) for (let i = 0; i < 3; i++) box(group, [.598, .043, .02], [0, .046 + i * .06, z], item.tone)
    } else if (item.kind === 'cleaningPad') {
      box(group, [.23, .018, .17], [0, .009, 0], item.tone, .006)
      for (const z of [-.05, .02]) box(group, [.19, .001, .006], [0, .0185, z], 2, .0003)
    } else if (item.kind === 'paperSet') {
      if (item.form === 'shredded') {
        for (let i = 0; i < 13; i++) {
          const strip = box(group, [.009, .003, .22], [-.079 + i * .013, .0015 + i % 3 * .005, 0], 2, .0004)
          strip.rotation.y = (i % 3 - 1) * .07
        }
      } else {
        box(group, [.21, .014, .287], [0, .007, 0], 2, .001)
        if (item.form === 'printed') {
          box(group, [.055, .001, .035], [-.054, .015, -.095], item.tone, .0003)
          for (let i = 0; i < 6; i++) box(group, [i % 2 ? .15 : .12, .001, .003], [0, .015, -.037 + i * .025], 7, .0003)
        }
      }
    } else if (item.kind === 'fileFolder') {
      box(group, [.28, .023, .32], [0, .0115, 0], item.tone)
      box(group, [.26, .015, .305], [.006, .013, 0], 2)
      box(group, [.28, .003, .32], [0, .024, 0], item.tone)
      box(group, [.11, .001, .09], [.025, .026, -.065], 2)
      box(group, [.027, .003, .3], [-.125, .027, 0], item.tone)
    } else if (item.kind === 'penPot') {
      const profile = [[0, 0], [.045, 0], [.045, .1], [.039, .1], [.039, .009], [0, .009]].map(([x, y]) => new THREE.Vector2(x, y))
      add(group, new THREE.LatheGeometry(profile, 24), item.tone)
      for (let i = 0; i < 5; i++) {
        const pen = add(group, new THREE.CylinderGeometry(.003, .003, .13 + i % 2 * .015, 8), [4, 7, 3, 0, 7][i], [-.024 + i * .012, .098, i % 2 ? .012 : -.012])
        pen.rotation.z = (i - 2) * .04
      }
    } else if (item.kind === 'deskMark') {
      if (item.form !== 'cleaned') {
        for (let i = 0; i < 5; i++) {
          const mark = add(group, new THREE.SphereGeometry(1, 12, 8), 3, [-.065 + i * .03, .0008, i % 2 ? -.018 : .018]); mark.scale.set(.027, .0008, .014)
        }
      }
    } else if (item.kind === 'sushiPlate' || item.kind === 'usedSushiPlate') {
      const profile = [[0, 0], [.105, 0], [.137, .018], [.132, .026], [.1, .009], [0, .009]].map(([x, y]) => new THREE.Vector2(x, y))
      add(group, new THREE.LatheGeometry(profile, 32), item.tone)
      if (item.kind === 'usedSushiPlate') {
        for (const x of [-.028, .025]) box(group, [.018, .005, .027], [x, .012, .01], 2)
      } else if (item.tone === 1) {
        for (const x of [-.043, .043]) {
          add(group, new THREE.CylinderGeometry(.033, .033, .045, 20), 7, [x, .032, 0])
          add(group, new THREE.CylinderGeometry(.026, .026, .003, 20), 2, [x, .056, 0])
          box(group, [.02, .003, .024], [x, .06, 0], 0)
        }
      } else {
        for (const x of [-.043, .043]) {
          box(group, [.058, .032, .098], [x, .025, 0], 2, .016)
          box(group, [.064, .014, .106], [x, .047, 0], item.tone === 0 ? 0 : 5, .01)
          if (item.tone === 0) for (const z of [-.025, 0, .025]) box(group, [.055, .002, .003], [x, .055, z], 2, .001)
          else box(group, [.068, .003, .018], [x, .056, 0], 7)
        }
      }
    } else if (item.kind === 'harnessModule') {
      const loose = item.form === 'spread', fixed = item.form === 'secured' || item.form === 'tested'
      box(group, [.72, .018, .55], [0, .009, 0], 2)
      box(group, [.25, .075, .26], [-.19, .0555, 0], 6, .008)
      box(group, [.23, .006, .235], [-.19, .096, 0], item.tone)
      for (const z of [-.08, .08]) box(group, [.044, .045, .058], [-.045, .055, z], 7)
      box(group, [.047, .048, .25], [.255, .042, 0], 7)
      for (let i = 0; i < 4; i++) {
        const z = -.085 + i * .055
        box(group, [.028, .014, .025], [.275, .073, z], 6)
        const points = loose
          ? [[.04, .047, -.18 + i * .016], [.1, .045, -.23 + i * .016], [.19, .04, .18 - i * .022], [.29, .04, .17 - i * .025]]
          : fixed
            ? [[-.023, .055, z], [.065, .053, z], [.15, .035, z], [.233, .049, z]]
            : [[-.023, .055, z], [.045, .07, z - .045], [.14, .065, z + .07], [.233, .049, z]]
        const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])))
        const wire = add(group, new THREE.TubeGeometry(curve, 24, .006, 6, false), [0, 4, 5, 7][i])
        wire.name = `wire-${i}`
      }
      for (const z of [-.08, .08]) {
        box(group, [.039, .035, .05], [loose ? .045 : -.012, .055, loose ? z - .08 : z], 2)
        box(group, [.038, .008, .012], [loose ? .045 : -.012, .076, loose ? z - .08 : z], item.tone)
      }
      for (const z of [-.085, .08]) {
        box(group, [.045, .014, .065], [fixed ? .14 : .32, fixed ? .05 : .026, fixed ? z : z + .06], 2)
      }
      for (const x of [-.3, -.085]) for (const z of [-.1, .1]) {
        const y = fixed ? .104 : .13
        add(group, new THREE.CylinderGeometry(.006, .006, fixed ? .012 : .044, 8), 6, [x, y - .013, z])
        add(group, new THREE.CylinderGeometry(.015, .015, .009, 12), 6, [x, y, z])
        box(group, [.018, .002, .003], [x, y + .005, z], 7, 0)
      }
      box(group, [.086, .002, .046], [-.19, .1, .024], 2)
      if (item.form === 'tested') {
        // The jumper represents the test fixture connection, not a live measurement.
        const curve = new THREE.CatmullRomCurve3([[.28, .065, .08], [.32, .1, .04], [.32, .055, -.13]].map(p => new THREE.Vector3(...p as [number, number, number])))
        add(group, new THREE.TubeGeometry(curve, 16, .009, 6, false), 7)
        box(group, [.035, .025, .04], [.32, .04, -.13], 5)
      }
    } else if (item.kind === 'torqueDriver') {
      box(group, [.09, .09, .23], [0, .047, .02], 4, .02)
      const tip = add(group, new THREE.CylinderGeometry(.008, .008, .14, 12), 6, [0, .047, -.165]); tip.rotation.x = Math.PI / 2
      box(group, [.04, .008, .06], [0, .095, .04], 7)
    } else if (item.kind === 'trowel') {
      box(group, [.037, .035, .14], [0, .019, .085], 3, .015)
      const blade = add(group, new THREE.SphereGeometry(1, 16, 10), 6, [0, .017, -.065]); blade.scale.set(.048, .015, .091)
    } else if (item.kind === 'gloves') {
      for (const x of [-.052, .052]) {
        box(group, [.077, .022, .1], [x, .013, .025], item.tone, .015)
        for (let i = 0; i < 4; i++) box(group, [.015, .019, .057 + (i % 2) * .012], [x - .028 + i * .018, .012, -.047], item.tone, .007)
        box(group, [.026, .02, .048], [x + (x < 0 ? -.043 : .043), .012, .008], item.tone, .01)
        box(group, [.077, .016, .025], [x, .012, .077], 2)
      }
    } else if (item.kind === 'seedPacket') {
      box(group, [.125, .008, .16], [0, .004, 0], 3)
      box(group, [.095, .002, .092], [0, .009, -.008], 2)
      for (const x of [-.027, .027]) {
        const leaf = add(group, new THREE.SphereGeometry(1, 10, 8), 1, [x, .013, -.014]); leaf.scale.set(.017, .003, .031); leaf.rotation.y = x < 0 ? -.5 : .5
      }
      box(group, [.07, .001, .01], [0, .012, .043], 1)
    } else if (item.kind === 'wrench') {
      box(group, [.035, .023, .2], [0, .013, 0], 6, .01)
      for (const z of [-.115, .115]) {
        const jaw = add(group, new THREE.TorusGeometry(.033, .012, 8, 20, Math.PI * 1.5), 6, [0, .014, z])
        jaw.rotation.x = Math.PI / 2; jaw.rotation.z = z > 0 ? 0 : Math.PI
      }
    } else if (item.kind === 'screwdriver') {
      box(group, [.045, .043, .12], [0, .023, .065], item.tone, .016)
      const shaft = add(group, new THREE.CylinderGeometry(.006, .006, .16, 12), 6, [0, .023, -.07]); shaft.rotation.x = Math.PI / 2
      box(group, [.013, .003, .025], [0, .023, -.159], 6)
    } else if (item.kind === 'fastener') {
      box(group, [.18, .012, .17], [0, .006, 0], 7)
      for (const x of [-.086, .086]) box(group, [.008, .04, .17], [x, .026, 0], 7)
      for (const z of [-.081, .081]) box(group, [.18, .04, .008], [0, .026, z], 7)
      for (let i = 0; i < 4; i++) {
        const x = -.04 + i % 2 * .08, z = -.04 + Math.floor(i / 2) * .08
        add(group, new THREE.CylinderGeometry(.016, .016, .012, 6), 6, [x, .02, z])
        add(group, new THREE.CylinderGeometry(.006, .006, .032, 12), 6, [x, .04, z])
      }
    } else if (item.kind === 'parcel') {
      const width = [.34, .29, .38][item.tone % 3], height = [.22, .32, .19][item.tone % 3], depth = .29
      box(group, [width, height, depth], [0, height / 2, 0], 3, .007)
      box(group, [.13, .085, .002], [0, height * .6, depth / 2 + .001], 2, .001)
      for (let i = 0; i < 10; i++) box(group, [i % 3 ? .003 : .007, .032, .001], [-.047 + i * .01, height * .6, depth / 2 + .003], 7, 0)
      box(group, [.048, .002, depth], [0, height + .001, 0], item.form === 'sealed' ? 5 : 7, .001)
      if (item.form === 'sealed') box(group, [.048, .065, .003], [0, height - .03, depth / 2 + .003], 5, .001)
      else for (const x of [-width / 4, width / 4]) box(group, [width / 2 - .007, .006, depth], [x, height + .004, 0], 3)
    } else if (item.kind === 'component') {
      const outline = new THREE.Shape()
      outline.moveTo(-.145, -.12); outline.lineTo(.145, -.12); outline.lineTo(.145, .12); outline.lineTo(-.145, .12); outline.closePath()
      for (const x of [-.09, .09]) { const hole = new THREE.Path(); hole.absarc(x, 0, .027, 0, Math.PI * 2, true); outline.holes.push(hole) }
      const plate = add(group, new THREE.ExtrudeGeometry(outline, { depth: .037, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 1, steps: 1, curveSegments: 16 }), item.tone, [0, .039, 0]); plate.rotation.x = Math.PI / 2
      box(group, [.11, .06, .08], [0, .067, -.035], item.tone)
    } else if (item.kind === 'cup') {
      const profile = [[0, 0], [.034, 0], [.045, .09], [.039, .096], [.03, .015], [0, .015]].map(([x, y]) => new THREE.Vector2(x, y))
      add(group, new THREE.LatheGeometry(profile, 24), item.tone)
      add(group, new THREE.TorusGeometry(.024, .005, 8, 20), item.tone, [.041, .052, 0]).rotation.y = Math.PI / 2
    } else if (item.kind === 'plate') {
      const profile = [[0, 0], [.067, 0], [.082, .014], [.078, .018], [.059, .008], [0, .008]].map(([x, y]) => new THREE.Vector2(x, y))
      add(group, new THREE.LatheGeometry(profile, 32), 2)
    } else if (item.kind === 'cloth') add(group, new RoundedBoxGeometry(.23, .012, .17, 2, .005), 1)
    else if (item.kind === 'book') {
      box(group, [.226, .02, .16], [0, .013, 0], 2)
      for (const y of [.002, .025]) box(group, [.236, .003, .168], [0, y, 0], item.tone)
      box(group, [.006, .026, .168], [-.117, .013, 0], item.tone)
      box(group, [.08, .001, .1], [.03, .027, -.01], 3)
    } else if (item.kind === 'remote') {
      box(group, [.052, .016, .17], [0, .008, 0], 7, .008)
      for (let i = 0; i < 6; i++) box(group, [.012, .003, .012], [-.012 + i % 2 * .024, .017, -.038 + Math.floor(i / 2) * .028], 2, .002)
    } else if (item.kind === 'bottle') {
      cylinder(group, .038, .14, .07, item.tone)
      cylinder(group, .018, .043, .157, item.tone)
      cylinder(group, .021, .019, .186, 7)
      box(group, [.042, .052, .004], [0, .086, .037], 2)
    } else if (item.kind === 'tissueBox') {
      box(group, [.22, .085, .135], [0, .0425, 0], item.tone, .012)
      box(group, [.09, .002, .021], [0, .086, 0], 7, .007)
      const tissue = box(group, [.065, .045, .002], [.008, .107, 0], 2, .001)
      tissue.rotation.z = -.22
      box(group, [.135, .024, .002], [0, .039, .068], 2, .001)
    } else if (item.kind === 'carton') {
      box(group, [.115, .18, .08], [0, .09, 0], item.tone, .008)
      box(group, [.075, .065, .003], [0, .104, .041], 2)
      box(group, [.08, .002, .004], [0, .181, 0], 3)
    } else if (item.kind === 'can') {
      cylinder(group, .045, .15, .075, item.tone)
      for (const y of [.003, .153]) cylinder(group, .045, .006, y, 6)
      box(group, [.018, .002, .027], [0, .157, 0], 7)
    } else if (item.kind === 'garment' || item.kind === 'linen') {
      if (item.form === 'folded') {
        for (let i = 0; i < 3; i++) box(group, [.28, .018, .2], [0, .01 + i * .02, 0], item.tone, .008)
        box(group, [.264, .002, .005], [0, .06, .085], 2, .001)
      } else if (item.kind === 'garment') {
        // A single cloth silhouette avoids coplanar sleeve/body patches.
        const outline = new THREE.Shape()
        const points = [[-.11, .15], [.11, .15], [.11, -.035], [.18, -.008], [.222, -.117], [.106, -.15], [-.106, -.15], [-.222, -.117], [-.18, -.008], [-.11, -.035]]
        points.forEach(([x, z], i) => i ? outline.lineTo(x, -z) : outline.moveTo(x, -z)); outline.closePath()
        const cloth = new THREE.ExtrudeGeometry(outline, { depth: .012, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 2, steps: 1 })
        cloth.rotateX(-Math.PI / 2)
        add(group, cloth, item.tone, [0, .003, 0])
        add(group, new THREE.TorusGeometry(.032, .006, 8, 24, Math.PI), 2, [0, .018, -.13]).rotation.x = Math.PI / 2
      } else {
        box(group, [.33, .018, .26], [0, .01, 0], item.tone, .008)
        for (const z of [-.11, .11]) box(group, [.31, .002, .005], [0, .02, z], 2, .001)
      }
    } else if (item.kind === 'caddy') {
      box(group, [.42, .01, .5], [0, .005, 0], 3)
      for (const x of [-.205, .205]) box(group, [.01, .05, .5], [x, .03, 0], 3)
      for (const z of [-.245, .245]) box(group, [.4, .05, .01], [0, .03, z], 3)
    } else if (item.kind === 'bag') {
      box(group, [.264, .01, .254], [0, .005, 0], 3)
      for (const x of [-.136, .136]) box(group, [.008, .2, .27], [x, .1, 0], 3)
      box(group, [.264, .2, .008], [0, .1, -.131], 3)
      box(group, [.264, .14, .008], [0, .07, .131], 3)
      for (const z of [-.13, .13]) add(group, new THREE.TorusGeometry(.055, .004, 8, 24, Math.PI), 3, [0, z > 0 ? .14 : .2, z])
    } else if (item.kind === 'receipt') {
      box(group, [.08, .002, .1], [0, .001, 0], 2, .001)
      for (let i = 0; i < 4; i++) box(group, [.05, .001, .002], [0, .003, -.026 + i * .014], 7, .0003)
    } else {
      add(group, new RoundedBoxGeometry(.6, .016, .43, 2, .006), 3)
      for (const x of [-.294, .294]) add(group, new THREE.BoxGeometry(.012, .025, .43), 3, [x, .019, 0])
      for (const z of [-.209, .209]) add(group, new THREE.BoxGeometry(.576, .025, .012), 3, [0, .019, z])
    }
  }
  return { root, dispose: () => { geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()) } }
}
