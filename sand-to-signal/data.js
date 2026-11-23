/* ==========================================================================
   FROM SAND TO SIGNAL: content and 3D layout.
   Content only, no logic. Edit text here, then run:  node sand-to-signal/prerender.mjs
   Stations sit along a production line in the 3D world (x grows left → right).
   A stop's camera = station centre + `look` offset, viewed from `view`:
     az = angle around (degrees, 0 = from the front, +z), el = height angle (degrees), dist = distance.
   ========================================================================== */

export const STATIONS = {
  sand:   { x: 0,   z: 0 },
  purify: { x: 34,  z: -6 },
  czo:    { x: 68,  z: 0 },
  slice:  { x: 102, z: -6 },
  litho:  { x: 136, z: 0 },
  layers: { x: 170, z: -6 },
  fet:    { x: 204, z: 0 },
  wires:  { x: 238, z: -6 },
  pack:   { x: 272, z: 0 },
  nand:   { x: 306, z: -6 },
  adder:  { x: 340, z: 0 },
  cpu:    { x: 374, z: -6 },
  screen: { x: 408, z: 0 }
};

/* "Where it happens": the kind of place each step runs in. */
export const PLACES = {
  quarry:  'Quarry or mine',
  plant:   'Chemical plant',
  crystal: 'Crystal-growing plant',
  wafer:   'Wafer factory',
  fab:     'Chip fab cleanroom',
  osat:    'Packaging and test plant',
  chip:    'Inside the chip',
  device:  'Your device or a data center'
};

export const SOURCES = {
  asmlHow:    { t: 'ASML: How microchips are made', u: 'https://www.asml.com/en/technology/all-about-microchips/how-microchips-are-made' },
  asmlSteps:  { t: 'ASML: Deposition, resist, lithography, etch, ionization, packaging (2023)', u: 'https://www.asml.com/en/news/stories/2021/semiconductor-manufacturing-process-steps' },
  asmlBasics: { t: 'ASML: Microchip basics', u: 'https://www.asml.com/en/technology/all-about-microchips/microchip-basics' },
  asmlLight:  { t: 'ASML: Light and lasers (DUV and EUV light sources)', u: 'https://www.asml.com/en/technology/lithography-principles/light-and-lasers' },
  usgs:       { t: 'USGS Mineral Commodity Summaries 2025: Silicon (PDF)', u: 'https://pubs.usgs.gov/periodicals/mcs2025/mcs2025-silicon.pdf' },
  wPoly:      { t: 'Wikipedia: Polycrystalline silicon (Siemens process)', u: 'https://en.wikipedia.org/wiki/Polycrystalline_silicon' },
  wCz:        { t: 'Wikipedia: Czochralski method', u: 'https://en.wikipedia.org/wiki/Czochralski_method' },
  wWafer:     { t: 'Wikipedia: Wafer (electronics)', u: 'https://en.wikipedia.org/wiki/Wafer_(electronics)' },
  wFab:       { t: 'Wikipedia: Semiconductor device fabrication', u: 'https://en.wikipedia.org/wiki/Semiconductor_device_fabrication' },
  wMulti:     { t: 'Wikipedia: Multigate device (FinFET, gate-all-around)', u: 'https://en.wikipedia.org/wiki/Multigate_device' },
  wNand:      { t: 'Wikipedia: NAND logic', u: 'https://en.wikipedia.org/wiki/NAND_logic' },
  wAdder:     { t: 'Wikipedia: Adder (electronics)', u: 'https://en.wikipedia.org/wiki/Adder_(electronics)' },
  wCycle:     { t: 'Wikipedia: Instruction cycle (fetch–decode–execute)', u: 'https://en.wikipedia.org/wiki/Instruction_cycle' },
  wFb:        { t: 'Wikipedia: Framebuffer', u: 'https://en.wikipedia.org/wiki/Framebuffer' }
};

/* The 15 stops.
   station: which 3D model · view/look: camera · scale: approximate size label for the scale badge
   place: "Where it happens" · lab: the hands-on control (run by tour.js) · ill: true = the model is an illustration */
export const STOPS = [
  {
    id: 1, eyebrow: 'Start here', title: 'From a grain of sand to a pixel',
    station: 'overview', look: [150, 0, -3], view: { az: -64, el: 20, dist: 125 }, scale: 'The whole journey',
    lines: [
      'Every phone, laptop and data-center server runs on chips made from one of the most common materials on Earth.',
      'Follow it all the way: from sand, to a crystal, to billions of switches, to a sum, to a pixel that lights up.',
      'Drag to look around any 3D model. Use Next, the arrow keys or the scroll wheel to move on.'
    ],
    place: 'quarry', where: 'The journey crosses quarries, chemical plants, crystal growers, chip fabs, packaging plants and, finally, your device.',
    lab: 'start', src: ['asmlBasics']
  },
  {
    id: 2, eyebrow: 'Raw material', title: 'Sand and quartz',
    station: 'sand', look: [0, 1.5, 0], view: { az: 18, el: 22, dist: 16 }, scale: '≈ centimetres',
    lines: [
      'Silicon is the second most abundant element on Earth, after oxygen.',
      'It never appears on its own: in sand and quartz it is bonded to oxygen as silicon dioxide (SiO₂).',
      'Chipmakers start from high-purity quartz or silica sand.'
    ],
    place: 'quarry', where: 'Quartz and quartzite are mined, then shipped to plants that turn them into silicon metal.',
    lab: 'atoms', src: ['asmlBasics', 'usgs']
  },
  {
    id: 3, eyebrow: 'Make it pure', title: 'Purifying silicon',
    station: 'purify', look: [34, 2.5, -6], view: { az: -14, el: 18, dist: 20 }, scale: '≈ metres (factory equipment)',
    lines: [
      'First, quartz is reduced to silicon metal in a furnace. That metal is pure enough for alloys, but nowhere near pure enough for chips.',
      'Next, the Siemens process turns it into a gas (trichlorosilane), distils it, and grows ultra-pure silicon onto hot rods inside a reactor.',
      'The rods are broken into chunks of polysilicon: the feedstock for chips.'
    ],
    place: 'plant', where: 'Silicon metal is made in furnace plants. Ultra-high-purity polysilicon comes from specialised chemical plants.',
    lab: 'reactor', src: ['usgs', 'wPoly']
  },
  {
    id: 4, eyebrow: 'One perfect crystal', title: 'Growing a crystal',
    station: 'czo', look: [68, 3.2, 0], view: { az: 16, el: 12, dist: 17 }, scale: '≈ metres tall',
    lines: [
      'The polysilicon is melted in a crucible. A tiny seed crystal is dipped in, then slowly pulled up while it turns.',
      'Atoms line up behind the seed, so the whole “salami-shaped” ingot is one single crystal.',
      'This is the Czochralski method, invented by Polish scientist Jan Czochralski over a hundred years ago.'
    ],
    place: 'crystal', where: 'Crystal pullers at wafer makers grow the ingots that become most chip wafers.',
    lab: 'pull', src: ['wCz', 'asmlSteps', 'wWafer']
  },
  {
    id: 5, eyebrow: 'Thin slices', title: 'Slicing wafers',
    station: 'slice', look: [102, 1.6, -6], view: { az: 28, el: 24, dist: 15 }, scale: '300 mm wafers',
    lines: [
      'The ingot is sliced into thin discs called wafers, often with diamond wire saws.',
      'Each wafer is etched and polished until its surface is almost atomically smooth.',
      'Most advanced chips are made on 300 mm (12-inch) wafers.'
    ],
    place: 'wafer', where: 'Wafer factories slice, polish and clean the wafers, then ship them to chip fabs in sealed boxes.',
    lab: 'slice', src: ['asmlSteps', 'wWafer']
  },
  {
    id: 6, eyebrow: 'Printing with light', title: 'Cleanroom and lithography',
    station: 'litho', look: [136, 2.4, 0], view: { az: -24, el: 16, dist: 19 }, scale: 'Patterns: nanometres',
    lines: [
      'The wafer is coated with a light-sensitive resist. A lithography machine shines light through a mask (the “reticle”) to print a chip pattern onto it.',
      'The finest layers use extreme ultraviolet (EUV) light with a 13.5 nm wavelength, bounced off mirrors. Less critical layers use deep ultraviolet (DUV) light through lenses.',
      'It all happens in cleanrooms about 10,000 times cleaner than outside air.'
    ],
    place: 'fab', where: 'Fab cleanrooms filter and recirculate their air nonstop. Workers wear “bunny suits”.',
    lab: 'expose', src: ['asmlSteps', 'asmlLight', 'asmlHow']
  },
  {
    id: 7, eyebrow: 'Layer by layer', title: 'Deposit, etch, implant',
    station: 'layers', look: [170, 1.2, -6], view: { az: 26, el: 26, dist: 13 }, scale: 'Layers: nanometres thick',
    lines: [
      'Chips are built up layer by layer. Thin films are deposited; resist is coated and exposed; etching carves the pattern; ions are implanted to tune how the silicon conducts.',
      'This loop repeats many times. Modern chips can have up to 100 layers, all aligned to nanometre precision.',
      'Making a chip takes hundreds to thousands of steps and can take months.'
    ],
    place: 'fab', where: 'Robots carry wafers from machine to machine inside the fab, 24 hours a day.',
    lab: 'steps', src: ['asmlSteps', 'asmlHow']
  },
  {
    id: 8, eyebrow: 'The switch', title: 'The transistor',
    station: 'fet', look: [204, 1.2, 0], view: { az: 32, el: 24, dist: 11 }, scale: '≈ nanometres',
    lines: [
      'A transistor is a tiny electrical switch. A voltage on its gate lets current flow from source to drain, or stops it.',
      'Modern transistors are 3D: the gate wraps around thin silicon fins (FinFET), and in the newest designs right around stacked sheets (gate-all-around).',
      'A fingernail-sized chip can hold billions of them.'
    ],
    place: 'chip', where: 'These switches are formed in the bottom layers of the chip, in the silicon itself.',
    lab: 'gate', src: ['asmlBasics', 'wMulti'], ill: true
  },
  {
    id: 9, eyebrow: 'Connecting billions', title: 'Wiring it up',
    station: 'wires', look: [238, 1.8, -6], view: { az: -30, el: 22, dist: 14 }, scale: 'Nanometres to micrometres',
    lines: [
      'Billions of switches are useless until they are connected. Above the transistors, many layers of tiny metal wires are built.',
      'Wires in one layer run one way, the next layer the other way, with little vertical “vias” joining them.',
      'The lowest wires are the finest; the top ones are thicker, to carry power.'
    ],
    place: 'fab', where: 'The wiring layers are made in the same fab, after the transistors.',
    lab: 'explode', src: ['wFab', 'asmlHow'], ill: true
  },
  {
    id: 10, eyebrow: 'One chip at a time', title: 'Dicing, testing, packaging',
    station: 'pack', look: [272, 1.6, 0], view: { az: 22, el: 26, dist: 15 }, scale: 'Thumb-sized package',
    lines: [
      'A diamond saw dices the finished wafer into individual chips, called dies. One 300 mm wafer can hold thousands of small dies or just a few dozen big ones.',
      'Dies are tested. A good die is placed on a substrate that routes its signals out, and a heat spreader goes on top.',
      'The finished package is about the size of your thumb.'
    ],
    place: 'osat', where: 'Packaging and test plants, often run by separate companies, turn bare dies into finished chips.',
    lab: 'package', src: ['asmlSteps']
  },
  {
    id: 11, eyebrow: 'Switches → logic', title: 'Building a logic gate',
    station: 'nand', look: [306, 4, -6], view: { az: 0, el: 10, dist: 14 }, scale: '4 transistors',
    lines: [
      'Connect four transistors the right way and you get a NAND gate: its output is 0 only when both inputs are 1.',
      'NAND is “functionally complete”: with enough of them you can build every other logic circuit, from adders to whole processors.',
      'Click the inputs and watch which switches conduct.'
    ],
    place: 'chip', where: 'Gates like this are made of transistors and wires in the chip’s lowest layers.',
    lab: 'nand', src: ['wNand'], ill: true
  },
  {
    id: 12, eyebrow: 'Logic → arithmetic', title: 'Adding two numbers',
    station: 'adder', look: [340, 1.4, 0], view: { az: 0, el: 30, dist: 15 }, scale: 'Four full adders',
    lines: [
      'Computers count in binary. A full adder adds two bits plus a carry; chain four of them and you can add two 4-bit numbers.',
      'The carry “ripples” from one adder to the next, just like carrying a 1 when you add on paper.',
      'Pick two numbers and watch the carry travel.'
    ],
    place: 'chip', where: 'Adders like this sit inside the processor’s arithmetic logic unit (ALU).',
    lab: 'adder', src: ['wAdder'], ill: true
  },
  {
    id: 13, eyebrow: 'Arithmetic → a program', title: 'A tiny CPU',
    station: 'cpu', look: [374, 3, -6], view: { az: -6, el: 22, dist: 16 }, scale: 'A toy processor',
    lines: [
      'A processor repeats one cycle again and again: fetch an instruction from memory, decode it, execute it.',
      'This toy CPU runs a five-line program: load two numbers, add them with the adder from the last stop, and store the result to the screen.',
      'Real CPUs overlap many instructions at once in a pipeline, billions of times per second.'
    ],
    place: 'chip', where: 'In a real chip, this happens in the processor core, with memory caches right next to it.',
    lab: 'cpu', src: ['wCycle'], ill: true
  },
  {
    id: 14, eyebrow: 'Output!', title: 'A pixel lights up',
    station: 'screen', look: [409, 3.4, 0], view: { az: 12, el: 8, dist: 15 }, scale: 'Your screen',
    lines: [
      'The result is written into a frame buffer: a block of memory holding a number for every pixel on the screen.',
      'Each pixel is three numbers, for red, green and blue, from 0 to 255. Display hardware turns them into light.',
      'The CPU’s answer appears as digits. Mix your own pixel colour below.'
    ],
    place: 'device', where: 'The frame buffer lives in the graphics memory of your phone or computer.',
    lab: 'rgb', src: ['wFb'], ill: true
  },
  {
    id: 15, eyebrow: 'Zoom out', title: 'The whole journey',
    station: 'overview', look: [260, 0, -3], view: { az: 62, el: 24, dist: 140 }, scale: 'Sand → signal',
    lines: [
      'Sand became pure silicon, then a single crystal, then wafers printed with light, layer after layer.',
      'Billions of switches became gates, gates became an adder, and the adder ran a program.',
      'The program’s answer became numbers in memory, and the numbers became light. The same chips fill the servers in data centers.'
    ],
    place: 'device', where: 'Where each step happens:', table: [
      ['Quarry', 'Quartz and silica sand'],
      ['Chemical plant', 'Silicon metal, then ultra-pure polysilicon'],
      ['Crystal grower and wafer factory', 'Ingots, then polished wafers'],
      ['Chip fab cleanroom', 'Lithography, deposition, etch, implant, wiring'],
      ['Packaging and test plant', 'Dicing, testing, packaging'],
      ['Your device or a data center', 'Logic, programs, pixels']
    ],
    lab: 'finale', src: ['asmlHow', 'asmlBasics']
  }
];
