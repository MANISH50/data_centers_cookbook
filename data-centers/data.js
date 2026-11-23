/* ==========================================================================
   INSIDE THE CLOUD: the self-playing 3D tour. Content only, no logic.
   Edit text here, then run:  node data-centers/prerender.mjs
   Each chapter is a list of beats. A beat = a caption shown for `d` seconds,
   a camera [point, az°, el°, distance], a scene cue, optional labels and an optional stat card.
   Points are names from POI (below) or [x, y, z] in metres (the building's centre is 0, 0, 0).
   Every number here comes from the sources listed in SOURCES.
   ========================================================================== */

export const POI = {
  campus: [0, 0, 0], building: [0, 5, 0], hall: [11, 1.5, -1], hallLow: [12, 1, 2], row: [10, 1.3, -11.3],
  power: [-22, 1.5, -10], ups: [-22, 1.2, -12], batteries: [-22, 1, -5], switchgear: [-27, 1.5, -15],
  meetme: [-25, 1.5, 5], noc: [-25, 1.8, 13], security: [-12, 1.5, 16], dock: [-12, 1.5, -17], crah: [28.5, 1.4, 0],
  gens: [-40, 2, 30], sub: [-55, 3, -26], towers: [47, 5, -28], chiller: [38, 1.5, -21], roof: [0, 10.5, 0],
  gate: [-10, 1.5, 48], fence: [-40, 1.5, 48], fibre: [-34, 0.5, 6],
  mast: [-95, 9, -62], phone: [-100, 1.6, -68], wind: [180, 25, -140], solar: [120, 1, 85], town: [-150, 3, 95],
  drsite: [-220, 4, -230],
  sRack: [0, 2.2, -320], sStore: [30, 1.4, -320], sNet: [60, 3, -320], sSizes: [92, 3, -320], sRed: [124, 1.4, -320],
  sTiers: [152, 3, -320], sVirt: [182, 1.8, -320], sGlobe: [214, 5, -320], sPue: [244, 3.5, -320], sSite: [276, 1, -320]
};

/* Sources, as listed in the original magazine. `u` is given where the source has a stable public page. */
export const SOURCES = [
  { id: 'iea', t: 'IEA, Energy and AI (2025): 415 TWh in 2024, ~1.5% of world electricity, ~945 TWh in 2030 (base case)', u: 'https://www.iea.org/reports/energy-and-ai' },
  { id: 'uptime', t: 'Uptime Institute, Global Data Center Survey 2025 (average PUE ~1.54) and Annual Outage Analysis 2025 (power the top cause of serious outages, 54%)' },
  { id: 'google', t: 'Google, Data center efficiency: fleet PUE 1.09 (2024)', u: 'https://datacenters.google/efficiency' },
  { id: 'gemini', t: 'Google, "Measuring the environmental impact of AI inference" (Aug 2025): 0.24 Wh and 0.26 ml of water per median Gemini text prompt' },
  { id: 'msft', t: 'Microsoft, Measuring energy and water efficiency: WUE 0.30 L/kWh (FY24); Microsoft Cloud blog (Dec 2024): zero-water cooling design, pilots in 2026', u: 'https://datacenters.microsoft.com/sustainability/efficiency/' },
  { id: 'lbnl', t: 'Lawrence Berkeley National Laboratory, 2024 United States Data Center Energy Usage Report: US average on-site WUE ≈ 0.36 L/kWh (2023); Meta-reported WUE ≈ 0.18 L/kWh (2023)' },
  { id: 'nvidia', t: 'NVIDIA DGX B300 user guide (~14.5 kW per 8-GPU system); Supermicro GB300 NVL72 datasheet (132–140 kW per rack, 72 GPUs, liquid-cooled)' },
  { id: 'npci', t: 'NPCI UPI product statistics: 21.63 billion transactions in December 2025' },
  { id: 'nrdc', t: 'NRDC, Data Center Efficiency Assessment (2014): server utilization 12–18% on-premises vs ~65% cloud (as cited by AWS)' },
  { id: 'tier', t: 'Uptime Institute Tier Standard: Topology; 12-hour minimum on-site fuel' },
  { id: 'ashrae', t: 'ASHRAE TC 9.9 thermal guidelines: 18–27 °C recommended inlet air' },
  { id: 'nfpa', t: 'NFPA 2001: clean-agent discharge within ~10 s' },
  { id: 'lto', t: 'LTO Program: LTO-10 cartridges, up to 40 TB native' },
  { id: 'anthropic', t: "Anthropic and partner announcements on Claude's compute (AWS Trainium, Google TPUs, NVIDIA GPUs)" },
  { id: 'physics', t: 'Physics: latent heat of water (≈2.26 MJ/kg, so ~0.63 kWh of heat per litre evaporated); speed of light in fibre (~200,000 km/s); heat capacity of air and water' }
];

/* b(text, cam, extras) builds a beat. Default length 8.5 s. */
const b = (text, cam, x = {}) => ({ d: 8.5, text, cam, ...x });

export const CHAPTERS = [
  {
    id: 'ch1', title: 'What is a data center?', sub: 'The cloud has an address', roof: 1,
    beats: [
      b('You pay ₹20 for a cup of tea with UPI. Before the speaker says “payment received”, two banks have checked, agreed and saved your payment.', ['campus', -35, 26, 150], { d: 9 }),
      b('Where did that happen? Not in your phone, not in the shop, but inside big buildings full of computers, maybe hundreds of kilometres away. They are data centers.', ['building', -48, 20, 92]),
      b('A data center is a factory for information. It runs day and night, doing three jobs with data: store, move and compute.', ['hall', -20, 38, 46], { roof: 0, cue: 'smc', labels: [['Store', [6, 3.4, -11]], ['Move', [-24, 3.2, 5]], ['Compute', [18, 3.4, 4]]] }),
      b('Why not just use your phone? YouTube receives far more new video every minute than any phone could hold. So we share giant, always-on computers: “the cloud”.', ['building', 32, 30, 80], { d: 9 }),
      b('The cloud isn’t in the sky. It’s in a warehouse with very good air conditioning.', ['roof', 25, 28, 42], { cue: 'fans', labels: [['Rooftop coolers', [0, 12.6, -6]]] }),
      b('Data centers come in every size: a server closet, a company data center, a shared colocation building, and hyperscale campuses run by the biggest cloud companies.', ['sSizes', 0, 22, 58], { cue: 'sizes', d: 9.5, labels: [['Closet', [76, 2.4, -320]], ['Company', [84, 4, -320]], ['Colocation', [96, 9.5, -320]], ['Hyperscale', [116, 12.5, -320]]] }),
      b('Every one of the 21.63 billion UPI payments made in December 2025 ran through data centers like this.', ['campus', 40, 30, 125], { stat: ['21.63 billion', 'UPI payments in one month (Dec 2025)', 'npci'] }),
      b('ENIAC, one of the first big computers (1945), filled a room of about 167 m² and used around 150 kW. A phone today is millions of times faster. A data center is a building full of today’s computers.', ['hallLow', 30, 14, 26], { roof: 0, d: 10 })
    ]
  },
  {
    id: 'ch2', title: 'The guided tour', sub: 'A football field of humming boxes', roof: 0,
    beats: [
      b('Step inside. The hall is bigger than a football field: loud, bright, chilly, and almost empty of people.', ['hallLow', -70, 8, 20], { d: 8 }),
      b('Most of the building isn’t for computers. It’s for what computers need: power, cooling, network and security. Watch each room light up.', ['building', 0, 72, 78], { cue: 'zones', d: 12 }),
      b('Servers slide into racks: steel cabinets about 2 m tall and 60 cm wide. Height is counted in rack units: 1U is 4.45 cm, and a standard rack has 42.', ['sRack', 18, 12, 9], { cue: 'rack', labels: [['42U rack', [0, 4.6, -320]], ['1U server', [1.2, 2.4, -319]]] }),
      b('Data lives on different kinds of storage, each a trade-off between speed and cost: RAM is your desk, an SSD a filing cabinet that opens instantly, a hard disk a big warehouse, and tape a deep archive.', ['sStore', 0, 18, 13], { cue: 'storage', d: 11, labels: [['RAM', [25.5, 2.4, -320]], ['SSD', [28.5, 2.4, -320]], ['Hard disk', [31.5, 2.4, -320]], ['Tape', [34.5, 2.4, -320]]] }),
      b('One LTO-10 tape cartridge holds up to 40 TB and can sit safely for decades.', ['sStore', 30, 12, 7], { cue: 'storage', p0: .9, stat: ['40 TB', 'on one LTO-10 tape cartridge', 'lto'] }),
      b('Never just one copy. Drives fail every day, so data is kept on several drives (RAID), several servers and often another building. A broken drive is swapped, and the copies quietly rebuild.', ['sStore', -20, 24, 11], { cue: 'copies', d: 10 }),
      b('Every rack has a switch, a small post office. Big sites use spine and leaf: every leaf connects to every spine, so any server is a few hops away, and one spine can fail safely.', ['sNet', 0, 14, 20], { cue: 'spineleaf', d: 10, labels: [['Spine switches', [60, 6.4, -320]], ['Leaf switches', [60, 3.4, -318]], ['Servers', [60, 0.8, -317]]] }),
      b('Most traffic never leaves the building: servers talk to each other far more than to you. Cisco once estimated about 70% stays inside. Engineers call it “east-west” traffic.', ['sNet', 25, 26, 18], { cue: 'eastwest', stat: ['~70%', 'of data center traffic stays inside (Cisco estimate)'] })
    ]
  },
  {
    id: 'ch3', title: 'Meet the servers', sub: 'Computers that never sleep', roof: 0,
    beats: [
      b('A server is any computer whose job is to serve: it waits for requests, like “show me this video” or “save this payment”, and answers them.', ['row', -30, 10, 9], { d: 8 }),
      b('Three shapes: the rack server, a flat “pizza box” 1U or 2U thick; the blade server, thin computers sharing one chassis; and the tower, a desktop-like box for small offices.', ['sRack', -8, 14, 13], { cue: 'shapes', d: 10, labels: [['Rack server', [0, 3, -318.6]], ['Blade chassis', [3.2, 3.4, -320]], ['Tower server', [5.8, 1.9, -320]]] }),
      b('Open the lid: a CPU (the brain), RAM (the desk), drives (the filing cabinet), fans and heatsinks, two power supplies so one can fail safely, and a network card.', [[0, 2.65, -317.9], 30, 42, 3], { cue: 'inside', d: 10, labels: [['CPUs', [-0.2, 2.75, -317.9]], ['RAM', [0.45, 2.75, -317.9]], ['Drives', [0, 2.75, -317.1]], ['Fans', [0, 2.75, -318.4]], ['Power supplies', [-0.55, 2.75, -318.9]], ['Network card', [0.55, 2.75, -318.9]]] }),
      b('Servers are also named for their job: web and app servers answer and think, database servers keep records exact, storage servers are mostly drives, and AI servers do the heavy maths.', ['hall', -25, 45, 34], { cue: 'roles', d: 10, labels: [['Web & app', [4, 3, 0.2]], ['Database', [16, 3, -6.4]], ['Storage', [6, 3, 6.8]], ['AI / GPU', [20, 3, 10.2]]] }),
      b('Edge servers sit close to people, at phone towers and inside internet providers. Mainframes handle huge numbers of critical transactions, like card payments, with almost no downtime.', ['mast', -20, 12, 26], { d: 9 }),
      b('An AI server is built around 8 GPUs. NVIDIA’s DGX B300 is rated at about 14.5 kW: as much as 20 to 30 normal servers.', [[1.9, 1.2, -318.3], -25, 32, 3.8], { cue: 'gpu', stat: ['~14.5 kW', 'one 8-GPU AI server (NVIDIA DGX B300)', 'nvidia'] }),
      b('Why GPUs? AI is mostly multiplying huge grids of numbers. A CPU is a few brilliant chefs; a GPU is a stadium crowd holding coloured cards, thousands doing tiny jobs at once.', ['sRack', 0, 8, 15], { cue: 'crowd', d: 10, ill: 1, labels: [['CPU: a few strong cores', [-6, 6.6, -324]], ['GPU: thousands of small cores', [3, 7.4, -324]]] }),
      b('Rack-scale AI: one NVIDIA GB300 NVL72 rack links 72 GPUs, draws about 132–140 kW and is cooled by liquid flowing through every tray.', [[-4, 2.3, -320], -35, 12, 8.5], { cue: 'airack', stat: ['72 GPUs', 'in one liquid-cooled rack, ~132–140 kW', 'nvidia'], labels: [['Liquid in', [-4.6, 0.6, -319]], ['Liquid out', [-3.4, 4.6, -319]]] })
    ]
  },
  {
    id: 'ch4', title: 'The journey of a request', sub: '0.2 seconds, a thousand kilometres', roof: 0,
    beats: [
      b('Press Enter. First, DNS, the internet’s phone book, turns a name like shop.example.com into a number address: an IP address.', ['phone', -55, 16, 24], { cue: 'req', p0: 0, p1: .14, ill: 1, labels: [['Your phone', [-100, 2.6, -68]], ['Mobile mast', [-95, 17, -62]]] }),
      b('Routers pass your packets hop by hop, over underground and undersea fibre, all the way to the data center’s meet-me room.', ['campus', -60, 30, 120], { cue: 'req', p0: .14, p1: .46, ill: 1, labels: [['Fibre', [-62, 1.5, -12]], ['Meet-me room', [-25, 3.4, 5]]] }),
      b('A firewall checks every packet and blocks anything suspicious. A load balancer, like traffic police, picks a server that isn’t busy.', ['meetme', 40, 30, 22], { cue: 'req', p0: .46, p1: .6, ill: 1, labels: [['Firewall + load balancer', [-18, 3.2, 4]]] }),
      b('The web server works out what you need, the app server does the thinking (prices, stock, your cart), and the database hands back the stored facts.', ['hall', -30, 35, 32], { cue: 'req', p0: .6, p1: .82, ill: 1, labels: [['Web', [4, 3, 0.2]], ['App', [10, 3, 3.6]], ['Database', [16, 3, -6.4]]] }),
      b('Then the answer races back the same way. A normal page takes about a tenth of a second or two.', ['campus', -55, 26, 140], { cue: 'req', p0: .82, p1: 1, ill: 1 }),
      b('Light in fibre covers about 200,000 km per second. Mumbai to Singapore and back is about 8,000 km of cable: at least 40 ms for the light alone. That’s why data centers are built close to their users.', ['campus', 0, 60, 170], { d: 10, stat: ['≥ 40 ms', 'Mumbai ↔ Singapore round trip, light alone', 'physics'] }),
      b('A website looks things up. A chatbot works things out: its answer doesn’t exist until a model writes it, one token at a time on GPU servers, streamed to you as it’s made.', ['hall', 30, 30, 24], { cue: 'chat', d: 10, ill: 1, labels: [['AI servers', [20, 3.2, 10.2]]] }),
      b('Google measured a median Gemini text question at about 0.24 Wh of energy and 0.26 ml of cooling water: roughly five drops.', ['hall', 50, 22, 20], { cue: 'chat', stat: ['0.24 Wh · 0.26 ml', 'median Gemini text prompt (Google, Aug 2025)', 'gemini'] })
    ]
  },
  {
    id: 'ch5', title: 'Power', sub: 'Never, ever switch off', roof: 0,
    beats: [
      b('A data center’s power has one rule: the servers must never notice when anything goes wrong. So power arrives by more than one road, with a backup for the backup.', ['sub', 30, 22, 70], { d: 9 }),
      b('Electricity steps down on its way in: grid → substation → transformer → switchgear → UPS → PDU → the power strip in each rack → each server’s power supply.', ['power', -40, 40, 60], { cue: 'power', d: 11, labels: [['Grid', [-110, 10, -26]], ['Substation', [-55, 6, -26]], ['Switchgear', [-27, 3.4, -15]], ['UPS', [-22, 3.2, -12]], ['PDUs', [-16, 3, -9]], ['Racks', [6, 3.4, -13]]] }),
      b('Every server has two power supplies: one on path A, one on path B, each with its own switchgear, UPS and PDUs. Either path can carry the full load. This is called 2N.', ['power', 20, 45, 40], { cue: 'ab', d: 10, labels: [['Path A', [-10, 3.2, -14]], ['Path B', [-10, 3.2, -12]]] }),
      b('The UPS keeps its batteries permanently connected, so a grid failure causes no gap at all. Batteries are only a bridge: usually 5 to 10 minutes at full load.', ['batteries', 35, 25, 16], { cue: 'ups', labels: [['UPS', [-22, 3, -12]], ['Batteries', [-22, 2.6, -5]]] }),
      b('Now watch a power cut. The grid fails, and in the same instant the UPS batteries carry every server.', ['sub', 60, 30, 95], { cue: 'cut', p0: 0, p1: .4, d: 9, labels: [['Grid: off', [-55, 6, -26]], ['UPS: on battery', [-22, 4, -12]]] }),
      b('About 10 seconds later the diesel generators have started and settled, and the automatic transfer switch moves the load onto them.', ['gens', -30, 22, 34], { cue: 'cut', p0: .4, p1: .75, d: 9, labels: [['Generators running', [-40, 5.4, 30]]] }),
      b('Generators can run for hours: the Uptime Institute’s design standard asks for at least 12 hours of fuel on site. When the grid returns, the load moves back.', ['gens', 25, 30, 40], { cue: 'cut', p0: .75, p1: 1, d: 9, stat: ['12 h', 'minimum fuel on site (Uptime Institute Tier Standard)', 'tier'] }),
      b('Power is the No. 1 cause of big outages: 54% of operators said their most recent serious outage was caused by a power problem.', ['campus', -20, 35, 120], { stat: ['54%', 'of serious outages were power problems (Uptime Institute 2025)', 'uptime'] }),
      b('A large AI campus can need hundreds of megawatts, as much as a city. Getting a big enough grid connection is often the slowest part of building one.', ['sub', -40, 20, 110], { d: 9 })
    ]
  },
  {
    id: 'ch6', title: 'Cooling', sub: 'A room full of hair-dryers', roof: 0,
    beats: [
      b('Almost every watt a server uses turns into heat. The industry’s ASHRAE guidelines recommend inlet air of about 18–27 °C: chilly for a person, comfy for a computer.', ['hallLow', 60, 16, 18], { cue: 'air', stat: ['18–27 °C', 'recommended server inlet air (ASHRAE)', 'ashrae'] }),
      b('Racks face front to front and back to back. The fronts share a cold aisle; the backs share a hot aisle. Containment adds doors and a roof so hot and cold air never mix.', ['row', 90, 18, 12], { cue: 'air', d: 10, labels: [['Cold aisle', [10, 2.6, -11.3]], ['Hot aisle', [10, 2.6, -7.9]]] }),
      b('In many halls the floor is raised about half a metre. Cooling units (CRAHs) push cold air underneath, and it rises through perforated tiles in the cold aisle.', ['crah', -70, 12, 16], { cue: 'air', d: 10, labels: [['CRAH units', [28.5, 3.4, -4]], ['Raised floor', [20, 0.2, -11.3]]] }),
      b('The CRAHs pass the hot air over coils of cold water. A chiller takes the heat out of the water, and cooling towers release it into the outside air.', ['chiller', -40, 28, 50], { cue: 'heatout', d: 10, labels: [['Chillers', [38, 3.6, -21]], ['Cooling towers', [47, 11, -28]]] }),
      b('Cooling towers evaporate a little water to carry away a lot of heat: about 0.63 kWh for every litre. That water is gone into the sky.', ['towers', 30, 18, 34], { cue: 'steam', stat: ['0.63 kWh', 'of heat carried away per litre evaporated', 'physics'] }),
      b('Water efficiency is measured as WUE: litres per kWh of IT energy. Meta ≈ 0.18 (2023), Microsoft 0.30 (FY24), US average 0.36 (2023). Lower is better.', ['towers', -30, 26, 40], { cue: 'steam', d: 9, stat: ['0.18 · 0.30 · 0.36', 'L/kWh: Meta · Microsoft · US average', 'lbnl'] }),
      b('Water carries about 3,500 times more heat than the same volume of air. So AI racks put cold plates on every chip, or sink servers into tanks of fluid, with the same coolant going round in a closed loop.', [[-4, 2.3, -320], 35, 12, 8.5], { cue: 'airack', d: 10, stat: ['~3,500×', 'heat carried by water vs the same volume of air', 'physics'] }),
      b('Microsoft says its 2024 zero-water design, a closed liquid loop with no evaporation, saves over 125 million litres a year per site. The first pilots are due in 2026.', ['roof', -30, 30, 50], { roof: 1, cue: 'fans', d: 9, stat: ['125 million L', 'of water saved per site each year (Microsoft)', 'msft'] })
    ]
  },
  {
    id: 'ch7', title: 'Security, fire and monitoring', sub: 'Harder to enter than an airport', roof: 0,
    beats: [
      b('Security works like an onion, layer after layer. First a fence, a guarded gate and cameras.', ['gate', -20, 18, 34], { cue: 'sec', p0: 0, p1: .4, labels: [['Fence', [-40, 3.5, 48]], ['Gate + guard house', [-10, 4, 48]]] }),
      b('Then a mantrap that lets one person through at a time, and badges and fingerprints for every room. Even the staff need permission for each door.', ['security', 30, 22, 14], { cue: 'sec', p0: .4, p1: 1, labels: [['Mantrap', [-12, 3.6, 16]]] }),
      b('In shared buildings, each customer’s racks sit inside a locked cage. Old drives are wiped, then crushed or shredded on site, so no data leaves on a forgotten disk.', ['hall', 40, 28, 22], { cue: 'cages', labels: [['Locked cages', [20, 3.4, 8.5]]] }),
      b('Fire is fought with gas, not water. VESDA pipes sip the air nonstop and can smell smoke from an overheating cable long before anyone could see it.', ['hall', -50, 20, 18], { cue: 'fire', p0: 0, p1: .45, d: 9, labels: [['VESDA sampling pipe', [8, 4.8, -4]], ['Smoke', [14, 2.6, -3]]] }),
      b('A second detector confirms. Alarms warn people out, doors close, and clean-agent gas floods the room in about 10 seconds. The fire goes out with no mess.', ['hall', -40, 30, 24], { cue: 'fire', p0: .45, p1: 1, d: 9, stat: ['~10 s', 'clean-agent gas discharge (NFPA 2001)', 'nfpa'] }),
      b('Thousands of sensors report every few seconds: temperatures, power, leaks, every door. It flows into DCIM software and the screens of the NOC, watched 24 hours a day.', ['noc', 20, 16, 12], { cue: 'noc', d: 9, labels: [['Control room (NOC)', [-25, 4, 15.6]]] })
    ]
  },
  {
    id: 'ch8', title: 'Redundancy, uptime and tiers', sub: 'A spare for everything', roof: 0,
    beats: [
      b('99.9% sounds perfect, but it still allows almost 9 hours of downtime a year. Everything breaks eventually, so data centers make sure a spare is already there.', ['gens', 40, 30, 46], { stat: ['99.9%', '≈ 9 hours of downtime a year'] }),
      b('N: exactly what you need. The hall needs 4 cooling units and has 4. If one fails, the hall runs short.', ['sRed', 0, 22, 16], { cue: 'red', mode: 'N', labels: [['Needed: 4', [124, 3.6, -320]]] }),
      b('N+1: one spare. Any one unit can fail, or be taken out for service, and everything stays cool.', ['sRed', 0, 22, 16], { cue: 'red', mode: 'N+1' }),
      b('2N: a full second copy, sides A and B, each able to carry everything. 2N+1 adds a spare on top, for places where failure is not an option.', ['sRed', 0, 26, 20], { cue: 'red', mode: '2N', d: 9.5, labels: [['Side A', [120, 2.6, -321.5]], ['Side B', [120, 2.6, -318.5]]] }),
      b('Uptime is counted in nines. 99.9% allows about 8.8 hours of downtime a year, 99.99% about 53 minutes, and 99.999% about 5 minutes. Each extra nine cuts it by ten.', ['sRed', 20, 30, 20], { cue: 'nines', d: 10 }),
      b('The Uptime Institute rates designs Tier I to IV: basic (≈ 28.8 h down a year), spare parts (≈ 22 h), fix-it-while-running (≈ 1.6 h) and fault tolerant (≈ 26 minutes).', ['sTiers', -20, 18, 22], { cue: 'tiers', d: 10.5, labels: [['Tier I', [146, 1, -320]], ['Tier II', [150, 2, -320]], ['Tier III', [154, 3, -320]], ['Tier IV', [158, 4, -320]]] }),
      b('The biggest single point of failure is often the whole building. So banks and clouds run a second site far away, ready to take over after a flood, a fire or a city-wide blackout.', ['campus', -60, 50, 260], { cue: 'dr', d: 9, labels: [['Main site', [0, 14, 0]], ['Second site, far away', [-220, 12, -230]]] })
    ]
  },
  {
    id: 'ch9', title: 'Virtualization and the cloud', sub: 'One machine, many tenants', roof: 0,
    beats: [
      b('Years ago, companies ran one app per server. A 2014 NRDC study found typical company servers busy only 12–18% of the time: like driving a bus with two passengers.', ['sVirt', 0, 20, 14], { cue: 'virt', stage: 0, stat: ['12–18%', 'typical company server utilization (NRDC 2014)', 'nrdc'] }),
      b('A hypervisor splits one physical server into many virtual machines. Each thinks it’s a whole computer: like turning a big house into flats.', ['sVirt', 15, 18, 11], { cue: 'virt', stage: 1, labels: [['Virtual machines', [182, 4.2, -320]], ['Hypervisor', [182, 1.4, -318.8]]] }),
      b('Containers are lighter: lunchboxes that share one operating system and start in seconds. Kubernetes is the dispatcher that places them and restarts any that crash.', ['sVirt', -15, 26, 13], { cue: 'virt', stage: 2, d: 9.5 }),
      b('Rent those slices over the internet, by the minute, and you have the cloud. Cloud servers were typically busy about 65% of the time.', ['sVirt', 0, 30, 16], { cue: 'virt', stage: 3, stat: ['~65%', 'typical cloud server utilization (NRDC 2014, cited by AWS)', 'nrdc'] }),
      b('Clouds group data centers into regions, each with several availability zones: separate buildings with their own power, cooling and network, tens of kilometres apart.', ['sGlobe', 20, 18, 24], { cue: 'globe', d: 10 })
    ]
  },
  {
    id: 'ch10', title: 'Real life, traced', sub: 'Follow what you do through the building', roof: 0,
    beats: [
      b('Every “cloud” thing you do is a short trip through a real building, and every trip costs a little electricity and a little water. Watch four of them.', ['hall', 0, 55, 40], { d: 8 }),
      b('Streaming video leans on edge caches near you, which send most of the bytes, and on huge storage halls holding the video library.', ['hall', -30, 40, 32], { cue: 'trace', mode: 'stream', labels: [['Storage', [6, 3, 6.8]], ['Edge cache near you', [-95, 17, -62]]] }),
      b('A UPI payment leans on databases, logs and redundancy: banks, NPCI and backup sites all running 24/7.', ['hall', 20, 40, 32], { cue: 'trace', mode: 'pay', labels: [['Databases', [16, 3, -6.4]]] }),
      b('A chatbot, or a Claude Code session, does its thinking on racks of AI chips, round trip after round trip, while the coding tools run on your laptop.', ['hall', 45, 30, 26], { cue: 'trace', mode: 'ai', labels: [['AI chips', [20, 3.2, 10.2]]] }),
      b('A Spark job on Databricks starts virtual machines, reads object storage, and shuffles data across the network between its workers.', ['hall', -10, 50, 34], { cue: 'trace', mode: 'spark', labels: [['Workers', [10, 3, 3.6]], ['Object storage', [6, 3, 6.8]]] }),
      b('Anthropic has said it runs Claude on several kinds of AI chips across more than one cloud: AWS Trainium, Google TPUs and NVIDIA GPUs.', ['hall', 60, 24, 22], { cue: 'trace', mode: 'ai', d: 9 })
    ]
  },
  {
    id: 'ch11', title: 'Energy, water and the planet', sub: 'Every watt, every drop', roof: 1,
    beats: [
      b('In 2024, data centers used about 415 TWh of electricity: around 1.5% of the world’s total.', ['campus', 30, 40, 150], { stat: ['415 TWh', 'data center electricity in 2024, ~1.5% of the world’s (IEA)', 'iea'] }),
      b('PUE = total power ÷ power used by the IT equipment. 1.0 would be perfect. The world average is about 1.54; Google reports 1.09 across its fleet for 2024.', ['sPue', 0, 14, 18], { cue: 'pue', d: 11, stat: ['1.54 → 1.09', 'PUE: world average vs Google’s fleet', 'uptime'], labels: [['Average site', [241, 7.4, -320]], ['Best sites', [247, 7.4, -320]]] }),
      b('Big operators sign long contracts with new wind and solar farms. Google aims to run on carbon-free energy every hour of every day by 2030.', ['solar', 40, 24, 120], { cue: 'renew', d: 9 }),
      b('Waste heat doesn’t have to be thrown away. In Nordic cities, heat from data centers is piped into district heating networks that warm whole neighbourhoods.', ['town', 60, 26, 110], { cue: 'heat', d: 9, labels: [['District heating', [-150, 8, 95]]] }),
      b('The full water footprint: water evaporated on site, water evaporated at power stations, and the ultra-pure water used to make the chips. Where a data center is built matters.', ['towers', 10, 24, 60], { cue: 'steam', d: 10 }),
      b('The IEA’s base case has data centers using about 945 TWh in 2030, more than double 2024. The most efficient watt is the one you never use.', ['campus', -30, 50, 170], { d: 9, stat: ['~945 TWh', 'data center electricity in 2030 (IEA base case)', 'iea'] })
    ]
  },
  {
    id: 'ch12', title: 'Planning, building and running', sub: 'Years before the first server', roof: 1,
    beats: [
      b('Where a data center goes decides almost everything else: how much it costs, how fast it is, how much water and carbon it uses, and how safe it is.', ['sSite', 0, 30, 30], { cue: 'site', p0: 0, p1: .2 }),
      b('Planners check power (often a wait of years), several fibre routes, water, risks like floods and earthquakes, the climate, and distance to users: light in fibre needs about 1 ms per 100 km each way.', ['sSite', 20, 34, 30], { cue: 'site', p0: .2, p1: 1, d: 11, labels: [['Power', [266, 6, -322]], ['Fibre', [270, 6, -318]], ['Water', [274, 6, -322]], ['Risks', [278, 6, -318]], ['Climate', [282, 6, -322]], ['Users', [286, 6, -318]]] }),
      b('Then it’s built: land and power first, then design and permits, the shell, and the fit-out with transformers, UPS, generators and chillers.', ['campus', -30, 30, 110], { cue: 'build', d: 11 }),
      b('Commissioning: “load banks”, boxes of heaters that pretend to be servers, run everything at full power, and engineers cut the grid to prove the backups work.', ['gens', 10, 26, 40], { cue: 'commission', d: 9 }),
      b('Go live: servers arrive at the loading dock, are unboxed, racked, cabled and switched on, one hall at a time.', ['hall', -40, 40, 34], { roof: 0, cue: 'golive', d: 9, labels: [['Loading dock', [-12, 3.6, -17]]] }),
      b('A small team runs it 24/7: shift handovers, walk-arounds, swapping failed drives, generator tests, planned maintenance and night alarms, all on checklists, like flying a plane.', ['noc', -30, 30, 26], { roof: 0, cue: 'day', d: 11 })
    ]
  },
  {
    id: 'ch13', title: 'Journey’s end', sub: 'Now you’ve been inside', roof: 1,
    beats: [
      b('Next time a video starts instantly, a payment beeps or an AI answers in seconds, you’ll know the building that made it happen.', ['campus', 60, 30, 140], { cue: 'finale', d: 9 }),
      b('Power, cooling, network, security and spares: all so the servers never notice anything going wrong.', ['campus', 140, 45, 190], { cue: 'finale', d: 9 })
    ]
  }
];

/* Short recaps for the text version (from the original magazine). */
export const RECAPS = {
  ch1: ['A data center is a building full of servers that store, move and compute data.', 'We share them because no phone could do the work alone; “the cloud” is computers in someone else’s data center.', 'They come in every size, from a cupboard to a hyperscale campus.'],
  ch2: ['Most of the floor space supports the computers: power, cooling, network and security.', 'Servers sit in 42U racks; data lives on RAM, SSDs, hard disks and tape, always with extra copies.', 'Switches and fibre connect everything; spine-leaf keeps every server a few hops away.'],
  ch3: ['Servers come in three shapes (rack, blade, tower) and are named for their job (web/app, database, storage, AI, edge, mainframe).', 'Inside: CPU, RAM, drives, fans, two power supplies and a network card.', 'AI servers pack 8 GPUs and use about 14.5 kW; AI racks need liquid cooling.'],
  ch4: ['DNS finds the address; routers carry packets across the internet.', 'Inside: firewall → load balancer → web → app → database, and back.', 'AI answers are generated token by token on GPUs and streamed as they are made.'],
  ch5: ['Power steps down from the grid through substation, transformer, switchgear, UPS and PDUs to each server.', 'Two independent paths, A and B, feed every server.', 'The UPS bridges the gap instantly; generators start in about 10 seconds and can run for many hours.'],
  ch6: ['Nearly all the power a server uses becomes heat.', 'Hot and cold aisles keep air apart; heat moves from servers → CRAH → chilled water → chiller → cooling tower.', 'Cooling towers evaporate water; closed loops and dry coolers save water but can cost energy. AI racks need liquid.'],
  ch7: ['Security is layered: fence, guards, mantraps, biometrics, cages.', 'Old drives are wiped and destroyed on site.', 'Fires are detected early and put out with gas; a 24/7 control room watches thousands of sensors.'],
  ch8: ['Redundancy means a spare is ready before anything fails: N, N+1, 2N, 2N+1.', 'Each extra “nine” of uptime cuts yearly downtime by ten.', 'Tier I–IV rate designs, from basic to fully fault-tolerant; critical services also run in a second site.'],
  ch9: ['A hypervisor slices one server into many virtual machines; containers are lighter boxes sharing one operating system.', 'The cloud rents these slices by the minute.', 'Regions and availability zones keep apps close to users and safe from local failures.'],
  ch10: ['Every online activity is a short trip through real buildings.', 'Streaming leans on edge caches, payments on databases and redundancy, AI on GPU racks, Spark on VMs, storage and the network.', 'GPU-heavy activities cost the most energy and cooling water.'],
  ch11: ['PUE = total power ÷ IT power; the average is about 1.54, the best about 1.1.', 'WUE measures on-site water; power stations and chip factories add more.', 'Clean power contracts, heat reuse and busier servers make data centers greener.'],
  ch12: ['Location is chosen for power, fibre, water, safety, climate and closeness to users.', 'Everything is tested at full load, with fake servers, before going live.', 'A small team runs it 24/7 with walk-arounds, procedures and the control room.'],
  ch13: ['You have followed a data center from the outside fence to the inside of a server, and back out to the planet.']
};

/* REAL PHOTOS that stand in the 3D scene in place of the drawn models (shared/photoboard.js).
   All from Wikimedia Commons under the free licences shown; resized for the web. `at` = chapter.beat where the photo appears. */
export const PHOTOS = [
  { id: "history", file: "photos/history.jpg", w: 1100, h: 754, at: "1.7", title: "A computer room in the 1970s–80s, University of St. Gallen", alt: "An older computer room: a technician at a terminal beside cabinets of computer equipment",
    author: "University of St. Gallen", licence: "CC BY-SA 4.0", licUrl: "https://creativecommons.org/licenses/by-sa/4.0", url: "https://commons.wikimedia.org/wiki/File:Blick_in_einen_Raum_des_HSG-Rechenzentrums_HSGH_022-001118.jpg" },
  { id: "hall", file: "photos/hall.jpg", w: 1100, h: 733, at: "2.0", title: "A real server hall (CERN, Geneva)", alt: "Rows of tall server cabinets in a brightly lit data center hall",
    author: "Florian Hirzinger - www.fh-ap.com", licence: "CC BY-SA 3.0", licUrl: "https://creativecommons.org/licenses/by-sa/3.0", url: "https://commons.wikimedia.org/wiki/File:CERN_Server_03.jpg" },
  { id: "racks", file: "photos/racks.jpg", w: 1100, h: 730, at: "2.2", title: "Racks full of servers", alt: "Tall racks of servers, lit blue, in a data center aisle",
    author: "BalticServers.com", licence: "CC BY-SA 3.0", licUrl: "https://creativecommons.org/licenses/by-sa/3.0", url: "https://commons.wikimedia.org/wiki/File:BalticServers_data_center.jpg" },
  { id: "blade", file: "photos/blade.jpg", w: 1100, h: 936, at: "3.1", title: "A blade chassis: thin servers sharing one box", alt: "A blade server chassis filled with vertical blade servers",
    author: "Redline", licence: "CC BY-SA 3.0", licUrl: "https://creativecommons.org/licenses/by-sa/3.0", url: "https://commons.wikimedia.org/wiki/File:HP_c7000-1.jpg" },
  { id: "inside", file: "photos/inside.jpg", w: 1100, h: 733, at: "3.2", title: "Inside a 1U server, lid off", alt: "A 1U web server with its lid off: fans, heatsinks, memory and drives",
    author: "Rodzilla at English Wikipedia", licence: "CC BY 2.5", licUrl: "https://creativecommons.org/licenses/by/2.5", url: "https://commons.wikimedia.org/wiki/File:Inside_and_Rear_of_Webserver.jpg" },
  { id: "gpu", file: "photos/gpu.jpg", w: 1084, h: 1100, at: "3.5", title: "An 8-GPU board from an AI server", alt: "An NVIDIA HGX board with eight large GPU heatsinks",
    author: "Pokiiri", licence: "CC BY-SA 4.0", licUrl: "https://creativecommons.org/licenses/by-sa/4.0", url: "https://commons.wikimedia.org/wiki/File:Nvidia_DGX-B200-HGX.jpg" },
  { id: "airack", file: "photos/airack.jpg", w: 383, h: 1100, at: "3.7", title: "A rack-scale AI system (GB200 NVL72)", alt: "A tall cabinet filled with stacked GPU compute trays",
    author: "Pokiiri", licence: "CC BY-SA 4.0", licUrl: "https://creativecommons.org/licenses/by-sa/4.0", url: "https://commons.wikimedia.org/wiki/File:Nvidia_DGX_GB200.jpg" },
  { id: "batteries", file: "photos/batteries.jpg", w: 1100, h: 1097, at: "5.3", title: "UPS batteries in a data center", alt: "Long rows of backup batteries in a data center",
    author: "Jelson25", licence: "CC BY 3.0", licUrl: "https://creativecommons.org/licenses/by/3.0", url: "https://commons.wikimedia.org/wiki/File:Datacenter_Backup_Batteries.jpg" },
  { id: "generator", file: "photos/generator.jpg", w: 1100, h: 825, at: "5.6", title: "A standby diesel generator", alt: "A large diesel generator that provides backup power to a data center",
    author: "Mikael Häggström", licence: "CC0", licUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en", url: "https://commons.wikimedia.org/wiki/File:Power_generator_of_a_hospital_data_center.jpg" },
  { id: "aisle", file: "photos/aisle.jpg", w: 825, h: 1100, at: "6.1", title: "A cold aisle between two rows of racks", alt: "A cold aisle between two rows of server cabinets, with perforated floor tiles",
    author: "Robert.Harker", licence: "CC BY-SA 3.0", licUrl: "https://creativecommons.org/licenses/by-sa/3.0", url: "https://commons.wikimedia.org/wiki/File:Cabinet_Asile.jpg" },
  { id: "crah", file: "photos/crah.jpg", w: 1100, h: 825, at: "6.2", title: "Cooling units on a raised floor", alt: "A row of cooling cabinets standing on a raised floor with vent tiles",
    author: "Robert.Harker", licence: "CC BY-SA 3.0", licUrl: "https://creativecommons.org/licenses/by-sa/3.0", url: "https://commons.wikimedia.org/wiki/File:CRAC_Cabinets_2.jpg" },
  { id: "tower", file: "photos/tower.jpg", w: 1100, h: 825, at: "6.4", title: "Cooling towers on a data center (Mesa, Arizona)", alt: "Rows of cooling-tower fans on the roof of a data center",
    author: "Rsparks3", licence: "CC0", licUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en", url: "https://commons.wikimedia.org/wiki/File:Data_center_cooling_tower.jpg" },
  { id: "cage", file: "photos/cage.jpg", w: 1100, h: 732, at: "7.2", title: "A locked customer cage", alt: "Server racks inside a locked mesh cage in a colocation data center",
    author: "Virtuo Doc", licence: "CC BY-SA 4.0", licUrl: "https://creativecommons.org/licenses/by-sa/4.0", url: "https://commons.wikimedia.org/wiki/File:Cage_Quelle_EMC_HostCo_GmbH.jpg" },
  { id: "fire", file: "photos/fire.jpg", w: 1100, h: 825, at: "7.4", title: "A gas fire-suppression discharge", alt: "A gas fire suppression system discharging in a server room, filling it with mist",
    author: "Keith4048", licence: "Public domain", licUrl: "", url: "https://commons.wikimedia.org/wiki/File:COMPUTER_ROOM_DISCHARGE.JPG" },
  { id: "loadbank", file: "photos/loadbank.jpg", w: 1100, h: 825, at: "12.3", title: "A load bank testing a generator", alt: "An air-cooled load bank used to test a large standby generator",
    author: "Wtshymanski", licence: "CC BY-SA 4.0", licUrl: "https://creativecommons.org/licenses/by-sa/4.0", url: "https://commons.wikimedia.org/wiki/File:Air_cooled_load_bank.jpg" },
  { id: "tech", file: "photos/tech.jpg", w: 1100, h: 717, at: "12.5", title: "A technician at work", alt: "A technician checking network equipment in a rack",
    author: "Bill Branson (Photographer)", licence: "Public domain", licUrl: "", url: "https://commons.wikimedia.org/wiki/File:Network_server_and_technician.jpg" },
];
for (const ph of PHOTOS) { const [c, i] = ph.at.split('.').map(Number); const beat = CHAPTERS[c - 1].beats[i]; beat.photo = ph.id; if (ph.labels) beat.plabels = ph.labels; }
