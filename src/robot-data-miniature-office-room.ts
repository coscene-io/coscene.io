import * as THREE from 'three'
import type { SceneDefinition, Vec3 } from './robot-data-miniature-catalog'
import { roomKit } from './robot-data-miniature-room-kit'
import { OFFICE_SURFACES as S, officeTaskFrame } from './robot-data-miniature-office-tasks'
import { buildTaskProps } from './robot-data-miniature-task-props'

export function buildOfficeRoom(scene: SceneDefinition, wood: THREE.Texture, normal: THREE.Texture) {
  const kit = roomKit(scene, wood, normal), { root, M, mesh, box, cylinder, rod, group, table } = kit
  M.floor.color.set('#cbd5d8')
  const { rear } = kit.shell()
  for (let x = -3.8; x < 4.3; x += .6) box([.003, .002, scene.depth - .06], [x, .012, 0], M.base)
  for (let z = -2.7; z < 3.2; z += .6) box([scene.width - .06, .002, .003], [0, .012, z], M.base)
  const monitor = (x: number, z: number, parent: THREE.Group) => {
    box([.22, .02, .16], [x, .79, z], M.ink, parent)
    rod([x, .8, z], [x, 1.01, z], .018, M.metal, parent)
    box([.52, .32, .035], [x, 1.16, z], M.ink, parent)
    box([.48, .28, .004], [x, 1.16, z + .021], M.blue, parent)
    box([.12, .22, .002], [x - .15, 1.16, z + .024], M.white, parent)
    for (let i = 0; i < 4; i++) box([.22 - i % 2 * .035, .006, .002], [x + .055, 1.235 - i * .044, z + .024], M.fabric, parent)
    box([.39, .018, .13], [x, .789, z + .2], M.white, parent)
    for (let row = 0; row < 3; row++) for (let col = 0; col < 10; col++) box([.025, .003, .024], [x - .157 + col * .035, .7995, z + .163 + row * .035], M.base, parent, .001)
    const mouse = mesh(new THREE.SphereGeometry(1, 16, 10), M.ink, [x + .3, .791, z + .2], parent); mouse.scale.set(.027, .011, .046)
    const cable = new THREE.CatmullRomCurve3([[x, 1.02, z - .025], [x + .22, .82, z - .09], [x + .3, .71, z - .2], [x + .44, .35, z - .18]].map(p => new THREE.Vector3(...p as Vec3)))
    mesh(new THREE.TubeGeometry(cable, 20, .004, 6, false), M.ink, [0, 0, 0], parent)
    box([.16, .39, .36], [x + .5, .255, z + .06], M.ink, parent)
    for (let i = 0; i < 5; i++) box([.09, .008, .002], [x + .5, .31 + i * .021, z + .242], M.metal, parent)
  }
  for (const [index, [x, z]] of [[-2.7, -1.43], [-.7, -1.43], [-2.7, 1.15], [-.7, 1.15]].entries()) {
    const desk = group(`office_desk_${index}`, [0, 0, 0], true)
    table({ center: [x, .78, z], width: 1.55, depth: .8 }, desk, M.white)
    box([1.3, .18, .02], [x, .61, z - .34], M.fabric, desk)
    if (index === 0) {
      box([.37, .019, .25], [x - .06, .7895, z + .01], M.ink, desk)
      const screen = box([.37, .235, .013], [x - .06, .91, z - .126], M.ink, desk); screen.rotation.x = -.18
      const display = box([.335, .198, .003], [x - .06, .91, z - .116], M.blue, desk); display.rotation.x = -.18
      box([.09, .005, .055], [x - .06, .801, z + .05], M.base, desk)
    } else monitor(x, z - .31, desk)
    if (index < 2) {
      for (let i = 0; i < 3; i++) box([.036, .28 + i % 2 * .03, .23], [x + .48 + i * .04, .93 + i % 2 * .015, z], i % 2 ? M.green : M.blue, desk)
      box([.23, .026, .16], [x - .47, .793, z + .18], M.wood, desk)
      cylinder(.037, .09, [x + .3, .825, z + .24], M.white, desk)
    }
    const chair = group(`office_chair_${index}`, [x, 0, z + .98], true)
    chair.rotation.y = index === 2 ? -.18 : index === 1 ? .14 : 0
    cylinder(.027, .39, [0, .245, 0], M.metal, chair)
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5
      rod([0, .13, 0], [Math.cos(a) * .28, .065, Math.sin(a) * .28], .018, M.ink, chair)
      cylinder(.028, .033, [Math.cos(a) * .28, .044, Math.sin(a) * .28], M.rubber, chair).rotation.z = Math.PI / 2
    }
    box([.49, .095, .47], [0, .47, 0], M.fabric, chair, .035)
    rod([0, .42, .2], [0, .83, .27], .018, M.ink, chair)
    box([.45, .43, .06], [0, .77, .24], M.blue, chair, .04)
    for (const dx of [-.275, .275]) {
      rod([dx, .49, .08], [dx, .66, .03], .013, M.ink, chair)
      box([.055, .035, .3], [dx, .6775, .015], M.ink, chair, .013)
    }
  }
  const partitions = group('office_low_partitions', [0, 0, 0], true)
  for (const z of [-1.43, 1.15]) {
    box([.045, .45, .69], [-1.7, 1.005, z - .025], M.fabric, partitions)
    for (const dz of [-.3, .27]) box([.14, .022, .07], [-1.7, .791, z + dz], M.metal, partitions)
  }
  const printer = group('office_printer', [0, 0, 0], true)
  box([1.02, .86, .87], [2.82, .56, -2.3], M.white, printer, .025)
  box([1.06, .185, .94], [2.82, 1.0825, -2.3], M.white, printer, .02)
  box([.9, .12, .03], [2.82, .949, -1.849], M.ink, printer)
  for (const y of [.32, .56]) {
    box([.9, .19, .024], [2.82, y, -1.852], M.white, printer)
    box([.21, .025, .015], [2.82, y + .045, -1.831], M.ink, printer)
  }
  box([.61, .025, .32], [2.82, .8325, -1.73], M.white, printer)
  box([.72, .025, .34], [2.82, 1.0025, -1.71], M.ink, printer)
  box([.82, .015, .5], [2.82, 1.1825, -2.28], M.blue, printer)
  const lid = new THREE.Group(); lid.position.set(2.82, 1.196, -2.6); lid.rotation.x = -1.03; printer.add(lid)
  box([.91, .035, .61], [0, .0175, .305], M.white, lid)
  for (const x of [2.5, 3.14]) cylinder(.021, .075, [x, 1.196, -2.6], M.metal, printer).rotation.z = Math.PI / 2
  box([.27, .11, .035], [3.15, 1.2, -1.832], M.ink, printer)
  box([.225, .075, .004], [3.15, 1.2, -1.811], M.blue, printer)
  for (const x of [2.43, 3.21]) for (const z of [-2.62, -1.98]) cylinder(.046, .065, [x, .063, z], M.rubber, printer).rotation.z = Math.PI / 2

  const archive = group('office_archive', [0, 0, 0], true)
  table(S.archive, archive, M.wood)
  box([1.52, .7, .67], [3.0, .485, .45], M.white, archive)
  for (const x of [2.61, 3.39]) {
    box([.735, .6, .024], [x, .52, .799], M.white, archive)
    rod([x + .2, .67, .817], [x + .2, .81, .817], .009, M.ink, archive)
  }
  const supply = group('office_paper_supply', [0, 0, 0], true)
  table(S.supplies, supply, M.wood)
  for (let i = 0; i < 3; i++) box([.64, .045, .46], [1.49, .4 + i * .055, -2.4], M.paper, supply)

  const shredder = group('office_shredder', [0, 0, 0], true)
  box([.61, .25, .57], [3.47, .72, 1.85], M.ink, shredder, .026)
  box([.4, .006, .024], [3.47, .848, 1.85], M.metal, shredder)
  box([.03, .006, .03], [3.7, .849, 1.98], M.green, shredder)
  box([.6, .07, .57], [3.47, .145, 1.85], M.ink, shredder)
  box([.43, .025, .32], [3.47, .3875, 1.91], M.base, shredder)
  for (const x of [3.19, 3.75]) box([.04, .4, .56], [x, .39, 1.85], M.ink, shredder)
  box([.51, .4, .035], [3.47, .39, 1.583], M.ink, shredder)
  for (const y of [.245, .535]) box([.51, .095, .03], [3.47, y, 2.12], M.ink, shredder)
  const cart = group('office_tidy_cart', [0, 0, 0], true)
  table(S.cart, cart, M.white)
  box([1.02, .035, .56], [.55, .29, 2.51], M.blue, cart)
  for (const x of [.1, 1.0]) for (const z of [2.27, 2.75]) cylinder(.035, .035, [x, .04, z], M.rubber, cart).rotation.z = Math.PI / 2
  rod([1.12, .77, 2.25], [1.12, .92, 2.25], .015, M.metal, cart)
  rod([1.12, .77, 2.77], [1.12, .92, 2.77], .015, M.metal, cart)
  rod([1.12, .92, 2.25], [1.12, .92, 2.77], .015, M.metal, cart)
  cylinder(.045, .2, [.12, .4075, 2.51], M.white, cart)
  rod([.16, .92, 2.65], [.16, .92, 2.73], .012, M.blue, cart)

  const storage = group('office_storage', [0, 0, 0], true)
  box([1.35, .075, .49], [-3.46, .12, -2.78], M.wood, storage)
  for (const x of [-4.1, -2.82]) box([.05, 1.9, .49], [x, 1.1075, -2.78], M.white, storage)
  box([1.25, 1.9, .025], [-3.46, 1.1075, -3.013], M.white, storage)
  for (const y of [.65, 1.31, 2.045]) {
    box([1.22, .025, .46], [-3.46, y, -2.78], M.white, storage)
    if (y < 2) for (let i = 0; i < 8; i++) {
      const x = -3.98 + i * .147
      box([.09, .33, .27], [x, y + .1775, -2.79], [M.blue, M.green, M.wood][i % 3], storage)
      box([.05, .065, .003], [x, y + .24, -2.653], M.white, storage)
    }
  }
  box([2.42, .88, .035], [-.45, 1.68, -3.156], M.white, rear)
  box([2.46, .025, .09], [-.45, 1.228, -3.135], M.metal, rear)
  for (let i = 0; i < 6; i++) box([.22, .19, .003], [-1.37 + i % 3 * .38, 1.92 - Math.floor(i / 3) * .31, -3.136], i % 2 ? M.fabric : M.paper, rear)
  for (let i = 0; i < 3; i++) box([.62, .006, .003], [.18, 1.9 - i * .15, -3.135], M.blue, rear)
  const plant = group('office_plant', [0, 0, 0], true); kit.plant([4.03, .018, -2.64], plant)
  const initial = buildTaskProps(officeTaskFrame(0, 'everyday'))
  initial.root.userData.taskProp = true; root.add(initial.root)
  return { root, dispose: () => { initial.dispose(); kit.dispose() } }
}
