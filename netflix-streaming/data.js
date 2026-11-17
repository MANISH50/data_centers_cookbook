/* ==========================================================================
   HOW NETFLIX STREAMS: content and map geometry.
   Content only, no logic. Edit text here, then run:  node netflix-streaming/prerender.mjs
   World coordinates: the map is WORLD.w × WORLD.h units. A camera target is
   {x, y} = the point to centre on, zoom = how many times closer than the full map.
   ========================================================================== */

export const WORLD = { w: 4000, h: 2640 };

/* Wire types: colour + legend name. Colour is never the only signal: chips name them. */
export const WIRE_TYPES = {
  req:   { name: 'Requests · control plane', color: '#ff5a4e' },
  video: { name: 'Video bytes · data plane', color: '#2dd4bf' },
  fill:  { name: 'Pre-positioning · fill',   color: '#fbbf24' },
  live:  { name: 'Live',                     color: '#b794ff' }
};

/* Location badges for the "Data-center role" block. */
export const BADGES = {
  device:   'Device',
  isp:      'ISP site',
  ix:       'Internet exchange',
  aws:      'AWS region',
  backbone: 'Netflix backbone'
};

/* Zones: physical places on the map. dc = label shown in Data-center view. */
export const ZONES = [
  { id: 'home', x: 160,  y: 1640, w: 760,  h: 560, label: 'Your home',          dc: 'DEVICE · the outermost edge' },
  { id: 'isp',  x: 1080, y: 1500, w: 760,  h: 660, label: 'Your ISP',           dc: 'ISP SITE · embedded OCAs' },
  { id: 'ix',   x: 1980, y: 1180, w: 780,  h: 620, label: 'Internet exchange',  dc: 'INTERNET EXCHANGE · storage OCAs + peering' },
  { id: 'aws',  x: 1100, y: 120,  w: 1920, h: 900, label: 'AWS cloud',          dc: 'AWS REGIONS · control plane, data, encoding' },
  { id: 'enc',  x: 3160, y: 120,  w: 760,  h: 980, label: 'Encoding factory',   dc: 'AWS EC2 BURST COMPUTE · S3 origin' },
  { id: 'live', x: 2920, y: 1300, w: 1000, h: 760, label: 'Live events',        dc: 'VENUE → AWS LIVE ENCODING → LIVE ORIGIN' },
  { id: 'time', x: 160,  y: 2270, w: 3760, h: 350, label: 'Timeline 2007–2025', dc: 'FROM OWNED DATA CENTERS TO CLOUD + EDGE' }
];

/* Wires: SVG path data in world coordinates, drawn in the direction the dots travel. */
export const WIRES = [
  { id: 'homeIsp',    type: 'req',   d: 'M840 1840 C 1000 1810 1250 1650 1470 1640' },
  { id: 'ispAws',     type: 'req',   d: 'M1560 1590 C 1520 1320 1000 1260 1000 1000 L 1000 380 C 1000 345 1040 331 1120 331' },
  { id: 'zuulSvc',    type: 'req',   d: 'M1790 372 L 1790 452 M2060 372 L 2060 452 M2330 372 L 2330 452' },
  { id: 'svcData',    type: 'req',   d: 'M1340 616 L 1340 680 M1790 616 L 1790 680 M2300 616 L 2300 680' },
  { id: 'manifest',   type: 'req',   d: 'M1120 360 C 900 420 860 900 720 1150 C 620 1330 560 1500 560 1640' },
  { id: 'report',     type: 'req',   d: 'M1260 1700 C 1300 1440 2300 1150 2700 1060 C 2860 1020 2870 800 2870 616' },
  { id: 'reportIx',   type: 'req',   d: 'M2380 1300 C 2420 1180 2560 1100 2700 1060' },
  { id: 'ispHome',    type: 'video', d: 'M1130 1765 C 1000 1790 960 1920 840 1930' },
  { id: 'ixHome',     type: 'video', d: 'M2100 1560 C 1900 1760 1880 2180 1500 2190 C 1200 2200 1000 2110 840 2060' },
  { id: 'encS3',      type: 'fill',  d: 'M3200 880 C 3100 880 3080 740 3000 740' },
  { id: 's3Ix',       type: 'fill',  d: 'M2770 800 C 2770 980 2640 1080 2560 1300' },
  { id: 'ixIsp',      type: 'fill',  d: 'M2080 1330 C 1700 1380 1400 1480 1330 1735' },
  { id: 'ocaPeer',    type: 'fill',  d: 'M1190 1738 C 1230 1670 1290 1670 1330 1738' },
  { id: 'venueEnc',   type: 'live',  d: 'M3250 1640 C 3320 1520 3440 1510 3560 1510' },
  { id: 'encOrigin',  type: 'live',  d: 'M3720 1600 C 3770 1700 3720 1860 3600 1890' },
  { id: 'originIx',   type: 'live',  d: 'M3360 1890 C 3150 1880 2980 1640 2700 1560' },
  { id: 'liveIxIsp',  type: 'live',  d: 'M2080 1520 C 1700 1560 1450 1620 1390 1765' },
  { id: 'liveIspHom', type: 'live',  d: 'M1130 1790 C 1000 1830 960 1980 840 1990' }
];

/* Timeline events (stop 13 lights 2007–2012, stop 14 lights 2015–2025). */
export const TIMELINE = [
  { year: 2007, text: 'Streaming starts, from Netflix’s own data centers', stop: 13 },
  { year: 2008, text: 'Database corruption: no DVDs shipped for 3 days', stop: 13 },
  { year: 2009, text: 'Services begin moving to AWS, rebuilt cloud-native', stop: 13 },
  { year: 2011, text: 'Chaos Monkey and the Simian Army go public', stop: 13 },
  { year: 2012, text: 'Open Connect, Netflix’s own CDN, announced', stop: 13 },
  { year: 2015, text: 'Per-title encoding', stop: 14 },
  { year: 2016, text: 'Last data center closed · 190 countries', stop: 14 },
  { year: 2018, text: 'Per-shot encoding (Dynamic Optimizer)', stop: 14 },
  { year: 2020, text: 'AV1 streaming on Android', stop: 14 },
  { year: 2023, text: 'First live show', stop: 14 },
  { year: 2024, text: 'Live at scale: 65M concurrent streams', stop: 14 }
];

/* Sources shown in the Sources panel. Stops reference them by id. */
export const SOURCES = {
  ocaPdf:     { t: 'Netflix Open Connect Overview (PDF)', u: 'https://openconnect.netflix.com/Open-Connect-Overview.pdf' },
  ocaAppl:    { t: 'Open Connect Appliances: hardware and software', u: 'https://openconnect.netflix.com/en/appliances/' },
  migration:  { t: 'Completing the Netflix Cloud Migration (Feb 2016)', u: 'https://about.netflix.com/en/news/completing-the-netflix-cloud-migration' },
  global:     { t: 'Netflix is now available around the world (Jan 2016)', u: 'https://about.netflix.com/en/news/netflix-is-now-available-around-the-world' },
  apnic:      { t: 'APNIC Blog: Netflix content distribution through Open Connect (2018)', u: 'https://blog.apnic.net/2018/06/20/netflix-content-distribution-through-open-connect/' },
  fill:       { t: 'Netflix Tech Blog: Netflix and Fill', u: 'https://netflixtechblog.com/netflix-and-fill-c43a32b490c0' },
  placement:  { t: 'Netflix Tech Blog: Distributing Content to Open Connect', u: 'https://netflixtechblog.com/distributing-content-to-open-connect-3e3e391d4dc9' },
  activeAct:  { t: 'Netflix Tech Blog: Active-Active for Multi-Regional Resiliency', u: 'https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b' },
  zuul2:      { t: 'Netflix Tech Blog: Zuul 2, the Netflix journey to asynchronous, non-blocking systems', u: 'https://netflixtechblog.com/zuul-2-the-netflix-journey-to-asynchronous-non-blocking-systems-45947377fb5c' },
  shedding:   { t: 'Netflix Tech Blog: Keeping Netflix Reliable Using Prioritized Load Shedding', u: 'https://netflixtechblog.com/keeping-netflix-reliable-using-prioritized-load-shedding-6cc827b02f94' },
  simian:     { t: 'Netflix Tech Blog: The Netflix Simian Army (July 2011)', u: 'https://techblog.netflix.com/2011/07/netflix-simian-army.html' },
  perTitle:   { t: 'The Register: Netflix per-title encode optimization (Dec 2015)', u: 'https://www.theregister.com/2015/12/16/netflix_per_title_encode_optimization/' },
  dynOpt:     { t: 'Netflix Tech Blog: Optimized shot-based encodes for 4K (2020), on per-shot dynamic optimization', u: 'https://netflixtechblog.com/optimized-shot-based-encodes-for-4k-now-streaming-47b516b10bbb' },
  cosmos:     { t: 'Netflix Tech Blog: The Netflix Cosmos Platform (2021)', u: 'https://netflixtechblog.com/the-netflix-cosmos-platform-35c14d9351ad' },
  av1Android: { t: 'Netflix Tech Blog: Netflix Now Streaming AV1 on Android (Feb 2020)', u: 'https://netflixtechblog.com/netflix-now-streaming-av1-on-android-d5264a515202' },
  filmGrain:  { t: 'Netflix Tech Blog: AV1 @ Scale, Film Grain Synthesis (2025)', u: 'https://netflixtechblog.com/av1-scale-film-grain-synthesis-the-awakening-ee09cfdff40b' },
  live1:      { t: 'Netflix Tech Blog: Behind the Streams, Live at Netflix, Part 1 (2025)', u: 'https://netflixtechblog.com/behind-the-streams-live-at-netflix-part-1-d23f917c2f40' },
  liveOrigin: { t: 'Netflix Tech Blog: Netflix Live Origin (Dec 2025)', u: 'https://netflixtechblog.com/netflix-live-origin-41f1b0ad5371' },
  oc2012:     { t: 'TechCrunch: Netflix Rolls Out Its Own CDN, Open Connect (June 2012)', u: 'https://techcrunch.com/2012/06/04/netflix-open-connect/' }
};

/* The 15 stops.
   cam:    camera target {x, y, zoom}
   site:   zone outlined as "the physical site" for the Data-center role
   active: zones kept bright ('*' = all) · wires: wires animated
   tint:   colour of the site outline (a WIRE_TYPES key)
   scene:  optional mini-interaction run by tour.js */
export const STOPS = [
  {
    id: 1, eyebrow: 'Start here', title: 'What happens when you press Play?',
    cam: { x: 2040, y: 1340, zoom: 1 }, site: 'home', tint: 'req',
    active: ['*'], wires: ['homeIsp', 'ispAws', 'ispHome', 's3Ix', 'ixIsp', 'originIx'],
    lines: [
      'In a second or two, your TV talks to the cloud, gets permission, and starts pulling video from a box that is probably inside your own internet provider.',
      'Fly through it stop by stop: scroll, swipe, drag, use the arrow keys, or press Next.',
      'Watch the moving dots: each colour is a different kind of traffic, named in the legend.'
    ],
    chips: ['req', 'video', 'fill', 'live'],
    dc: { badge: 'device', text: 'Five kinds of physical place are involved: your device, your ISP’s site, internet exchanges, AWS regions, and Netflix’s Open Connect network linking them.' },
    src: ['ocaPdf']
  },
  {
    id: 2, eyebrow: 'Two planes', title: 'You press Play',
    cam: { x: 1640, y: 1080, zoom: 1.35 }, site: 'aws', tint: 'req',
    active: ['home', 'isp', 'aws', 'ix'], wires: ['homeIsp', 'ispAws', 'ispHome', 'ixHome'],
    lines: [
      'One press starts two separate journeys.',
      'The control plane (red) runs in AWS: who you are, what you may watch, and where to fetch it from.',
      'The data plane (teal) is the video itself, served by Netflix’s own Open Connect network.'
    ],
    chips: ['req', 'video'],
    dc: { badge: 'aws', text: 'Since early 2016 Netflix has run no data centers of its own for streaming. Compute lives in AWS regions; video lives on Netflix-built appliances inside ISPs and exchanges.' },
    src: ['migration', 'ocaPdf']
  },
  {
    id: 3, eyebrow: 'Your device', title: 'Inside the app',
    cam: { x: 540, y: 1920, zoom: 4.2 }, site: 'home', tint: 'req', scene: 'device',
    active: ['home'], wires: [],
    lines: [
      'Before asking for anything, the app knows what your device can do: resolution, HDR, and codecs such as AV1, HEVC or AVC.',
      'Video is protected by DRM. The app will need a licence for the device’s DRM system (Widevine, PlayReady or FairPlay).',
      'Its adaptive-bitrate (ABR) player keeps a buffer of video and picks a quality to match your connection.'
    ],
    chips: ['req'],
    dc: { badge: 'device', text: 'The device is the outermost edge. It pulls its menus, artwork and settings from AWS. No video has moved yet.' },
    src: ['ocaPdf']
  },
  {
    id: 4, eyebrow: 'Out of the house', title: 'The request leaves home',
    cam: { x: 1080, y: 1220, zoom: 1.9 }, site: 'aws', tint: 'req',
    active: ['home', 'isp', 'aws'], wires: ['homeIsp', 'ispAws'],
    lines: [
      'Your play request travels router → ISP → the internet → an AWS region.',
      'These are small API calls: a few kilobytes, not video.',
      'DNS decides which AWS region answers you.'
    ],
    chips: ['req'],
    dc: { badge: 'aws', text: 'Netflix runs active-active across AWS regions: members are routed by DNS to a nearby region, and any healthy region can serve any member.' },
    src: ['activeAct']
  },
  {
    id: 5, eyebrow: 'The front door', title: 'Zuul, the edge gateway',
    cam: { x: 1900, y: 330, zoom: 2.6 }, site: 'aws', tint: 'req', scene: 'failover',
    active: ['aws'], wires: ['ispAws', 'zuulSvc'],
    lines: [
      'Every request first meets Zuul, Netflix’s edge gateway.',
      'It routes requests to the right service, applies security checks, and can shed less important load to protect the services behind it.',
      'It can also send traffic to another region. Try it: fail a region below.'
    ],
    chips: ['req'],
    dc: { badge: 'aws', text: 'Zuul fronts all of Netflix’s edge services in each region. In a region-wide outage, tools override DNS and move members to a healthy region.' },
    src: ['zuul2', 'activeAct', 'shedding']
  },
  {
    id: 6, eyebrow: 'Hundreds of services', title: 'Microservices',
    cam: { x: 2060, y: 600, zoom: 2.05 }, site: 'aws', tint: 'req',
    active: ['aws'], wires: ['zuulSvc', 'svcData'],
    lines: [
      'Behind Zuul, many small services each do one job: entitlement, profiles, playback, licensing, recommendations, billing.',
      'Data lives in EVCache (a fast cache), Cassandra (a database) and Keystone, the Kafka-based event pipeline.',
      'Titus runs the containers, Spinnaker ships new code, and Chaos Monkey randomly switches servers off to prove the system survives.'
    ],
    chips: ['req'],
    dc: { badge: 'aws', text: 'Services spread across availability zones, and data is copied between regions, so losing one building or one region does not lose member data.' },
    src: ['migration', 'activeAct', 'simian']
  },
  {
    id: 7, eyebrow: 'Choosing the server', title: 'Steering',
    cam: { x: 1900, y: 1000, zoom: 1.55 }, site: 'aws', tint: 'req',
    active: ['aws', 'ix', 'isp', 'home'], wires: ['report', 'reportIx', 'manifest'],
    lines: [
      'The playback service checks your account and licensing, then works out which files you need.',
      'The steering service picks healthy, nearby Open Connect Appliances (OCAs) that hold those files.',
      'Your device gets back a manifest, a ranked list of OCA URLs and a licence.'
    ],
    chips: ['req'],
    dc: { badge: 'aws', text: 'The decision runs in AWS, using data from the edge: every OCA reports its health, the routes it has learned and the files it stores to the control plane in AWS.' },
    src: ['ocaPdf', 'apnic']
  },
  {
    id: 8, eyebrow: 'Weeks earlier', title: 'Before you pressed Play: encoding',
    cam: { x: 3540, y: 620, zoom: 2.6 }, site: 'enc', tint: 'fill', scene: 'encode',
    active: ['enc', 'aws'], wires: ['encS3'],
    lines: [
      'The studio master is split into chunks and shots, and encoded in parallel in the cloud on Cosmos, Netflix’s media platform.',
      'Per-title encoding (2015) gave each title its own settings; per-shot encoding (2018) tunes every shot, judged by the VMAF quality score.',
      'The result is a ladder of qualities in AV1, HEVC and AVC. AV1 film grain synthesis re-creates grain on your device instead of sending it.'
    ],
    chips: ['fill'],
    dc: { badge: 'aws', text: 'Encoding is a burst workload on AWS EC2: it scales up for new releases and down when idle. Masters and finished files are stored in S3, the origin for the edge.' },
    src: ['cosmos', 'perTitle', 'dynOpt', 'filmGrain', 'migration', 'fill']
  },
  {
    id: 9, eyebrow: 'While you sleep', title: 'The overnight fill',
    cam: { x: 2280, y: 1260, zoom: 1.45 }, site: 'ix', tint: 'fill', scene: 'fill',
    active: ['aws', 'enc', 'ix', 'isp'], wires: ['encS3', 's3Ix', 'ixIsp', 'ocaPeer'],
    lines: [
      'Netflix predicts what members will watch, and when.',
      'In off-peak “fill windows” it copies tomorrow’s popular titles to OCAs: the catalogue to storage OCAs at internet exchanges, the most popular titles to OCAs inside ISPs.',
      'OCAs can also fill from each other, saving backbone traffic.'
    ],
    chips: ['fill'],
    dc: { badge: 'backbone', text: 'Files move from the S3 origin in AWS over Netflix’s backbone to exchange sites, then out to ISP sites, mostly at night when networks are quiet.' },
    src: ['fill', 'ocaPdf', 'placement']
  },
  {
    id: 10, eyebrow: 'Down the street', title: 'An OCA inside your ISP',
    cam: { x: 1460, y: 1840, zoom: 3.4 }, site: 'isp', tint: 'video', scene: 'oca',
    active: ['isp'], wires: ['ocaPeer'],
    lines: [
      'An Open Connect Appliance is a Netflix-built server, given free to qualifying ISPs.',
      'It runs FreeBSD and the NGINX web server on bare metal. It stores video files and serves them over HTTPS, and nothing else: no member data.',
      'Netflix lists its current storage appliance at around 200 Gbps and up to 120 TB.'
    ],
    chips: ['video'],
    dc: { badge: 'isp', text: 'The ISP’s building becomes Netflix’s video data center. Netflix supplies the hardware; the ISP supplies space, power and connectivity, and saves upstream traffic.' },
    src: ['ocaAppl', 'ocaPdf']
  },
  {
    id: 11, eyebrow: 'Play!', title: 'Video flows',
    cam: { x: 1420, y: 1880, zoom: 2.1 }, site: 'isp', tint: 'video', scene: 'abr',
    active: ['home', 'isp', 'ix'], wires: ['ispHome', 'ixHome'],
    lines: [
      'The player fetches short segments from the top-ranked OCA.',
      'If your connection slows, ABR steps down the quality ladder; when it recovers, it steps back up.',
      'If an OCA fails, the player moves to the next URL on its list. Try both buttons.'
    ],
    chips: ['video', 'req'],
    dc: { badge: 'isp', text: 'Open Connect serves 100% of Netflix’s video traffic, not AWS. Playback quality data flows back to AWS to improve steering.' },
    src: ['apnic', 'ocaPdf']
  },
  {
    id: 12, eyebrow: 'No time to pre-fill', title: 'Live',
    cam: { x: 2960, y: 1660, zoom: 1.6 }, site: 'live', tint: 'live', scene: 'live',
    active: ['live', 'ix', 'isp', 'home'], wires: ['venueEnc', 'encOrigin', 'originIx', 'liveIxIsp', 'liveIspHom'],
    lines: [
      'Netflix’s first live show was in 2023: Chris Rock’s Selective Outrage.',
      'The venue feed is encoded in real time in the cloud. A custom Live Origin passes segments to Open Connect.',
      'Tyson vs. Paul in November 2024 peaked at 65 million concurrent streams.'
    ],
    chips: ['live'],
    dc: { badge: 'aws', text: 'Live can’t be pre-filled. Encoding runs in AWS in real time; the Live Origin, on EC2, feeds top-tier Open Connect caches, which pass segments down as viewers ask for them.' },
    src: ['live1', 'liveOrigin']
  },
  {
    id: 13, eyebrow: 'How it got here · 1', title: 'Data-center evolution, 2007–2012',
    cam: { x: 1620, y: 2450, zoom: 2.15 }, site: 'time', tint: 'req', scene: 'timeline',
    active: ['time'], wires: [],
    lines: [
      '2007: streaming begins, from Netflix’s own data centers.',
      '2008: a major database corruption stops DVD shipping for three days, and the move to the cloud begins. Services are rebuilt cloud-native on AWS.',
      '2011: Chaos Monkey goes public. 2012: Open Connect is announced.'
    ],
    chips: ['req'],
    dc: { badge: 'aws', text: 'A big relational database in one owned facility was a single point of failure. Netflix chose horizontally scalable cloud services over growing its own data centers.' },
    src: ['migration', 'simian', 'oc2012', 'ocaPdf']
  },
  {
    id: 14, eyebrow: 'How it got here · 2', title: '2015–2025',
    cam: { x: 3060, y: 2450, zoom: 2 }, site: 'time', tint: 'fill', scene: 'timeline',
    active: ['time'], wires: [],
    lines: [
      '2015: per-title encoding. January 2016: the last data center is shut down, and Netflix reaches 190 countries.',
      '2018: per-shot encoding. 2020: AV1 on Android.',
      '2023: the first live show. 2024–25: live at scale.'
    ],
    chips: ['fill', 'live'],
    dc: { badge: 'backbone', text: 'The end state is hybrid: rented, elastic compute in AWS for logic and encoding, plus owned, purpose-built hardware at the network edge for the bytes.' },
    src: ['perTitle', 'migration', 'global', 'dynOpt', 'av1Android', 'live1', 'liveOrigin']
  },
  {
    id: 15, eyebrow: 'Zoom out', title: 'The whole system',
    cam: { x: 2040, y: 1340, zoom: 1 }, site: 'aws', tint: 'video', scene: 'summary',
    active: ['*'], wires: ['homeIsp', 'ispAws', 'zuulSvc', 'svcData', 'manifest', 'report', 'ispHome', 'encS3', 's3Ix', 'ixIsp', 'venueEnc', 'encOrigin', 'originIx'],
    lines: [
      'Brains in the cloud: AWS decides who you are, what you may watch and where to get it.',
      'Bytes at the edge: Open Connect boxes near you send the video.',
      'Prepared in advance: titles are encoded and pre-positioned overnight; only live is made on the fly.'
    ],
    chips: ['req', 'video', 'fill', 'live'],
    dc: { badge: 'aws', text: 'Where it runs, from the device to AWS regions to internet exchanges to ISP sites:', table: [
      ['Device', 'UI and playback'],
      ['AWS regions', 'APIs, data, encoding, steering, live encoding'],
      ['Internet exchanges', 'Storage OCAs'],
      ['ISP sites', 'OCAs serving video']
    ] },
    src: ['ocaPdf', 'migration', 'liveOrigin']
  }
];
