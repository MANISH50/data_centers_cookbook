/* ==========================================================================
   HOW THE INTERNET MOVES DATA: the self-playing walkthrough of real photos. Content only, no logic.
   Edit text here, then run:  node internet/prerender.mjs
   Each chapter is a list of beats. A beat = a caption shown for `d` seconds over a real photo:
     photo: an id from PHOTOS · focus: [u, v, zoom] the part of the photo to centre (u across, v down, 0..1)
     plabels: [[text, [u, v]], …] labels pinned to the photo · cue: a small flat diagram (diagrams.js) for ideas
     a camera can't see · stat: [value, label, sourceId] · p0/p1: diagram progress range.
   Every number here comes from the sources listed in SOURCES. Photos: Wikimedia Commons, credited in PHOTOS.
   ========================================================================== */

/* Cities on the map [lat, lon]. */
export const CITIES = {
  mumbai: { n: 'Mumbai', ll: [19.08, 72.88] }, chennai: { n: 'Chennai', ll: [13.08, 80.27] }, singapore: { n: 'Singapore', ll: [1.35, 103.82] },
  hongkong: { n: 'Hong Kong', ll: [22.32, 114.17] }, tokyo: { n: 'Tokyo', ll: [35.68, 139.69] }, sydney: { n: 'Sydney', ll: [-33.87, 151.21] },
  dubai: { n: 'Dubai', ll: [25.2, 55.27] }, marseille: { n: 'Marseille', ll: [43.3, 5.37] }, frankfurt: { n: 'Frankfurt', ll: [50.11, 8.68] },
  amsterdam: { n: 'Amsterdam', ll: [52.37, 4.9] }, london: { n: 'London', ll: [51.51, -0.13] }, lisbon: { n: 'Lisbon', ll: [38.72, -9.14] },
  newyork: { n: 'New York', ll: [40.71, -74.01] }, ashburn: { n: 'Ashburn (Virginia)', ll: [39.04, -77.49] }, losangeles: { n: 'Los Angeles', ll: [34.05, -118.24] },
  saopaulo: { n: 'São Paulo', ll: [-23.55, -46.63] }, fortaleza: { n: 'Fortaleza', ll: [-3.73, -38.53] }, lagos: { n: 'Lagos', ll: [6.52, 3.38] },
  capetown: { n: 'Cape Town', ll: [-33.92, 18.42] }
};

/* An ILLUSTRATIVE network: sea cables follow rough ocean waypoints [lat, lon]; land links join cities overland.
   These are not real cable systems or real routes; they only show how paths form. */
export const LINKS = [
  { id: 'atl1', a: 'newyork', b: 'london', sea: [[40.3, -70], [42, -50], [49, -20], [50.2, -6]] },
  { id: 'atl2', a: 'ashburn', b: 'lisbon', sea: [[36.8, -74.5], [37, -45], [38.5, -15]] },
  { id: 'med', a: 'marseille', b: 'mumbai', sea: [[40, 7], [36.5, 14], [33.5, 26], [31.5, 32.2], [28.5, 33.2], [20, 38.4], [12.6, 43.6], [12.5, 52], [17, 66]] },
  { id: 'gulf', a: 'mumbai', b: 'dubai', sea: [[20, 66], [23.5, 59.5], [26.2, 56.6]] },
  { id: 'bay', a: 'chennai', b: 'singapore', sea: [[11, 84], [6, 91], [5.5, 96], [4, 99]] },
  { id: 'arab', a: 'mumbai', b: 'singapore', sea: [[14, 71], [6, 76], [5, 82], [5.6, 95], [4, 99]] },
  { id: 'scs', a: 'singapore', b: 'hongkong', sea: [[3, 106], [10, 111], [18, 114.5]] },
  { id: 'jpn', a: 'hongkong', b: 'tokyo', sea: [[22, 118], [26, 124], [31, 132], [34, 139]] },
  { id: 'pac1', a: 'losangeles', b: 'tokyo', sea: [[33, -122], [33, -150], [33, -180], [34, 160], [34.5, 145]] },
  { id: 'pac2', a: 'sydney', b: 'losangeles', sea: [[-31, 156], [-20, 175], [0, -165], [20, -140], [32, -122]] },
  { id: 'aus', a: 'sydney', b: 'singapore', sea: [[-36, 145], [-35, 125], [-30, 112], [-12, 110], [-6, 106], [-1, 105]] },
  { id: 'sat', a: 'fortaleza', b: 'lisbon', sea: [[0, -32], [15, -27], [30, -18], [37, -11]] },
  { id: 'wafr', a: 'capetown', b: 'lisbon', sea: [[-30, 14], [-15, 9], [0, 3], [4, 3], [10, -18], [25, -18], [35, -11]] },
  { id: 'lag', a: 'lagos', b: 'fortaleza', sea: [[4, 3], [0, -15], [-2, -33]] },
  { id: 'saf', a: 'capetown', b: 'mumbai', sea: [[-36, 25], [-25, 40], [-5, 52], [10, 62], [17, 70]] },
  { id: 'l-eu1', a: 'london', b: 'amsterdam' }, { id: 'l-eu2', a: 'amsterdam', b: 'frankfurt' }, { id: 'l-eu3', a: 'frankfurt', b: 'marseille' },
  { id: 'l-eu4', a: 'lisbon', b: 'marseille' }, { id: 'l-eu5', a: 'london', b: 'marseille' }, { id: 'l-us1', a: 'newyork', b: 'ashburn' },
  { id: 'l-us2', a: 'ashburn', b: 'losangeles' }, { id: 'l-in', a: 'mumbai', b: 'chennai' }, { id: 'l-br', a: 'saopaulo', b: 'fortaleza' }
];

export const SOURCES = [
  { id: 'itu', t: 'ITU, Facts and Figures / ICT statistics (2026): 76% of the world’s population online, about 6.3 billion people; 2 billion offline', u: 'https://www.itu.int/en/ITU-D/Statistics/pages/stat/default.aspx' },
  { id: 'tg', t: 'TeleGeography, Submarine Cable FAQs (2026): 600+ active and planned cables; 1.5 million+ km; garden-hose width; ~200 faults a year (ICPC data); 25-year design life; satellites ~0.37% of US international capacity (FCC)', u: 'https://www2.telegeography.com/submarine-cable-faqs-frequently-asked-questions' },
  { id: 'rfc791', t: 'RFC 791, Internet Protocol (IPv4): 32-bit addresses; time to live', u: 'https://www.rfc-editor.org/rfc/rfc791' },
  { id: 'rfc8200', t: 'RFC 8200, Internet Protocol, Version 6 (IPv6): addresses grow from 32 to 128 bits', u: 'https://www.rfc-editor.org/rfc/rfc8200' },
  { id: 'ripe', t: 'RIPE NCC, IPv4 run-out: final IPv4 pool exhausted in November 2019', u: 'https://www.ripe.net/manage-ips-and-asns/ipv4/ipv4-run-out' },
  { id: 'rfc1034', t: 'RFC 1034, Domain Names: Concepts and Facilities (DNS)', u: 'https://www.rfc-editor.org/rfc/rfc1034' },
  { id: 'iana', t: 'IANA, Root Servers: 13 named authorities; root-servers.org: 2,046 instances run by 12 independent operators (Nov 2026)', u: 'https://www.iana.org/domains/root/servers' },
  { id: 'rfc4271', t: 'RFC 4271, A Border Gateway Protocol 4 (BGP-4): exchanging network reachability information', u: 'https://www.rfc-editor.org/rfc/rfc4271' },
  { id: 'peeringdb', t: 'PeeringDB: public database of networks, internet exchanges and facilities', u: 'https://www.peeringdb.com/' },
  { id: 'rfc9293', t: 'RFC 9293, Transmission Control Protocol (TCP): reliable, in-order byte stream with retransmission', u: 'https://www.rfc-editor.org/rfc/rfc9293' },
  { id: 'rfc768', t: 'RFC 768, User Datagram Protocol (UDP): delivery and duplicate protection are not guaranteed', u: 'https://www.rfc-editor.org/rfc/rfc768' },
  { id: 'rfc8446', t: 'RFC 8446, The Transport Layer Security (TLS) Protocol Version 1.3', u: 'https://www.rfc-editor.org/rfc/rfc8446' },
  { id: 'trace', t: 'Wikipedia, Traceroute', u: 'https://en.wikipedia.org/wiki/Traceroute' },
  { id: 'cut2008', t: 'Wikipedia, 2008 submarine cable disruption', u: 'https://en.wikipedia.org/wiki/2008_submarine_cable_disruption' },
  { id: 'physics', t: 'Physics: light in glass fibre travels at about 200,000 km/s (about two-thirds of its speed in a vacuum); distances are great-circle distances between city centres' },
  { id: 'ne', t: 'Coastlines: Natural Earth 1:110m land (public domain), via the world-atlas package', u: 'https://www.naturalearthdata.com/' }
];

const b = (text, x = {}) => ({ d: 10.5, text, ...x });

export const CHAPTERS = [
  { id: "ch1", title: "A network of networks", sub: "What “the internet” really is", where: "Everywhere",
    beats: [
      b("Tap send. In a fraction of a second, your message can cross an ocean. Where does it actually go?", { photo: "fibre", d: 9.5 }),
      b("The internet isn’t one machine or one company. It’s a huge number of separate networks, run by phone companies, universities, cloud companies and more, that agree to carry each other’s traffic.", { photo: "telecom-tech", d: 11.5, cue: "nets" }),
      b("The ITU estimates that in 2026, 76% of the world’s people are online: about 6.3 billion. About 2 billion are still offline.", { photo: "code", focus: [0.5,0.5,1.2], cue: "cities", stat: ["6.3 billion","people online in 2026 (76%); 2 billion offline","itu"] }),
      b("It is surprisingly physical: copper and glass cables under streets and oceans, radio links, and buildings full of routers. Satellites carry only a tiny share: about 0.37% of US international capacity.", { photo: "cable-samples", d: 11.5, stat: ["~0.37%","of US international capacity is satellite (FCC, via TeleGeography)","tg"] }),
      b("Let’s follow one message from a phone in Mumbai to a server in London, and back.", { photo: "fibre", cue: "route", p0: 0, p1: 0.5, from: "mumbai", to: "london" })
    ]
  },
  { id: "ch2", title: "Packets", sub: "Small envelopes of data", where: "Your device",
    beats: [
      b("Your photo isn’t sent in one piece. It’s cut into small packets: little envelopes of data.", { photo: "containers", cue: "pkt", p0: 0, p1: 0.35 }),
      b("Every packet has a header, like an envelope: where it came from, where it’s going, and which piece it is.", { photo: "containers", focus: [0.5,0.6,1.25], cue: "pkt", p0: 0.35, p1: 0.6 }),
      b("Packets may take different paths and arrive out of order. The receiver puts them back together into your photo.", { photo: "rail-yard", cue: "pkt", p0: 0.6, p1: 1 }),
      b("This is packet switching: many people’s packets share the same cables, taking turns, so no line sits idle waiting for one conversation.", { photo: "cabling", cue: "pkt", p0: 1 })
    ]
  },
  { id: "ch3", title: "Addresses", sub: "Every device needs a number", where: "Your device and router",
    beats: [
      b("Every device on the internet has an IP address. The original version, IPv4, uses 32-bit addresses, usually written as four numbers like 192.0.2.1.", { photo: "switches", d: 11, cue: "addr", p0: 0, p1: 0.4 }),
      b("32 bits allow about 4.3 billion addresses: fewer than the people now online. Europe’s registry, RIPE NCC, handed out its last free IPv4 addresses in November 2019.", { photo: "switches", focus: [0.4,0.5,1.25], d: 11.5, cue: "addr", p0: 0.4, p1: 0.5, stat: ["~4.3 billion","possible IPv4 addresses (2³²)","rfc791"] }),
      b("The newer IPv6 uses 128-bit addresses, written like 2001:db8::1. That’s enough for every device many, many times over.", { photo: "cabling", focus: [0.5,0.5,1.15], cue: "addr", p0: 0.5, p1: 1, stat: ["128 bits","IPv6 address size (IPv4: 32 bits)","rfc8200"] }),
      b("At home, your router usually shares one public IPv4 address between all your devices, swapping addresses as packets go in and out. This is called NAT.", { photo: "switches", cue: "first", p0: 0.2 })
    ]
  },
  { id: "ch4", title: "DNS", sub: "The internet’s phone book", where: "Resolvers and name servers in data centers",
    beats: [
      b("You type a name, like example.com. But computers need a number. DNS, the Domain Name System, turns the name into an IP address.", { photo: "catalog", cue: "dns", p0: 0, p1: 0.2, try: "dns" }),
      b("Your device asks a resolver, usually run by your provider. If it doesn’t know the answer, it asks a root server, which points it to the servers for .com…", { photo: "catalog", focus: [0.45,0.4,1.25], d: 11.5, cue: "dns", p0: 0.2, p1: 0.55, try: "dns" }),
      b("…which point it to example.com’s own authoritative servers, which give the final answer. The resolver remembers it for a while, so the next lookup is instant.", { photo: "catalog", focus: [0.55,0.55,1.15], d: 11.5, cue: "dns", p0: 0.55, p1: 1, try: "dns" }),
      b("There are 13 named root server authorities, run by 12 independent organisations, answering from more than 2,000 copies around the world.", { photo: "cern-hall", cue: "roots", stat: ["2,046","root server instances, 12 operators (Nov 2026)","iana"] })
    ]
  },
  { id: "ch5", title: "The first mile", sub: "From your hand to your provider", where: "Your home, the mast, your ISP",
    beats: [
      b("Your phone sends the packet by radio: over Wi-Fi to your router, or straight to a mobile mast.", { photo: "mast", cue: "first", p0: 0, p1: 0.4 }),
      b("From there it travels over copper, fibre or cable to your internet service provider (ISP): the company you pay for internet.", { photo: "fibre", cue: "first", p0: 0.4, p1: 0.8 }),
      b("Your ISP’s building is the on-ramp. From here, your packet joins the bigger network.", { photo: "telecom-tech", d: 9.5, cue: "first", p0: 0.8, p1: 1 })
    ]
  },
  { id: "ch6", title: "Routers and hops", sub: "Pass it on", where: "Network buildings along the way",
    beats: [
      b("A router reads each packet’s destination address and sends it one step closer: a “hop”. It doesn’t know the whole route, only the best next step.", { photo: "rail-yard", d: 11, cue: "hops", p0: 0, p1: 0.4 }),
      b("Each packet carries a counter called time to live. Every router lowers it by one; at zero the packet is dropped, so a lost packet can’t circle forever.", { photo: "rail-yard", focus: [0.6,0.55,1.3], d: 11.5, cue: "hops", p0: 0.4, p1: 0.75, stat: ["TTL","time to live: one less at every hop","rfc791"] }),
      b("The tool traceroute uses exactly this trick to list every router on the way to a destination.", { photo: "code", cue: "hops", p0: 0.75, p1: 1, src: "trace" })
    ]
  },
  { id: "ch7", title: "BGP", sub: "How networks find each other", where: "Border routers of every network",
    beats: [
      b("Each big network is an autonomous system, with its own number. Networks use BGP, the Border Gateway Protocol, to tell their neighbours which addresses they can reach.", { photo: "atc", d: 11.5, cue: "bgp", p0: 0, p1: 0.35, stat: ["BGP","exchanges “network reachability information”","rfc4271"] }),
      b("These announcements spread from network to network, and each one picks a path. That’s how the internet keeps working as networks join, leave or break.", { photo: "atc", focus: [0.6,0.4,1.25], cue: "bgp", p0: 0.35, p1: 0.6 }),
      b("BGP mostly trusts what it hears. If a network wrongly announces addresses that aren’t its own, traffic can flow the wrong way until it’s fixed. Newer checks, like RPKI, help catch this.", { photo: "atc", focus: [0.4,0.5,1.15], d: 11.5, cue: "bgp", p0: 0.6, p1: 1 })
    ]
  },
  { id: "ch8", title: "Internet exchanges", sub: "Where networks meet", where: "Internet exchange points (IXPs), in data centers",
    beats: [
      b("Networks need to swap traffic. At an internet exchange point (IXP), many networks plug into one shared switch and exchange traffic directly.", { photo: "switches", d: 11, cue: "ixp", p0: 0, p1: 0.5 }),
      b("Swapping traffic locally keeps trips short and cheap: two people in the same city don’t need their packets sent abroad and back.", { photo: "switches", focus: [0.5,0.5,1.2], cue: "ixp", p0: 0.5, p1: 1 }),
      b("Exchanges usually live in the same kind of data center you toured in Issue 01, in its meet-me rooms. PeeringDB keeps a public list of networks and exchanges.", { photo: "cabling", cue: "ixp", p0: 1, src: "peeringdb" })
    ]
  },
  { id: "ch9", title: "Undersea cables", sub: "The internet’s ocean floor", where: "The seabed and cable landing stations",
    beats: [
      b("To cross oceans, data rides undersea cables. TeleGeography tracks more than 600 active and planned submarine cables.", { photo: "cable-ship", stat: ["600+","active and planned submarine cables (2026)","tg"] }),
      b("Together they stretch more than 1.5 million kilometres. (The routes on our map are illustrations, not real cable paths.)", { photo: "fibre", focus: [0.5,0.5,1.2], cue: "cables", stat: ["1.5 million km+","of submarine cable in service","tg"] }),
      b("For most of the way, a cable is about as wide as a garden hose. At its heart are hair-thin glass fibres carrying light, wrapped in layers of protection.", { photo: "cable-samples", plabels: [["Glass fibres",[0.13,0.06]],["Near the shore: heavy armour",[0.15,0.55]],["Deep sea: lightweight",[0.87,0.6]]], d: 11.5 }),
      b("Cables come ashore at landing stations, and from there they connect to data centers and exchanges over land.", { photo: "cable-ship" }),
      b("Cables do break: about 200 faults a year, and fishing gear and ship anchors cause around two-thirds of them. Special repair ships fix them at sea.", { photo: "cable-ship", focus: [0.55,0.55,1.2], d: 11.5, stat: ["~200","cable faults a year (ICPC, via TeleGeography)","tg"] }),
      b("Cables are designed to last at least 25 years, though many are retired earlier when newer cables carry far more.", { photo: "cable-samples", focus: [0.6,0.5,1.2], stat: ["25 years","minimum design life of a submarine cable","tg"] })
    ]
  },
  { id: "ch10", title: "Speed and distance", sub: "Light has a speed limit", where: "Inside the glass",
    beats: [
      b("In glass fibre, light travels about 200,000 km per second: about two-thirds of its speed in a vacuum.", { photo: "fibre", focus: [0.6,0.5,1.25], cue: "route", p0: 0.5, p1: 1, stat: ["200,000 km/s","speed of light in glass fibre","physics"], from: "mumbai", to: "london" }),
      b("Mumbai to London is about 7,200 km in a straight line, so even light needs about 72 ms for the round trip. Real cables are longer than a straight line, so real trips take longer.", { photo: "cable-samples", focus: [0.5,0.5,1.1], d: 11.5, cue: "route", p0: 1, stat: ["≈ 72 ms","Mumbai ↔ London round trip at light speed, straight line","physics"], try: "route", from: "mumbai", to: "london" }),
      b("Every router and every queue adds a little more delay. The total delay is called latency, and it’s why services put servers close to their users.", { photo: "cern-hall", focus: [0.5,0.5,1.2], cue: "route", p0: 0, p1: 1, try: "route", from: "singapore", to: "losangeles" })
    ]
  },
  { id: "ch11", title: "Delivery rules", sub: "TCP, UDP and the padlock", where: "Your device and the server",
    beats: [
      b("TCP gives reliable, in-order delivery: if a packet is lost, it’s sent again, and the receiver puts everything in order. Web pages and file downloads use it.", { photo: "rail-yard", focus: [0.5,0.5,1.15], d: 11.5, cue: "tcp", p0: 0, p1: 0.5, try: "tcp" }),
      b("UDP just sends, with no resending: delivery isn’t guaranteed. Video calls and games often prefer it, because a late packet is useless anyway.", { photo: "pitstop", d: 11.5, cue: "tcp", p0: 0.5, p1: 1, try: "tcp" }),
      b("HTTPS wraps the conversation in TLS encryption. Every router on the way can carry your data, but none can read it. That’s the padlock in your browser.", { photo: "cage", d: 11.5, cue: "tls" })
    ]
  },
  { id: "ch12", title: "Bringing data closer", sub: "Caches and CDNs", where: "Cache servers near you",
    beats: [
      b("Popular content is copied to servers near you: a content delivery network, or CDN. Your request is answered nearby instead of from across the world.", { photo: "fisheye-rack", d: 11.5, cue: "cdn", p0: 0, p1: 0.5 }),
      b("That’s how a video can start almost instantly. Netflix’s Open Connect, in Issue 04, even puts its boxes inside internet providers.", { photo: "wmf-racks", cue: "cdn", p0: 0.5, p1: 1 }),
      b("Caches are refreshed in the background. Rarely requested files still come from the original server.", { photo: "blue-racks", cue: "cdn", p0: 1 })
    ]
  },
  { id: "ch13", title: "When things break", sub: "Detours", where: "The whole network",
    beats: [
      b("In 2008, damage to several undersea cables in the Mediterranean and the Middle East slowed the internet for users in the Middle East and India.", { photo: "cable-ship", focus: [0.45,0.5,1.15], d: 11.5, cue: "cut", p0: 0, p1: 0.5 }),
      b("Usually you never notice a cut: traffic is rerouted over other cables and paths. That’s why networks use several cables and several routes.", { photo: "cable-samples", focus: [0.4,0.5,1.2], d: 11, cue: "cut", p0: 0.5, p1: 1, try: "cut" }),
      b("Not every outage is a cable. Routing mistakes and DNS problems can take services offline even when every cable is fine.", { photo: "atc" })
    ]
  },
  { id: "ch14", title: "Journey’s end", sub: "One tap, around the world", where: "Everywhere",
    beats: [
      b("One tap: a DNS lookup, your router, your provider, routers and BGP, an exchange, an undersea cable, a data center, and back, often in well under a second.", { photo: "cern-hall", focus: [0.5,0.5,1.15], d: 11.5, cue: "route", p0: 0, p1: 1, from: "mumbai", to: "london" }),
      b("Next time a page loads instantly, picture the threads of glass on the ocean floor.", { photo: "fibre", focus: [0.5,0.5,1.3] })
    ]
  }
];

export const RECAPS = {
  ch1: ['The internet is many separate networks that agree to carry each other’s traffic.', 'It is mostly physical: cables, radio links and buildings full of routers.'],
  ch2: ['Data is cut into packets, each with a header saying where it is going.', 'Packets share cables and are reassembled at the end.'],
  ch3: ['IPv4 addresses are 32 bits (about 4.3 billion); IPv6 addresses are 128 bits.', 'Home routers share one public IPv4 address using NAT.'],
  ch4: ['DNS turns names into IP addresses: resolver → root → top-level domain → authoritative server.', 'Answers are cached, so repeat lookups are fast.'],
  ch5: ['Wi-Fi or a mobile mast carries your packet to your provider’s network.'],
  ch6: ['Routers forward packets one hop at a time; time to live stops packets looping forever.'],
  ch7: ['BGP lets networks announce which addresses they can reach; mistakes can misroute traffic.'],
  ch8: ['Internet exchanges let many networks swap traffic directly, keeping it local.'],
  ch9: ['Undersea cables carry data between continents; about 200 faults a year are repaired by special ships.'],
  ch10: ['Light in fibre covers about 200,000 km/s, so distance sets a minimum delay.'],
  ch11: ['TCP resends lost packets and keeps order; UDP does not. HTTPS (TLS) encrypts the conversation.'],
  ch12: ['CDNs keep copies of popular content close to users.'],
  ch13: ['Traffic reroutes around cable cuts; outages can also come from routing or DNS mistakes.'],
  ch14: ['One request crosses many networks, cables and buildings, usually in well under a second.']
};

/* Real photos, all from Wikimedia Commons under the free licences shown; resized for the web, with 240 px thumbnails.
   fit: 'contain' shows the whole photo (tall ones) over a blurred copy; 'cover' fills the screen. */
export const PHOTOS = [
  {"id":"fibre","file":"photos/fibre.jpg","thumb":"photos/thumbs/fibre.jpg","w":1400,"h":877,"title":"Optical fibre carrying light","alt":"A coil of optical fibre glowing red where light enters and leaves","fit":"cover","author":"Hustvedt","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:Fiber_optic_illuminated.jpg"},
  {"id":"telecom-tech","file":"photos/telecom-tech.jpg","thumb":"photos/thumbs/telecom-tech.jpg","w":1280,"h":853,"title":"A telecom technician patching fibre","alt":"A technician plugging yellow fibre cables into a crowded patch panel","fit":"cover","author":"U.S. Department of Agriculture\n\nLance Cheung/Multimedia PhotoJournalist","licence":"Public domain","licUrl":"","url":"https://commons.wikimedia.org/wiki/File:Telecommunications_technician.jpg"},
  {"id":"code","file":"photos/code.jpg","thumb":"photos/thumbs/code.jpg","w":1280,"h":853,"title":"Code on a screen: software watching the machines","alt":"Lines of program code on a computer monitor","fit":"cover","author":"Markus Spiske markusspiske","licence":"CC0","licUrl":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","url":"https://commons.wikimedia.org/wiki/File:Code_on_computer_monitor_(Unsplash).jpg"},
  {"id":"cable-samples","file":"photos/cable-samples.jpg","thumb":"photos/thumbs/cable-samples.jpg","w":1280,"h":857,"title":"Real undersea cable samples, heavy armour to lightweight","alt":"Four cut sections of undersea telecom cable, from double-armoured to lightweight","fit":"cover","author":"Lonnie Hagadorn","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:Submarine_Optical_Cables.jpg"},
  {"id":"containers","file":"photos/containers.jpg","thumb":"photos/thumbs/containers.jpg","w":1400,"h":1050,"title":"Container cranes: goods packed into standard boxes","alt":"Red container cranes at a port, with stacks of shipping containers","fit":"cover","author":"Calistemon","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:Container_cranes_in_Fremantle_Harbour,_July_2023_01.jpg"},
  {"id":"rail-yard","file":"photos/rail-yard.jpg","thumb":"photos/thumbs/rail-yard.jpg","w":1400,"h":933,"title":"A railway switching yard: choosing the next track","alt":"A freight train in a rail yard with several tracks and switches","fit":"cover","author":"4300streetcar","licence":"CC BY 4.0","licUrl":"https://creativecommons.org/licenses/by/4.0","url":"https://commons.wikimedia.org/wiki/File:CSX_train_switching_at_Framingham_North_Yard_June_2026.jpg"},
  {"id":"cabling","file":"photos/cabling.jpg","thumb":"photos/thumbs/cabling.jpg","w":1280,"h":853,"title":"Network cabling in a data center","alt":"Blue and green network cables plugged into rows of servers","fit":"cover","author":"Victor Grigas","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_24.jpg"},
  {"id":"switches","file":"photos/switches.jpg","thumb":"photos/thumbs/switches.jpg","w":1280,"h":851,"title":"Network switches and their cables","alt":"Grey and blue network cables plugged into the ports of network switches","fit":"cover","author":"ShakataGaNai","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:Network_switches.jpg"},
  {"id":"catalog","file":"photos/catalog.jpg","thumb":"photos/thumbs/catalog.jpg","w":1280,"h":853,"title":"A library card catalogue: an index for finding things","alt":"A wooden drawer full of library index cards","fit":"cover","author":"Michael Holley Swtpc6800","licence":"Public domain","licUrl":"","url":"https://commons.wikimedia.org/wiki/File:Copyright_Card_Catalog_Drawer.jpg"},
  {"id":"cern-hall","file":"photos/cern-hall.jpg","thumb":"photos/thumbs/cern-hall.jpg","w":1280,"h":853,"title":"A server hall at CERN, Geneva","alt":"Rows of server cabinets in a big, brightly lit hall","fit":"cover","author":"Florian Hirzinger - www.fh-ap.com","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:CERN_Server_03.jpg"},
  {"id":"mast","file":"photos/mast.jpg","thumb":"photos/thumbs/mast.jpg","w":1280,"h":960,"title":"A mobile phone mast","alt":"A tall mobile phone mast with antennas, behind a green fence with equipment cabinets","fit":"contain","author":"Diacius","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:Mobile_phone_mast.jpg"},
  {"id":"atc","file":"photos/atc.jpg","thumb":"photos/thumbs/atc.jpg","w":1400,"h":931,"title":"Air traffic control: directing traffic","alt":"A controller at radar screens, directing aircraft","fit":"cover","author":"Senior Airman John Wright","licence":"Public domain","licUrl":"","url":"https://commons.wikimedia.org/wiki/File:Lajes_Field_Air_Traffic_Control.jpg"},
  {"id":"cable-ship","file":"photos/cable-ship.jpg","thumb":"photos/thumbs/cable-ship.jpg","w":1024,"h":683,"title":"A cable ship (Cable Enterprise) in port","alt":"A large cable-laying ship moored at a quay","fit":"cover","author":"David Martin","licence":"CC BY-SA 2.0","licUrl":"https://creativecommons.org/licenses/by-sa/2.0","url":"https://commons.wikimedia.org/wiki/File:Cable_laying_ship_%22Cable_Enterprise%22_seen_from_Mayflower_Park_-_geograph.org.uk_-_6350872.jpg"},
  {"id":"pitstop","file":"photos/pitstop.jpg","thumb":"photos/thumbs/pitstop.jpg","w":1400,"h":749,"title":"A Formula One wheel gun: spares changed in seconds","alt":"A red pneumatic wheel gun used in Formula One pit stops","fit":"cover","author":"Rich Jones from United Kingdom","licence":"CC BY 2.0","licUrl":"https://creativecommons.org/licenses/by/2.0","url":"https://commons.wikimedia.org/wiki/File:Formula_One_Wheel_Gun.jpg"},
  {"id":"cage","file":"photos/cage.jpg","thumb":"photos/thumbs/cage.jpg","w":1400,"h":932,"title":"A locked customer cage","alt":"Server racks behind a locked mesh cage in a colocation hall","fit":"cover","author":"Virtuo Doc","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:Cage_Quelle_EMC_HostCo_GmbH.jpg"},
  {"id":"fisheye-rack","file":"photos/fisheye-rack.jpg","thumb":"photos/thumbs/fisheye-rack.jpg","w":1400,"h":933,"title":"Inside a computing rack (Ifremer’s Datarmor centre)","alt":"A fisheye view into a rack of servers with green lights and blue cables","fit":"cover","author":"Gregory Rocher / Ifremer","licence":"CC BY 4.0","licUrl":"https://creativecommons.org/licenses/by/4.0","url":"https://commons.wikimedia.org/wiki/File:Le_Centre_Datarmor,_les_coulisses_(Ifremer_00957-106840_-_54954).jpg"},
  {"id":"wmf-racks","file":"photos/wmf-racks.jpg","thumb":"photos/thumbs/wmf-racks.jpg","w":1400,"h":933,"title":"Server racks at the Wikimedia Foundation","alt":"Tall black racks packed with servers, their front lights glowing","fit":"cover","author":"Victor Grigas","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_35.jpg"},
  {"id":"blue-racks","file":"photos/blue-racks.jpg","thumb":"photos/thumbs/blue-racks.jpg","w":1400,"h":930,"title":"Racks full of servers","alt":"Rows of servers in tall racks, lit blue","fit":"cover","author":"BalticServers.com","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:BalticServers_data_center.jpg"}
];
