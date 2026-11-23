# The Cloud Cookbook

A free library of interactive, magazine-style explainers about how the cloud and AI really work, written in plain everyday language.
Each magazine has real photos, diagrams you can tap, small simulations and a quiz at the end of every chapter.

**Live library:** https://manish50.github.io/data_centers_cookbook/

![The library home page with a cover card for each magazine](images/home-screenshot.jpg)

## The magazines

| Issue | Magazine | Level | Chapters | Live link |
|---|---|---|---|---|
| 01 | **Inside the Cloud**: How a Data Center Really Works (self-playing 3D tour) | Beginner | 13 · about 13 min | https://manish50.github.io/data_centers_cookbook/data-centers/ |
| 02 | **Inside the Lakehouse**: Azure Databricks, from First Notebook to Architect | Beginner to Advanced | 21 · about 2 h | https://manish50.github.io/data_centers_cookbook/azure-databricks/ |
| 03 | **Inside the Mind of a Model**: How Claude Opus Is Built, Trained and Served | Beginner to Advanced | 25 · about 2½ h | https://manish50.github.io/data_centers_cookbook/ai-model/ |
| 04 | **How Netflix Streams**: from Play to pixels, a flying tour | Beginner to Intermediate | 15 stops · about 20 min | https://manish50.github.io/data_centers_cookbook/netflix-streaming/ |
| 05 | **From Sand to Signal**: how a chip is made, and how it lights a pixel (3D) | Beginner to Intermediate | 15 stops · about 25 min | https://manish50.github.io/data_centers_cookbook/sand-to-signal/ |
| 06 | **How the Internet Moves Data**: from your tap to the ocean floor (self-playing 3D tour) | Beginner to Intermediate | 14 · about 9 min | https://manish50.github.io/data_centers_cookbook/internet/ |

The home page remembers the last chapter you reached in each magazine and offers **Continue reading**.
That progress is stored only in your browser (`localStorage`), and every page still works when storage is blocked.

## How the site is organised

```
index.html                 library home page (magazine stand)
images/                    home-page images (README screenshot)
data-centers/              Issue 01: self-playing 3D tour (data.js, timeline.js, campus.js, player.js, tests/)
azure-databricks/index.html Issue 02, photos in azure-databricks/images/
ai-model/index.html        Issue 03, photos in ai-model/images/
netflix-streaming/         Issue 04: map tour (index.html, data.js, core.js, tour.js, tour.css, tests/)
sand-to-signal/            Issue 05: 3D tour (data.js, logic.js, scene.js, tour.js, tests/)
internet/                  Issue 06: self-playing 3D globe tour (data.js, net.js, land.js, timeline.js, world.js, player.js, tests/)
shared/                    the guide (anchor.js, anchor.css) and photo boards (photoboard.js) used by Issues 01 and 06, with tests
vendor/three.min.js        three.js r186, tree-shaken, shared by the 3D pages (MIT, see vendor/LICENSE-three.txt)
sitemap.xml                list of pages for search engines
.nojekyll                  serve files as-is on GitHub Pages
```

Issues 02 and 03 are single self-contained `index.html` files (styles, scripts and diagrams inline) with their photos next to them. Issues 01, 04 and 05 keep their content in a `data.js` file and pre-render a text version into `index.html`.
Every path is relative. The 2D magazines work when opened straight from disk; the 3D and map tours use JavaScript modules, so serve the folder (for example `python3 -m http.server`).

### Adding a magazine

1. Create a folder, for example `my-topic/`, with its `index.html` and `images/` (include `images/cover-sm.jpg` and `images/cover-lg.jpg`).
2. Add an "All magazines" link to `../` in its top bar. To support Continue reading, save `localStorage['cookbook:my-topic'] = {id, num, title, at}` inside a try/catch.
3. Add one entry to the `MAGAZINES` list at the top of the script in the root `index.html`.

## Run it locally

No server or install needed: open `index.html` in any modern browser.
Fonts (Fraunces and Inter) load from Google Fonts when online, and the pages fall back to system fonts offline.

---

## Issue 01: Inside the Cloud

![Inside the Cloud: the 3D data hall, with the power cut playing](data-centers/images/screenshot.jpg)

A self-playing 3D tour of a data center, built with [three.js](https://threejs.org/). It plays like a film, about 13 minutes at 1×: the camera glides around one data-center campus while captions type in, numbers appear on stat cards and the scenes animate.
You can pause at any time, drag to look around or scroll to zoom (which pauses the tour, with a Resume button), scrub the timeline, jump to a chapter, change the speed or turn captions off.

| # | Chapter | What plays in 3D |
|---|---|---|
| 01 | What is a data center? | Campus fly-over; store, move and compute lighting up; sizes from a closet to a hyperscale campus |
| 02 | The guided tour | The roof lifts and each room lights up; the 42U rack; storage tiers; copies rebuilding; spine-leaf network |
| 03 | Meet the servers | Rack, blade and tower; inside a server; server roles across the hall; GPUs; a liquid-cooled AI rack |
| 04 | The journey of a request | A packet from your phone through the mast, fibre, meet-me room, load balancer, web, app and database, and back; a chatbot streaming tokens |
| 05 | Power | Grid → substation → switchgear → UPS → PDU → racks; paths A and B; a full power cut with batteries and generators |
| 06 | Cooling | Cold and hot aisles, raised floor, CRAHs → chillers → cooling towers with steam; WUE; liquid cooling |
| 07 | Security, fire and monitoring | Fence, gate, mantrap, cages; smoke detection and gas suppression; the NOC |
| 08 | Redundancy, uptime and tiers | N, N+1, 2N with units failing; the nines; Tier I–IV; a second site |
| 09 | Virtualization and the cloud | Idle servers → VMs → containers; regions and zones on a globe |
| 10 | Real life, traced | Streaming, a UPI payment, AI and a Spark job, each lighting up the parts it uses |
| 11 | Energy, water and the planet | PUE bars; wind and solar; district heating; the water footprint |
| 12 | Planning, building and running | Site factors; a construction time-lapse; commissioning; go-live; a day in the life |
| 13 | Journey's end | Fly-over recap |

The whole tour is also pre-rendered as text ("Read as text", or automatically when WebGL isn't available). Its chapter sections keep the old ids, so links like `../data-centers/#ch5` from the other magazines still land on the right chapter.
Reduced-motion settings turn off autoplay and camera glides.

**Real photos and a guide (Issues 01 and 06).** Wherever the tour shows a physical thing (a GPU board, a rack-scale AI system, batteries, a generator, cooling towers, a phone mast, an undersea cable, a cable ship), a real photo stands in the 3D scene in place of the drawn model, with its credit under the caption. Abstract ideas (packets, DNS, BGP, power paths, airflow) stay as 3D animations. A drawn guide in the caption box reads every caption aloud with the browser's built-in speech (Web Speech API): she picks a woman's English voice when the device has one, the film waits for her at the end of a beat, and pausing, seeking or opening a Try-it panel stops her. Turn her voice off with the 🔊 button or the **V** key (remembered); minimise her with the – button. Browsers only allow speech after the first tap or click, so the first Play starts her. Her voice comes from your device, so it sounds different on a phone, a Mac or Windows. She is a drawn character, not a real person.

### Files

| File | What it holds |
|---|---|
| `data-centers/data.js` | **All content**: 13 chapters of "beats" (caption, length, camera, scene cue, labels, stat card), named points (`POI`), sources and recaps |
| `data-centers/timeline.js` | Pure helpers: beats → timeline, time → beat and chapter, camera path, typed captions, deep links, validation |
| `data-centers/campus.js` | The 3D campus and studio sets, built from simple three.js shapes. `apply(beat, progress, time)` sets every scene from the time alone, so any moment can be scrubbed to |
| `data-centers/player.js` | Autoplay, scrubber, chapters, captions, stat cards, orbit and Resume, keyboard, text mode |
| `data-centers/prerender.mjs` | Writes the text version and Sources list into `index.html` |
| `data-centers/photos/` | The real photos, listed with their credits in `PHOTOS` in `data.js` (`at: 'chapter.beat'` picks the beat) |
| `shared/anchor.js`, `shared/photoboard.js` | The speaking guide and the photo boards, shared with Issue 06 |

### Editing the tour

- **Change a caption:** edit the beat's text in `data.js`, then run `node data-centers/prerender.mjs`.
- **Re-time it:** each beat has `d`, its length in seconds (8.5 by default).
- **Move the camera:** `cam: [point, az, el, dist]`. The point is a name from `POI` or `[x, y, z]` in metres, with the building centred on 0, 0, 0. `az` is the angle around, `el` the height angle, `dist` the distance. Open `data-centers/?paused#t=SECONDS` to look at one moment.
- **Add a scene:** give the beat a `cue` and handle it in `apply()` in `campus.js`.
- **Add a photo:** put a resized JPG in `data-centers/photos/` and add it to `PHOTOS` in `data.js` with its Wikimedia Commons page, author and licence, and `at: 'chapter.beat'`. The unit tests check every photo has a free licence and credit.

### Tests

```bash
node --test data-centers/tests/*.test.mjs shared/tests/*.test.mjs
node data-centers/tests/e2e.mjs http://localhost:8765/
```

### Sources

Every number on a stat card comes from the original magazine's checked sources: the IEA (*Energy and AI*, 2025), the Uptime Institute, Google, Microsoft, LBNL, NVIDIA and Supermicro specifications, NPCI, NRDC, ASHRAE, NFPA 2001 and the LTO Program. The full list is in the tour's Sources panel and at the end of the text version.
Photos: Wikimedia Commons, under the free licences listed below. They were resized and compressed for the web.

### Photo credits: Inside the Cloud

- **A computer room in the 1970s–80s, University of St. Gallen**: University of St. Gallen, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Blick_in_einen_Raum_des_HSG-Rechenzentrums_HSGH_022-001118.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- **A real server hall (CERN, Geneva)**: Florian Hirzinger - www.fh-ap.com, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:CERN_Server_03.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- **Racks full of servers**: BalticServers.com, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:BalticServers_data_center.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- **A blade chassis: thin servers sharing one box**: Redline, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:HP_c7000-1.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- **Inside a 1U server, lid off**: Rodzilla at English Wikipedia, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Inside_and_Rear_of_Webserver.jpg), [CC BY 2.5](https://creativecommons.org/licenses/by/2.5)
- **An 8-GPU board from an AI server**: Pokiiri, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Nvidia_DGX-B200-HGX.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- **A rack-scale AI system (GB200 NVL72)**: Pokiiri, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Nvidia_DGX_GB200.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- **UPS batteries in a data center**: Jelson25, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Datacenter_Backup_Batteries.jpg), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0)
- **A standby diesel generator**: Mikael Häggström, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Power_generator_of_a_hospital_data_center.jpg), [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en)
- **A cold aisle between two rows of racks**: Robert.Harker, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Cabinet_Asile.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- **Cooling units on a raised floor**: Robert.Harker, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:CRAC_Cabinets_2.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- **Cooling towers on a data center (Mesa, Arizona)**: Rsparks3, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Data_center_cooling_tower.jpg), [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en)
- **A locked customer cage**: Virtuo Doc, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Cage_Quelle_EMC_HostCo_GmbH.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- **A gas fire-suppression discharge**: Keith4048, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:COMPUTER_ROOM_DISCHARGE.JPG), Public domain
- **A load bank testing a generator**: Wtshymanski, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Air_cooled_load_bank.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- **A technician at work**: Bill Branson (Photographer), [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Network_server_and_technician.jpg), Public domain

---

## Issue 02: Inside the Lakehouse

![Inside the Lakehouse cover page](azure-databricks/images/screenshot.jpg)

A guide to Azure Databricks for data engineers and architects, from "What is Databricks?" to a production-ready design.
Chapters are marked **Beginner**, **Intermediate** or **Advanced**, and a learning path at the start shows three tracks.
Every chapter has an **Inside the data center** panel: a short summary with a "See inside" button that opens up the physical side. It covers where the work runs, which Azure VM families it uses, how the data travels, power and heat, scale, what happens when something breaks, and how it would feel to stand there. It also has a "Go deeper" link into the matching chapter of Issue 01.

| # | Chapter | Level | Try it |
|---|---|---|---|
| 01 | What is Databricks? | Beginner | Persona picker |
| 02 | Lake, warehouse, lakehouse | Beginner | "Where would you keep it?" sorter |
| 03 | The architecture | Beginner | Architecture explorer |
| 04 | Its neighbours in Azure | Beginner | Azure neighbourhood map |
| 05 | Compute: choosing your engine | Beginner | "Which compute?" chooser |
| 06 | Spark basics | Beginner | Spark job animation with executor slider |
| 07 | Delta Lake | Intermediate | Time-travel slider + VACUUM |
| 08 | Medallion architecture | Intermediate | Bronze → silver → gold animation |
| 09 | Getting data in | Intermediate | Auto Loader demo + ingestion picker |
| 10 | Building pipelines | Intermediate | Batch vs streaming toggle, expectations demo |
| 11 | Structured Streaming | Intermediate | Watermark / late-data slider |
| 12 | Orchestration | Intermediate | Job DAG with failure, retry and repair |
| 13 | Unity Catalog | Intermediate | Catalog explorer: who can see what |
| 14 | Databricks SQL and dashboards | Intermediate | Rush-hour SQL warehouse demo |
| 15 | Performance tuning | Advanced | Data skew demo (AQE, salting) |
| 16 | Cost control | Advanced | Cluster cost estimator (example prices) |
| 17 | Security and networking | Advanced | Network lock-down in 4 steps |
| 18 | DevOps | Advanced | dev → test → prod promotion |
| 19 | ML and AI | Advanced | MLflow lifecycle stepper |
| 20 | Reference architectures | Advanced | Architecture switcher |
| 21 | Mistakes and the architect checklist | Advanced | Production-readiness checklist |

Product names follow the current Microsoft Learn and Databricks documentation (checked November 2026):
- Lakeflow Spark Declarative Pipelines (formerly Delta Live Tables)
- Lakeflow Jobs (formerly Workflows)
- Declarative Automation Bundles (formerly Databricks Asset Bundles)
- OpenSharing (formerly Delta Sharing)
- Git folders
- Standard / Dedicated access modes

Prices in the cost estimator are **examples** from the Azure Databricks pricing page (Premium, pay-as-you-go, US East). Prices change, so it is not a quote.

This is an independent educational guide. It is not affiliated with or endorsed by Microsoft or Databricks, and it uses no official logos or diagrams. All diagrams were drawn for this site.

### Sources: Inside the Lakehouse

- [What is Azure Databricks?](https://learn.microsoft.com/en-us/azure/databricks/introduction/)
- [High-level architecture](https://learn.microsoft.com/en-us/azure/databricks/getting-started/high-level-architecture)
- [End of life for Standard tier workspaces](https://learn.microsoft.com/en-us/azure/databricks/admin/account-settings/standard-tier)
- [Compute](https://learn.microsoft.com/en-us/azure/databricks/compute/)
- [Compute configuration](https://learn.microsoft.com/en-us/azure/databricks/compute/configure)
- [Photon](https://learn.microsoft.com/en-us/azure/databricks/compute/photon)
- [SQL warehouse types](https://learn.microsoft.com/en-us/azure/databricks/compute/sql-warehouse/warehouse-types)
- [SQL warehouse sizing and scaling](https://learn.microsoft.com/en-us/azure/databricks/compute/sql-warehouse/warehouse-behavior)
- [Table history and time travel](https://learn.microsoft.com/en-us/azure/databricks/delta/history)
- [VACUUM](https://learn.microsoft.com/en-us/azure/databricks/delta/vacuum)
- [MERGE](https://learn.microsoft.com/en-us/azure/databricks/delta/merge)
- [Liquid clustering](https://learn.microsoft.com/en-us/azure/databricks/delta/clustering)
- [Predictive optimization](https://learn.microsoft.com/en-us/azure/databricks/optimizations/predictive-optimization)
- [Medallion architecture](https://learn.microsoft.com/en-us/azure/databricks/lakehouse/medallion)
- [Auto Loader](https://learn.microsoft.com/en-us/azure/databricks/ingestion/cloud-object-storage/auto-loader/)
- [COPY INTO](https://learn.microsoft.com/en-us/azure/databricks/ingestion/copy-into/)
- [Lakeflow Connect](https://learn.microsoft.com/en-us/azure/databricks/ingestion/lakeflow-connect/)
- [Lakeflow Spark Declarative Pipelines](https://learn.microsoft.com/en-us/azure/databricks/ldp/)
- [What happened to DLT?](https://learn.microsoft.com/en-us/azure/databricks/ldp/concepts/where-is-dlt)
- [Expectations](https://learn.microsoft.com/en-us/azure/databricks/ldp/expectations)
- [Triggers](https://learn.microsoft.com/en-us/azure/databricks/structured-streaming/triggers)
- [Watermarks](https://learn.microsoft.com/en-us/azure/databricks/structured-streaming/watermarks)
- [Lakeflow Jobs](https://learn.microsoft.com/en-us/azure/databricks/jobs/)
- [Unity Catalog](https://learn.microsoft.com/en-us/azure/databricks/data-governance/unity-catalog/)
- [OpenSharing](https://learn.microsoft.com/en-us/azure/databricks/delta-sharing/)
- [Secure cluster connectivity](https://learn.microsoft.com/en-us/azure/databricks/security/network/classic/secure-cluster-connectivity)
- [VNet injection](https://learn.microsoft.com/en-us/azure/databricks/security/network/classic/vnet-inject)
- [Private Link](https://learn.microsoft.com/en-us/azure/databricks/security/network/classic/private-link)
- [Secrets](https://learn.microsoft.com/en-us/azure/databricks/security/secrets/)
- [Adaptive Query Execution](https://learn.microsoft.com/en-us/azure/databricks/optimizations/aqe)
- [Disk cache](https://learn.microsoft.com/en-us/azure/databricks/optimizations/disk-cache)
- [Git folders](https://learn.microsoft.com/en-us/azure/databricks/repos/)
- [Declarative Automation Bundles](https://learn.microsoft.com/en-us/azure/databricks/dev-tools/bundles/)
- [Bundles release notes (rename, March 2026)](https://docs.databricks.com/aws/en/release-notes/dev-tools/bundles)
- [MLflow](https://learn.microsoft.com/en-us/azure/databricks/mlflow/)
- [Model Serving](https://learn.microsoft.com/en-us/azure/databricks/machine-learning/model-serving/)
- [Agent Bricks](https://learn.microsoft.com/en-us/azure/databricks/generative-ai/agent-bricks/)
- [AI/BI dashboards](https://learn.microsoft.com/en-us/azure/databricks/dashboards/)
- [Genie](https://learn.microsoft.com/en-us/azure/databricks/genie/)
- [Power BI](https://learn.microsoft.com/en-us/azure/databricks/partners/bi/power-bi)
- [VM sizes](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/overview)
- [Ddsv5](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/ddsv5-series)
- [Edsv5](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/edsv5-series)
- [Fsv2](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/compute-optimized/fsv2-series)
- [Lsv3](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/storage-optimized/lsv3-series)
- [ND H100 v5](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series)
- [Storage redundancy](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy)
- [Availability zones](https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview)
- [Azure Spot VMs](https://learn.microsoft.com/en-us/azure/virtual-machines/spot-vms)
- [Azure Databricks pricing](https://azure.microsoft.com/en-us/pricing/details/databricks/)
- [Databricks Runtime release notes](https://docs.databricks.com/aws/en/release-notes/runtime/)
- [Lakeflow Jobs (formerly Workflows)](https://www.databricks.com/blog/whats-new-lakeflow-jobs-provides-more-efficient-data-orchestration)

### Photo credits: Inside the Lakehouse

All photos come from [Wikimedia Commons](https://commons.wikimedia.org/) under the free licences below (several are shared with Issue 01). They were resized and compressed for the web, and some were cropped; adapted versions keep the same licence.
A machine-readable list is in [`azure-databricks/images/credits.json`](azure-databricks/images/credits.json).

| Used for | Photo | Author | Licence |
|---|---|---|---|
| Cover: a stilt house in Lake Dojran | [Наколно живеалиште во Дојранско Езеро](https://commons.wikimedia.org/wiki/File:%D0%9D%D0%B0%D0%BA%D0%BE%D0%BB%D0%BD%D0%BE_%D0%B6%D0%B8%D0%B2%D0%B5%D0%B0%D0%BB%D0%B8%D1%88%D1%82%D0%B5_%D0%B2%D0%BE_%D0%94%D0%BE%D1%98%D1%80%D0%B0%D0%BD%D1%81%D0%BA%D0%BE_%D0%95%D0%B7%D0%B5%D1%80%D0%BE.jpg) | Kiril Simeonovski | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 1 opening: server hall at CERN | [CERN Server 03](https://commons.wikimedia.org/wiki/File:CERN_Server_03.jpg) | Florian Hirzinger - www.fh-ap.com | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 1 inside panel: rows of Wikimedia Foundation servers | [Wikimedia Foundation Servers-8055 08](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_08.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 2 opening: lake with a house on its shore | [Lake at summer scenic white house on shore in background](https://commons.wikimedia.org/wiki/File:Lake_at_summer_scenic_white_house_on_shore_in_background.jpg) | U.S. Fish and Wildlife Service | Public domain |
| Ch 2 inside panel: storage system at Ifremer's Datarmor centre | [Le Centre Datarmor, les coulisses (Ifremer 00957-106840 - 54953)](https://commons.wikimedia.org/wiki/File:Le_Centre_Datarmor,_les_coulisses_(Ifremer_00957-106840_-_54953).jpg) | Gregory Rocher / Ifremer | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Ch 3 opening: Google data center campus, Mayes County, Oklahoma | [Google Mayes County P0004974a](https://commons.wikimedia.org/wiki/File:Google_Mayes_County_P0004974a.jpg) | Xpda | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 4 opening: illuminated optical fibres | [Fiber optic illuminated](https://commons.wikimedia.org/wiki/File:Fiber_optic_illuminated.jpg) | Hustvedt | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 5 opening: Dell servers in a rack (Wikimedia) | [Wikimedia Foundation Servers-8055 43](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_43.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 6 opening: Wikimedia Foundation servers | [Wikimedia Foundation Servers-8055 13](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_13.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 7 opening: library bookstacks, 1904 | [Bookstacks1904 - DPLA - b3cd3f1ec1091fd385286151c2e6e417](https://commons.wikimedia.org/wiki/File:Bookstacks1904_-_DPLA_-_b3cd3f1ec1091fd385286151c2e6e417.jpg) | Brackett, J. Raymond | Public domain |
| Ch 8 opening: 1996 Summer Olympics medals | [1996 Summer Olympics medals, Atlanta History Center](https://commons.wikimedia.org/wiki/File:1996_Summer_Olympics_medals,_Atlanta_History_Center.jpg) | JJonahJackalope | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 9 opening: Lemon Reservoir, Colorado | [Lemon Reservoir, Colorado](https://commons.wikimedia.org/wiki/File:Lemon_Reservoir,_Colorado.jpg) | Radomianin | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 10 opening: interior pipelines, Gates Rubber | [Gates Rubber, interior pipelines](https://commons.wikimedia.org/wiki/File:Gates_Rubber,_interior_pipelines.jpg) | Eric Jusino from Denver, CO, USA | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Ch 11 opening: fast mountain river | [Fast mountain river flowing through the conifer forest](https://commons.wikimedia.org/wiki/File:Fast_mountain_river_flowing_through_the_conifer_forest.jpg) | Smith Michael L, U.S. Fish and Wildlife Service | Public domain |
| Ch 12 opening: CSX train switching, Framingham North Yard | [CSX train switching at Framingham North Yard June 2026](https://commons.wikimedia.org/wiki/File:CSX_train_switching_at_Framingham_North_Yard_June_2026.jpg) | 4300streetcar | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Ch 13 opening: card catalog drawer, Library of Congress | [Copyright Card Catalog Drawer](https://commons.wikimedia.org/wiki/File:Copyright_Card_Catalog_Drawer.jpg) | Michael Holley Swtpc6800 | Public domain |
| Ch 14 opening: KC-135 Stratotanker cockpit | [KC-135 Stratotanker Cockpit](https://commons.wikimedia.org/wiki/File:KC-135_Stratotanker_Cockpit.JPG) | Unknown | Public domain |
| Ch 15 opening: Formula One wheel gun | [Formula One Wheel Gun](https://commons.wikimedia.org/wiki/File:Formula_One_Wheel_Gun.jpg) | Rich Jones from United Kingdom | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Ch 16 opening: a pile of coins | [A pile of Ukrainian currency coins](https://commons.wikimedia.org/wiki/File:A_pile_of_Ukrainian_currency_coins.jpg) | Роман Рябенко | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Ch 17 opening: locked customer cage in a data center | [Cage Quelle EMC HostCo GmbH](https://commons.wikimedia.org/wiki/File:Cage_Quelle_EMC_HostCo_GmbH.jpg) | Virtuo Doc | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 18 opening: container cranes, Fremantle Harbour | [Container cranes in Fremantle Harbour, July 2023 01](https://commons.wikimedia.org/wiki/File:Container_cranes_in_Fremantle_Harbour,_July_2023_01.jpg) | Calistemon | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 19 opening: NVIDIA HGX B200 GPU board | [Nvidia DGX-B200-HGX](https://commons.wikimedia.org/wiki/File:Nvidia_DGX-B200-HGX.jpg) | Pokiiri | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 20 opening: blueprint of an elevation | [Blueprint of elevation by Alice Trythall Washburn](https://commons.wikimedia.org/wiki/File:Blueprint_of_elevation_by_Alice_Trythall_Washburn.jpg) | Alice Trythall Washburn | Public domain |
| Ch 21 opening: pilots in a C-130J cockpit | [120316-F-LR266-986 C-130J Hercules Cockpit Ramstein Air Base 2012](https://commons.wikimedia.org/wiki/File:120316-F-LR266-986_C-130J_Hercules_Cockpit_Ramstein_Air_Base_2012.jpg) | U.S. Air Force photo/Staff Sgt. Chris Willis | Public domain |
| Finale: stilt house in Lake Dojran | [Наколно живеалиште во Дојранско Езеро](https://commons.wikimedia.org/wiki/File:%D0%9D%D0%B0%D0%BA%D0%BE%D0%BB%D0%BD%D0%BE_%D0%B6%D0%B8%D0%B2%D0%B5%D0%B0%D0%BB%D0%B8%D1%88%D1%82%D0%B5_%D0%B2%D0%BE_%D0%94%D0%BE%D1%98%D1%80%D0%B0%D0%BD%D1%81%D0%BA%D0%BE_%D0%95%D0%B7%D0%B5%D1%80%D0%BE.jpg) | Kiril Simeonovski | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |

---

## Issue 03: Inside the Mind of a Model

![Inside the Mind of a Model cover page](ai-model/images/screenshot.jpg)

> **An independent explainer. Not affiliated with or endorsed by Anthropic.**

How a large AI model like Claude Opus is created, trained, served on real hardware and used to build applications, from a single token to liquid-cooled AI racks.
It has its own "night lab" look (with a light reading mode): hooks that stream in token by token, a living network on the cover, diagrams that stay pinned while you scroll, "Not public" redaction bars, a context-window reading meter and a searchable chapter map.

Every fact carries one of three labels:
- **Anthropic has said ↗**: published by Anthropic (or a named cloud/chip partner), with a link to the source.
- **How models like this work**: general knowledge about language models.
- **Illustration**: a simplified demo made for teaching.

Numbers Anthropic hasn't published, such as parameter counts, training data size, chip counts and training cost, are never guessed: the magazine shows them as "Not public". Models, features, platforms and prices were checked on Anthropic's website on 9 November 2026. Every chapter has an **Inside the data center** panel linking into Issue 01.

| # | Chapter | Level | Try it |
|---|---|---|---|
| 01 | What is a large language model? | Beginner | Next-word game |
| 02 | Meet the Claude family | Beginner | “Which model for which job?” picker |
| 03 | Training data | Beginner | Keep / fix / drop data sorter |
| 04 | Tokens | Beginner | Tokenizer demo |
| 05 | The Transformer | Intermediate | Pinned scroll story, attention explorer, word-meaning map |
| 06 | Pre-training | Intermediate | Training animation (loss curve) |
| 07 | Post-training | Intermediate | “Which answer is better?” preference picker |
| 08 | Safety work | Intermediate | Responsible Scaling Policy stepper, feature explorer |
| 09 | Why AI needs special chips | Beginner | CPU vs accelerator race |
| 10 | Inside an AI server | Intermediate | AI server explorer |
| 11 | Training clusters | Advanced | Scale explorer: laptop → cluster |
| 12 | Power and cooling for AI | Intermediate | Rack power slider: air vs liquid |
| 13 | Training vs inference | Intermediate | Side-by-side toggle |
| 14 | The journey of one message | Beginner | Message journey animation |
| 15 | Context, sampling, streaming, thinking | Intermediate | Context window demo, temperature slider |
| 16 | Serving millions of users | Advanced | Batching simulator |
| 17 | Where you can use Claude | Beginner | Platform chooser |
| 18 | Claude API basics | Intermediate | Python/JS code, cost estimator with current prices |
| 19 | Prompting well | Beginner | Prompt fixer |
| 20 | Tools, agents and MCP | Intermediate | Agent loop simulator, tool-call code |
| 21 | Retrieval (RAG) | Intermediate | “Ask your documents” demo |
| 22 | Faster and cheaper | Advanced | Prompt caching savings calculator |
| 23 | Claude Code | Intermediate | Coding-session replay with permission modes |
| 24 | Example architectures | Advanced | Architecture switcher incl. Azure Data Factory assistant via Microsoft Foundry |
| 25 | Testing, limits and responsible use | Advanced | Spot the made-up answer, readiness checklist |

No Anthropic or Claude logos, website designs, images or diagrams are used. All diagrams, animations and the cover artwork were drawn for this magazine.

### Sources: Inside the Mind of a Model

- [System Card: Claude Opus 5.5](https://anthropic.com/claude-opus-5-5-system-card)
- [Introducing Claude Opus 5.5](https://www.anthropic.com/news/claude-opus-5-5)
- [Claude’s Constitution](https://www.anthropic.com/constitution)
- [Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback)
- [Anthropic’s Responsible Scaling Policy](https://www.anthropic.com/responsible-scaling-policy)
- [Mapping the mind of a large language model](https://www.anthropic.com/research/mapping-mind-language-model)
- [Tracing the thoughts of a large language model](https://www.anthropic.com/research/tracing-thoughts-language-model)
- [Building effective AI agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Contextual retrieval in AI systems](https://www.anthropic.com/news/contextual-retrieval)
- [Expanding our use of Google Cloud TPUs and Services](https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services)
- [Anthropic invests $50 billion in American AI infrastructure](https://www.anthropic.com/news/anthropic-invests-50-billion-in-american-ai-infrastructure)
- [Microsoft, NVIDIA, and Anthropic announce strategic partnerships](https://www.anthropic.com/news/microsoft-nvidia-anthropic-announce-strategic-partnerships)
- [Covering electricity price increases](https://www.anthropic.com/news/covering-electricity-price-increases)
- [Anthropic expands Google and Broadcom compute deal](https://www.anthropic.com/news/google-broadcom-partnership-compute)
- [Anthropic and Amazon expand collaboration for up to 5 gigawatts of new compute](https://www.anthropic.com/news/anthropic-amazon-compute)
- [Higher usage limits for Claude and a compute deal with SpaceX](https://www.anthropic.com/news/higher-limits-spacex)
- [Download Claude (apps)](https://claude.com/download)
- [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking)
- [Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [Token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting)
- [Messages API reference](https://platform.claude.com/docs/en/api/messages/create)
- [Rate limits](https://platform.claude.com/docs/en/api/rate-limits)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- [Tool use with Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [Embeddings](https://platform.claude.com/docs/en/build-with-claude/embeddings)
- [Citations](https://platform.claude.com/docs/en/build-with-claude/citations)
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Claude in Microsoft Foundry](https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry)
- [Claude Code overview](https://code.claude.com/docs/en/overview)
- [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works)
- [Amazon: Project Rainier](https://www.aboutamazon.com/news/aws/aws-project-rainier-ai-trainium-chips-compute-cluster)
- [AWS Trainium](https://aws.amazon.com/ai/machine-learning/trainium/)
- [Google Cloud: Ironwood TPUs](https://cloud.google.com/blog/products/compute/ironwood-tpus-and-new-axion-based-vms-for-your-ai-workloads)
- [NVIDIA: Blackwell platform and GB200 NVL72](https://nvidianews.nvidia.com/news/nvidia-blackwell-platform-arrives-to-power-a-new-era-of-computing)
- [Microsoft Learn: Data Factory metrics and alerts](https://learn.microsoft.com/en-us/azure/data-factory/monitor-metrics-alerts)
- [Model Context Protocol: introduction](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Vaswani et al. (2017), Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [Kaplan et al. (2020), Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
- [Hoffmann et al. (2022), Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)
- [Ouyang et al. (2022), Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)
- [Bai et al. (2022), Training a Helpful and Harmless Assistant with RLHF](https://arxiv.org/abs/2204.05862)
- [Bai et al. (2022), Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073)
- [Lewis et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)

### Photo credits: Inside the Mind of a Model

All photos come from [Wikimedia Commons](https://commons.wikimedia.org/) under the free licences below (several are shared with Issues 01 and 02). They were resized and compressed for the web; adapted versions keep the same licence.
A machine-readable list is in [`ai-model/images/credits.json`](ai-model/images/credits.json).

| Used for | Photo | Author | Licence |
|---|---|---|---|
| Ch 1 inside panel: rows of Wikimedia Foundation servers | [Wikimedia Foundation Servers-8055 08](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_08.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 2 inside panel: a TSUBAME 4.0 computing node | [TSUBAME4.0 P5160989](https://commons.wikimedia.org/wiki/File:TSUBAME4.0_P5160989.jpg) | Fukumoto | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 3 opening: Library of Congress main reading room | [LOC Main Reading Room Highsmith](https://commons.wikimedia.org/wiki/File:LOC_Main_Reading_Room_Highsmith.jpg) | Carol M. Highsmith | Public domain |
| Ch 3 inside panel: storage behind the scenes at Ifremer’s DATARMOR center | [Le Centre Datarmor, les coulisses (Ifremer 00957-106840 - 54953)](https://commons.wikimedia.org/wiki/File:Le_Centre_Datarmor,_les_coulisses_(Ifremer_00957-106840_-_54953).jpg) | Gregory Rocher / Ifremer | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Ch 6 opening: racks of the TSUBAME 4.0 supercomputer | [TSUBAME4.0 P5160972](https://commons.wikimedia.org/wiki/File:TSUBAME4.0_P5160972.jpg) | Fukumoto | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 6 inside panel: IBM Blue Gene/P supercomputer racks | [IBM Blue Gene P supercomputer](https://commons.wikimedia.org/wiki/File:IBM_Blue_Gene_P_supercomputer.jpg) | Argonne National Laboratory | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| Ch 7 inside panel: a technician working on servers | [Network server and technician](https://commons.wikimedia.org/wiki/File:Network_server_and_technician.jpg) | Bill Branson (Photographer) | Public domain |
| Ch 8 opening: a lab technician at a microscope | [Lab technitian looking through the microscope while adjusting coarse knob](https://commons.wikimedia.org/wiki/File:Lab_technitian_looking_through_the_microscope_while_adjusting_coarse_knob.jpg) | Shixart1985 | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Ch 8 inside panel: a locked server cage | [Cage Quelle EMC HostCo GmbH](https://commons.wikimedia.org/wiki/File:Cage_Quelle_EMC_HostCo_GmbH.jpg) | Virtuo Doc | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 9 opening: a silicon wafer | [Silicon Wafer 20190210](https://commons.wikimedia.org/wiki/File:Silicon_Wafer_20190210.jpg) | Enrique Jiménez | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| Ch 9 inside panel: a Google TPU v3 board | [Tensor Processing Unit 3.0](https://commons.wikimedia.org/wiki/File:Tensor_Processing_Unit_3.0.jpg) | Zinskauf | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 10 opening: NVIDIA DGX B200 8-GPU board (HGX) | [Nvidia DGX-B200-HGX](https://commons.wikimedia.org/wiki/File:Nvidia_DGX-B200-HGX.jpg) | Pokiiri | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 10: NVIDIA GB200 liquid-cooled rack | [Nvidia DGX GB200](https://commons.wikimedia.org/wiki/File:Nvidia_DGX_GB200.jpg) | Pokiiri | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 10 inside panel: four NVIDIA H100 GPUs in a TSUBAME 4.0 node | [TSUBAME4.0 P5160984](https://commons.wikimedia.org/wiki/File:TSUBAME4.0_P5160984.jpg) | Fukumoto | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 11 opening: the Frontier supercomputer | [Frontier Supercomputer (1)](https://commons.wikimedia.org/wiki/File:Frontier_Supercomputer_(1).jpg) | OLCF at ORNL | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Ch 11 inside panel: InfiniBand network interfaces on a TSUBAME 4.0 node | [TSUBAME4.0 P5160986](https://commons.wikimedia.org/wiki/File:TSUBAME4.0_P5160986.jpg) | Fukumoto | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 12 opening: cooling tower on a data center roof | [Data center cooling tower](https://commons.wikimedia.org/wiki/File:Data_center_cooling_tower.jpg) | Rsparks3 | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Ch 12: an immersion cooling system | [Asperitas AIC24 Immersion system](https://commons.wikimedia.org/wiki/File:Asperitas_AIC24_Immersion_system.jpg) | Rolf Brink | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 12 inside panel: a bank of backup generators | [Una batteria di grossi generatori alimentati a gasolio in un Data Center in via di ultimazione](https://commons.wikimedia.org/wiki/File:Una_batteria_di_grossi_generatori_alimentati_a_gasolio_in_un_Data_Center_in_via_di_ultimazione.jpg) | Lapalmauz | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 13 inside panel: an engineer in a data center aisle | [Data Center Fish Eye View (noirlab-racks-155)](https://commons.wikimedia.org/wiki/File:Data_Center_Fish_Eye_View_(noirlab-racks-155).jpg) | International Gemini Observatory/NOIRLab/NSF/AURA/Manuel Paredes | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Ch 14 opening: an illuminated fibre-optic cable | [Fiber optic illuminated](https://commons.wikimedia.org/wiki/File:Fiber_optic_illuminated.jpg) | Hustvedt | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 14 inside panel: a telecommunications technician | [Telecommunications technician](https://commons.wikimedia.org/wiki/File:Telecommunications_technician.jpg) | U.S. Department of Agriculture

Lance Cheung/Multimedia PhotoJournalist | Public domain |
| Ch 16 opening: air traffic control | [Lajes Field Air Traffic Control](https://commons.wikimedia.org/wiki/File:Lajes_Field_Air_Traffic_Control.jpg) | Senior Airman John Wright | Public domain |
| Ch 16 inside panel: two rows of server cabinets | [Cabinet Asile](https://commons.wikimedia.org/wiki/File:Cabinet_Asile.jpg) | Robert.Harker | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 17 inside panel: a large data center campus | [Google Mayes County P0004974a](https://commons.wikimedia.org/wiki/File:Google_Mayes_County_P0004974a.jpg) | Xpda | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 21 opening: library card catalog drawers | [Copyright Card Catalog Drawer](https://commons.wikimedia.org/wiki/File:Copyright_Card_Catalog_Drawer.jpg) | Michael Holley Swtpc6800 | Public domain |
| Ch 21 inside panel: Wikimedia Foundation servers | [Wikimedia Foundation Servers-8055 24](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_24.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 22 opening: a pile of coins | [A pile of Ukrainian currency coins](https://commons.wikimedia.org/wiki/File:A_pile_of_Ukrainian_currency_coins.jpg) | Роман Рябенко | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Ch 23 inside panel: code on a computer monitor | [Code on computer monitor (Unsplash)](https://commons.wikimedia.org/wiki/File:Code_on_computer_monitor_(Unsplash).jpg) | Markus Spiske markusspiske | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Ch 24 opening: a blueprint | [Blueprint of elevation by Alice Trythall Washburn](https://commons.wikimedia.org/wiki/File:Blueprint_of_elevation_by_Alice_Trythall_Washburn.jpg) | Alice Trythall Washburn | Public domain |
| Ch 24 inside panel: a data center server room | [BalticServers data center](https://commons.wikimedia.org/wiki/File:BalticServers_data_center.jpg) | BalticServers.com | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 25 opening: pilots going through a pre-flight checklist | [120316-F-LR266-986 C-130J Hercules Cockpit Ramstein Air Base 2012](https://commons.wikimedia.org/wiki/File:120316-F-LR266-986_C-130J_Hercules_Cockpit_Ramstein_Air_Base_2012.jpg) | U.S. Air Force photo/Staff Sgt. Chris Willis | Public domain |
| Ch 25 inside panel: a Blue Gene/Q supercomputer cabinet | [Blue Gene-Q, Super computer control room at EFPL, Lausanne (2015-05-22 02.41.34 by Mitch Altman)](https://commons.wikimedia.org/wiki/File:Blue_Gene-Q,_Super_computer_control_room_at_EFPL,_Lausanne_(2015-05-22_02.41.34_by_Mitch_Altman).jpg) | Mitch Altman from San Francisco, USA | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |

## Issue 04: How Netflix Streams

![How Netflix Streams: the whole map](netflix-streaming/og.jpg)

An independent, single-screen map tour of Netflix's streaming system. The camera flies across one big map with 15 stops, from pressing Play to Open Connect boxes inside your internet provider, live events and the 2007–2025 data-center timeline.
Every stop has two parts: **What happens** and its **Data-center role**, with a location badge.
It has a Data-center view, an Auto tour, a "Read as text" version (also pre-rendered into the HTML for search engines and no-JS readers) and a Sources panel.
It has no logos and no brand typeface. Netflix is a trademark of Netflix, Inc. Not affiliated.

**Navigation:** scroll, swipe, pinch, drag, arrow/Page/Space/Home/End keys, Prev/Next, the progress rail, or the minimap. Each stop has a deep link: `#stop-1` … `#stop-15`.

**Things to try:** "Fail Region A" (stop 5), encoding bars that grow (stop 8), the overnight fill (stop 9), "Throttle my Wi-Fi" and "Fail this OCA" (stop 11), and the live-stream counter (stop 12).

### Files

| File | What it holds |
|---|---|
| `netflix-streaming/data.js` | **All content**: stops (text, data-center role, camera target, highlighted site, active wires), map zones, wires, timeline and sources |
| `netflix-streaming/core.js` | Pure helpers: hash routing, input throttle, camera flight maths, data validation |
| `netflix-streaming/tour.js` | Engine: draws the SVG map, flies the camera, types captions, handles input and runs the mini-scenes |
| `netflix-streaming/tour.css` | "Screening room" styles, mobile bottom sheet, reduced-motion rules |
| `netflix-streaming/prerender.mjs` | Writes the text version, first caption and Sources list into `index.html` |
| `netflix-streaming/tests/` | `unit.test.mjs` (node:test) and `e2e.mjs` (Playwright) |

### Editing the tour

- **Change stop text:** edit `lines` (1–3 short lines) or `dc.text` for that stop in `data.js`, then run `node netflix-streaming/prerender.mjs` so the text version matches.
- **Add a stop:** add an object to `STOPS` with `id`, `eyebrow`, `title`, `cam`, `lines`, `dc {badge, text}`, `site`, `tint`, `active`, `wires`, `chips` and `src`, then re-run the prerender. The unit test expects exactly 15 stops, so update `validateStops` in `core.js` if you change the count.
- **Re-tune a camera target:** `cam: { x, y, zoom }` is the map point to centre on, in world units (the map is 4000 × 2640), and how many times closer than the full map. Open `netflix-streaming/#stop-N`, adjust, and reload. The caption card and controls are left out of the frame automatically on desktop and mobile.
- **Wire up analytics:** the page fires `topic_start`, `stop_view {n}`, `tour_complete`, `auto_tour_toggle {on}` and `read_as_text {on}` as a `cookbook:analytics` DOM event (and in `window.cookbookEvents`). The site has no analytics tool yet, so nothing is sent anywhere.

### Tests

```bash
node --test netflix-streaming/tests/*.test.mjs
python3 -m http.server 8765        # in another terminal, from the repo root
node netflix-streaming/tests/e2e.mjs http://localhost:8765/
```

### Sources

Facts were checked against: the [Open Connect Overview PDF](https://openconnect.netflix.com/Open-Connect-Overview.pdf), [Open Connect appliance specs](https://openconnect.netflix.com/en/appliances/), Netflix's [Completing the Netflix Cloud Migration](https://about.netflix.com/en/news/completing-the-netflix-cloud-migration), the [APNIC Open Connect article](https://blog.apnic.net/2018/06/20/netflix-content-distribution-through-open-connect/), and Netflix Tech Blog posts on [fill](https://netflixtechblog.com/netflix-and-fill-c43a32b490c0), [active-active](https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b), [Zuul 2](https://netflixtechblog.com/zuul-2-the-netflix-journey-to-asynchronous-non-blocking-systems-45947377fb5c), [Cosmos](https://netflixtechblog.com/the-netflix-cosmos-platform-35c14d9351ad), [AV1 on Android](https://netflixtechblog.com/netflix-now-streaming-av1-on-android-d5264a515202), [film grain synthesis](https://netflixtechblog.com/av1-scale-film-grain-synthesis-the-awakening-ee09cfdff40b), [Live, part 1](https://netflixtechblog.com/behind-the-streams-live-at-netflix-part-1-d23f917c2f40) and the [Live Origin](https://netflixtechblog.com/netflix-live-origin-41f1b0ad5371). The full list is in the page's Sources panel.
The map, icons and cover are drawn in code for this page, with no photos.

## Issue 05: From Sand to Signal

![From Sand to Signal: a 3D transistor with its gate switched on](sand-to-signal/og.jpg)

An interactive 3D tour, built with [three.js](https://threejs.org/), that follows silicon from sand to a lit pixel.
Thirteen workstations sit along a glowing production line, and the camera flies between them.
At each stop you can drag to look around the model and use one hands-on control:

| # | Stop | Hands-on |
|---|---|---|
| 1 | From a grain of sand to a pixel | Start the journey |
| 2 | Sand and quartz | Show the SiO₂ atoms |
| 3 | Purifying silicon | Run the Siemens reactor |
| 4 | Growing a crystal (Czochralski) | Pull the ingot from the melt |
| 5 | Slicing wafers | Slice the ingot |
| 6 | Cleanroom and lithography | Expose the wafer with EUV light |
| 7 | Deposit, etch, implant | Step through the process loop |
| 8 | The transistor | Switch the gate on and off |
| 9 | Wiring it up | Pull the metal layers apart |
| 10 | Dicing, testing, packaging | Explode the package, test the dies |
| 11 | Building a logic gate | Toggle the NAND inputs |
| 12 | Adding two numbers | Choose two 4-bit numbers and watch the carry ripple |
| 13 | A tiny CPU | Step through fetch → decode → execute |
| 14 | A pixel lights up | Mix a pixel colour; see its bytes |
| 15 | The whole journey | Where each step happens |

The gate, the adder and the CPU are real simulations. The adder is built only from NAND gates, and the CPU's answer is drawn on the 3D screen at stop 14.
Every stop has a **Where it happens** block, an approximate scale badge and numbered sources.
There is also a "Read as text" version, pre-rendered into the HTML. Browsers without WebGL get that version automatically.

### Files

| File | What it holds |
|---|---|
| `sand-to-signal/data.js` | **All content**: stops (text, camera `look` + `view`, scale badge, place, hands-on control), station positions, sources |
| `sand-to-signal/logic.js` | Pure simulations: NAND, full adder, ripple-carry adder, toy CPU, pixel helpers |
| `sand-to-signal/core.js` | Pure helpers: hash routing, throttle, camera maths, data validation |
| `sand-to-signal/scene.js` | The 3D models, built from simple three.js shapes (no downloaded models) |
| `sand-to-signal/tour.js` | Captions, input, camera flights, hands-on controls; loads three.js after the first caption shows |
| `vendor/three.min.js` (shared) | three.js r186 (`three@0.186.1`), tree-shaken to the classes the 3D pages use and minified. MIT licence in `vendor/LICENSE-three.txt`. To add a three.js class, rebuild it with esbuild from an entry file that exports the classes you need |
| `sand-to-signal/prerender.mjs` | Writes the text version, first caption and Sources list into `index.html` |

### Editing the tour

- **Change text:** edit the stop in `data.js`, then run `node sand-to-signal/prerender.mjs`.
- **Re-tune a camera:** each stop has `look: [x, y, z]`, the point to look at, and `view: { az, el, dist }`, the angle around in degrees, the height angle and the distance. Open `sand-to-signal/#stop-N`, drag to find a good angle, and copy the numbers back. On desktop and phones the camera moves back automatically so the model clears the caption.
- **Move or add a model:** station positions are in `STATIONS` (`data.js`), and each model is one function in `scene.js`.

### Tests

```bash
node --test sand-to-signal/tests/*.test.mjs
node sand-to-signal/tests/e2e.mjs http://localhost:8765/
```

### Sources

Facts come from ASML ([How microchips are made](https://www.asml.com/en/technology/all-about-microchips/how-microchips-are-made), [the main manufacturing steps](https://www.asml.com/en/news/stories/2021/semiconductor-manufacturing-process-steps), [Microchip basics](https://www.asml.com/en/technology/all-about-microchips/microchip-basics), [Light and lasers](https://www.asml.com/en/technology/lithography-principles/light-and-lasers)), the [USGS silicon summary](https://pubs.usgs.gov/periodicals/mcs2025/mcs2025-silicon.pdf), and Wikipedia's articles on polysilicon, the Czochralski method, wafers, fabrication, multigate transistors, NAND logic, adders, the instruction cycle and frame buffers. The full list is in the page's Sources panel.

## Issue 06: How the Internet Moves Data

![How the Internet Moves Data: a packet crossing the globe from Mumbai to London](internet/images/screenshot.jpg)

A self-playing 3D tour built on a globe with real coastlines. It runs about 9 minutes, plus whatever time you spend on the hands-on panels. It uses the same player as Issue 01: autoplay, scrubbing, chapters, speed, captions, drag to look around, and "Read as text".
On some beats a **✋ Try it** button opens a panel where you can experiment:

- **Send a packet:** pick any two cities and see the path, the cable distance, the straight-line distance and the minimum round trip at light speed.
- **Cut a cable:** cut any undersea link and watch traffic reroute onto a longer, slower path. Then repair it.
- **Look up example.com:** step through DNS: resolver → root → .com → authoritative → answer.
- **Lose a packet:** drop any packet and see TCP resend it while UDP carries on without it.

| # | Chapter | What plays in 3D |
|---|---|---|
| 01 | A network of networks | The globe, cities and links; people online (ITU) |
| 02 | Packets | A photo split into packets with headers, travelling out of order, and reassembled |
| 03 | Addresses | IPv4 (32 bits) vs IPv6 (128 bits); NAT at home |
| 04 | DNS | Resolver → root → .com → authoritative, then caching; root servers worldwide |
| 05 | The first mile | Phone → Wi-Fi or mast → your ISP |
| 06 | Routers and hops | Hop-by-hop forwarding, time to live, traceroute |
| 07 | BGP | Networks announcing routes, and a bad announcement being fixed |
| 08 | Internet exchanges | Many networks swapping traffic over one shared switch |
| 09 | Undersea cables | 600+ cables, what's inside one, landing stations, repair ships |
| 10 | Speed and distance | Light in fibre, about 200,000 km/s, and the minimum round trip |
| 11 | Delivery rules | TCP vs UDP; HTTPS and TLS encryption |
| 12 | Bringing data closer | CDNs and caches (links to Issue 04) |
| 13 | When things break | Cable cuts (the 2008 Mediterranean cuts) and rerouting |
| 14 | Journey's end | One request, end to end |

**Honest maps:** the coastlines are real (Natural Earth, public domain). The cable network drawn on the globe is an **illustration**, not real cable routes, and is labelled as such. The distance and light-speed maths is real.

**Real photos and a guide:** the same as Issue 01. Six real photos (a phone mast, glowing fibre, network switches, data-center cabling, real undersea cable samples and a cable ship) stand in the scene on their beats, and the drawn guide reads every caption aloud. Opening a Try it panel pauses her and moves photos aside.

### Files

| File | What it holds |
|---|---|
| `internet/data.js` | **All content**: 14 chapters of beats, cities, the illustrative links, sources, recaps |
| `internet/net.js` | Pure network maths: great-circle distances, shortest paths, light-speed delay, DNS steps, TCP/UDP delivery |
| `internet/land.js` | Coastlines from Natural Earth 1:110m (public domain), converted from the world-atlas package |
| `internet/timeline.js` | Same timeline helpers as Issue 01 |
| `internet/world.js` | The globe and the close-up studio sets |
| `internet/player.js` | The film player plus the Try it panels |
| `internet/photos/` | The real photos, listed with credits in `PHOTOS` in `data.js` |

Edit captions in `data.js`, then run `node internet/prerender.mjs`.

### Tests

```bash
node --test internet/tests/*.test.mjs shared/tests/*.test.mjs
node internet/tests/e2e.mjs http://localhost:8765/
```

### Sources

The ITU (people online, 2026), TeleGeography's Submarine Cable FAQs (cable count, length, size, faults, design life, satellite share), RFCs 791, 8200, 1034, 4271, 9293, 768 and 8446, IANA and root-servers.org (root servers), RIPE NCC (IPv4 run-out), PeeringDB, and Wikipedia for traceroute and the 2008 cable cuts. The full list is in the tour's Sources panel.

### Photo credits: How the Internet Moves Data

From Wikimedia Commons, resized for the web:

- **A mobile phone mast**: Diacius, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mobile_phone_mast.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- **Optical fibre carrying light**: Hustvedt, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Fiber_optic_illuminated.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- **Network switches and their cables**: ShakataGaNai, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Network_switches.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- **Network cabling inside a data center**: Victor Grigas, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_24.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0)
- **Real undersea cable samples, heavy armour to lightweight**: Lonnie Hagadorn, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Submarine_Optical_Cables.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)
- **A cable ship (Cable Enterprise) in port**: David Martin, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Cable_laying_ship_%22Cable_Enterprise%22_seen_from_Mayflower_Park_-_geograph.org.uk_-_6350872.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0)
