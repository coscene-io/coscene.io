import * as THREE from 'three'
import type { SceneDefinition } from './robot-data-miniature-catalog'
import { roomKit } from './robot-data-miniature-room-kit'
import { PRODUCE_SURFACES as S, PRODUCE_STOCK_BAYS, produceStockFrame, produceTaskFrame } from './robot-data-miniature-produce-tasks'
import { buildTaskProps } from './robot-data-miniature-task-props'

export function buildProduceRoom(scene: SceneDefinition, wood: THREE.Texture, normal: THREE.Texture) {
  const kit = roomKit(scene, wood, normal), { root, M, box, cylinder, rod, group, table } = kit
  const { rear } = kit.shell()
  for (let x = -3.3; x < 3.7; x += .6) box([.004, .002, scene.depth - .06], [x, .012, 0], M.base)
  for (let z = -2.3; z < 2.8; z += .6) box([scene.width - .06, .002, .004], [0, .012, z], M.base)
  const receiving = group('produce_receiving', [0, 0, 0], true)
  table(S.receiving, receiving, M.metal)
  box([3.0, .045, .68], [-1.6, .25, -2.22], M.white, receiving)
  for (const x of [-2.64, -1.61, -.58]) {
    box([.82, .29, .51], [x, .42, -2.22], M.green, receiving)
    box([.38, .035, .01], [x, .46, -1.958], M.ink, receiving)
  }
  const sorting = group('produce_sorting', [0, 0, 0], true)
  table({ center: [2.11, .94, -2.22], width: 2.61, depth: .8 }, sorting, M.metal)
  box([.58, .085, .57], [2.95, .9825, -2.22], M.white, sorting)
  box([.49, .045, .51], [2.95, 1.0475, -2.22], M.metal, sorting)
  rod([3.26, .98, -2.43], [3.26, 1.37, -2.43], .016, M.ink, sorting)
  box([.29, .14, .045], [3.26, 1.42, -2.43], M.ink, sorting)
  box([.252, .106, .004], [3.26, 1.42, -2.404], M.blue, sorting)
  for (let i = 0; i < 3; i++) box([.017, .017, .005], [3.18 + i * .055, 1.395, -2.4], M.white, sorting)
  for (const z of [-2.55, -1.89]) rod([1.85, .2, z], [3.37, .2, z], .016, M.metal, sorting)
  const wallDisplay = group('produce_wall_display', [0, 0, 0], true)
  box([5.93, .04, .51], [-.11, 1.66, -2.49], M.wood, wallDisplay)
  for (const x of [-2.6, .1, 2.6]) rod([x, 1.35, -2.75], [x, 1.63, -2.27], .014, M.metal, wallDisplay)
  for (const x of [-3.04, -1.18, .46, 2.8]) box([.018, .07, .48], [x, 1.72, -2.49], M.wood, wallDisplay)
  box([5.91, .035, .018], [-.11, 1.7025, -2.226], M.wood, wallDisplay)
  for (const bay of PRODUCE_STOCK_BAYS.filter(b => b.layout === 'berry')) {
    const [x, y, z] = bay.center
    box([.48, .02, .34], [x, y - .01, z], M.paper, wallDisplay)
    for (const dx of [-.237, .237]) box([.009, .027, .322], [x + dx, y + .014, z], M.green, wallDisplay)
    for (const dz of [-.169, .169]) box([.48, .027, .009], [x, y + .014, z + dz], M.green, wallDisplay)
  }
  box([1.0, .25, .025], [-1.8, 2.1, -2.766], M.green, rear)
  for (const x of [-2.04, -1.56]) {
    cylinder(.07, .024, [x, 2.1, -2.744], x < -1.8 ? M.red : M.yellow, rear).rotation.x = Math.PI / 2
  }

  const display = group('produce_display', [0, 0, 0], true)
  table({ center: [-1.85, .87, .8], width: 2.95, depth: 1.3 }, display)
  box([2.89, .59, 1.22], [-1.85, .435, .8], M.green, display)
  for (const dx of [-1.45, -.475, .475, 1.45]) box([.02, .075, 1.27], [-1.85 + dx, .9195, .8], M.wood, display)
  for (const z of [.165, 1.435]) box([2.88, .075, .02], [-1.85, .9195, z], M.wood, display)
  for (const x of [-2.8, -1.85, -.9]) box([.91, .055, .018], [x, .9095, .615], M.wood, display)
  for (const x of [-2.8, -1.85, -.9]) {
    box([.22, .1, .02], [x, .81, 1.464], M.ink, display)
    box([.182, .061, .004], [x, .81, 1.477], M.white, display)
    for (let i = 0; i < 3; i++) box([.016, .008, .002], [x - .045 + i * .045, .81, 1.481], M.green, display)
  }

  const vegetables = group('produce_vegetable_shelves', [0, 0, 0], true)
  for (const x of [-3.66, -3.06]) for (const z of [-1.55, .11]) rod([x, .018, z], [x, 1.49, z], .016, M.metal, vegetables)
  for (const y of [.79, 1.34]) box([.63, .025, 1.69], [-3.36, y, -.72], M.wood, vegetables)
  for (const bay of PRODUCE_STOCK_BAYS.filter(b => b.layout === 'vegetable')) {
    const [x, y, z] = bay.center
    box([.55, .0075, .52], [x, y - .00375, z], M.paper, vegetables)
    for (const dz of [-.265, .265]) box([.59, .055, .012], [x, y + .0295, z + dz], M.wood, vegetables)
    box([.022, .065, .52], [x + .285, y + .0345, z], M.wood, vegetables)
    box([.004, .048, .14], [x + .299, y + .035, z], M.ink, vegetables)
  }

  const cold = group('produce_refrigeration', [0, 0, 0], true)
  box([1.08, .22, 1.24], [3.06, .16, .24], M.ink, cold)
  box([1.08, 1.72, .08], [3.06, 1.13, -.34], M.white, cold)
  for (const x of [2.54, 3.58]) box([.065, 1.72, 1.15], [x, 1.13, .285], M.white, cold)
  box([.98, .12, 1.15], [3.06, 1.93, .285], M.green, cold)
  for (const y of [.45, .94, 1.43]) {
    box([.97, .035, 1.02], [3.06, y, .32], M.metal, cold)
    box([.97, .05, .025], [3.06, y + .0425, .84], M.white, cold)
    for (const x of [2.79, 3.28]) for (const z of [-.02, .4]) box([.38, .03, .34], [x, y + .034, z], M.paper, cold)
  }
  const rack = group('produce_return_rack', [0, 0, 0], true)
  for (const x of [-1.0, -.16]) for (const z of [1.81, 2.43]) rod([x, .03, z], [x, 1.09, z], .017, M.metal, rack)
  for (const y of [.25, .66, .9]) box([.84, .025, .61], [-.58, y - .0125, 2.12], M.white, rack)
  const cleaning = group('produce_cleaning_cart', [0, 0, 0], true)
  table(S.cleaning, cleaning, M.metal)
  box([.65, .025, .43], [2.73, .22, 2.1], M.green, cleaning)
  cylinder(.05, .2, [2.5, .81, 2.1], M.white, cleaning)
  box([.07, .035, .024], [2.5, .923, 2.1], M.blue, cleaning)
  const bins = group('produce_recycling', [0, 0, 0], true)
  for (const [x, mat] of [[2.55, M.green], [3.23, M.base]] as const) {
    box([.46, .56, .48], [x, .3, 1.37], mat, bins, .035)
    box([.49, .035, .51], [x, .5975, 1.37], M.ink, bins)
    box([.15, .08, .004], [x, .42, 1.613], M.white, bins)
  }
  const initial = buildTaskProps(produceTaskFrame(0, 'everyday'))
  initial.root.userData.taskProp = true; root.add(initial.root)
  const stock = buildTaskProps(produceStockFrame()); stock.root.name = 'produce_persistent_stock'; root.add(stock.root)
  return { root, dispose: () => { stock.dispose(); initial.dispose(); kit.dispose() } }
}
