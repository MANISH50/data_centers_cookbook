# The Cloud Cookbook

A free library of interactive, magazine-style explainers about how the cloud really works, written in plain everyday language.
Each magazine has real photos, diagrams you can tap, small simulations and a quiz at the end of every chapter.

**Live library:** https://manish50.github.io/data_centers_cookbook/

![The library home page with a cover card for each magazine](images/home-screenshot.jpg)

## The magazines

| Issue | Magazine | Level | Chapters | Live link |
|---|---|---|---|---|
| 01 | **Inside the Cloud**: How a Data Center Really Works | Beginner | 12 · about 35 min | https://manish50.github.io/data_centers_cookbook/data-centers/ |
| 02 | **Inside the Lakehouse**: Azure Databricks, from First Notebook to Architect | Beginner to Advanced | 21 · about 2 h | https://manish50.github.io/data_centers_cookbook/azure-databricks/ |

The home page remembers the last chapter you reached in each magazine and offers **Continue reading**.
That progress is stored only in your browser (`localStorage`), and every page still works when storage is blocked.

## How the site is organised

```
index.html                 library home page (magazine stand)
images/                    home-page images (README screenshot)
data-centers/index.html    Issue 01, photos in data-centers/images/
azure-databricks/index.html Issue 02, photos in azure-databricks/images/
.nojekyll                  serve files as-is on GitHub Pages
```

Each magazine is a single self-contained `index.html` (styles, scripts and diagrams inline) with its photos next to it.
Every path is relative, so the site works on GitHub Pages and when opened straight from disk.

### Adding a magazine

1. Create a folder, for example `my-topic/`, with its `index.html` and `images/` (include `images/cover-sm.jpg` and `images/cover-lg.jpg`).
2. Add an "All magazines" link to `../` in its top bar. To support Continue reading, save `localStorage['cookbook:my-topic'] = {id, num, title, at}` inside a try/catch.
3. Add one entry to the `MAGAZINES` list at the top of the script in the root `index.html`.

## Run it locally

No server or install needed: open `index.html` in any modern browser.
Fonts (Fraunces and Inter) load from Google Fonts when online, and the pages fall back to system fonts offline.

---

## Issue 01: Inside the Cloud

![Inside the Cloud cover page](data-centers/images/screenshot.jpg)

An interactive story about data centers for curious beginners. It covers servers, racks, storage, networking, power, cooling, **water use**, security, redundancy, the cloud, efficiency, and how data centers are built and run.
It also traces real activities step by step through the building, such as coding with Claude Code, running a Spark job on Databricks, streaming video, paying with UPI and sending a WhatsApp message.

| # | Chapter | Try it |
|---|---|---|
| 01 | What is a data center? | "Your day online" app tapper |
| 02 | The guided tour: racks, storage, networking | Clickable floor plan, build-a-rack, spine-leaf diagram |
| 03 | Meet the servers | Server type explorer, clickable server photos, CPU-vs-GPU painting race |
| 04 | The journey of a request | Animated request: normal website vs AI chatbot |
| 05 | Power | Power-failure simulator (UPS → batteries → generator) |
| 06 | Cooling (and water) | Hot/cold-aisle airflow, air vs liquid, water evaporated per rack |
| 07 | Security, fire and monitoring | Security layers, fire suppression, control-room alarm game |
| 08 | Redundancy, uptime and tiers | Break units in N / N+1 / 2N, uptime "nines" slider |
| 09 | Virtualization and the cloud | Slice-a-server, "pizza as a service" |
| 10 | Real life, traced | Activity tracer: Claude Code, Spark on Databricks, streaming, UPI, WhatsApp, CI, video calls |
| 11 | Energy, water and the planet | PUE + WUE calculator |
| 12 | Planning, building and running | Pick-the-site game, build steps, a day in the life |

**Facts and sources:** numbers were checked in November 2026 against the IEA (*Energy and AI*, 2025), the Uptime Institute, Google, Microsoft, LBNL, NVIDIA and Supermicro specifications, NPCI, Netflix, Databricks, WhatsApp and others.
The full list with links is in the "Sources" section at the end of the magazine.

### Photo credits: Inside the Cloud

All photos come from [Wikimedia Commons](https://commons.wikimedia.org/) under the free licences below. They were resized and compressed for the web, and some were cropped; adapted versions keep the same licence.
Diagrams and animations were drawn for this site. A machine-readable list is in [`data-centers/images/credits.json`](data-centers/images/credits.json).

| Used for | Photo | Author | Licence |
|---|---|---|---|
| Cover: Wikimedia Foundation server racks | [Wikimedia Foundation Servers-8055 35](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_35.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 1 opening: Google data center, The Dalles, Oregon | [Google Datacenter - The Dalles, Oregon (17832143871)](https://commons.wikimedia.org/wiki/File:Google_Datacenter_-_The_Dalles,_Oregon_(17832143871).jpg) | Tony Webster from Minneapolis, Minnesota, United States | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Ch 1: server hall at CERN | [CERN Server 03](https://commons.wikimedia.org/wiki/File:CERN_Server_03.jpg) | Florian Hirzinger - www.fh-ap.com | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 1: CERN data centre building, Geneva | [CERN data centre](https://commons.wikimedia.org/wiki/File:CERN_data_centre.jpg) | Unnerving duck | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 2 opening: data center aisle | [BalticServers data center](https://commons.wikimedia.org/wiki/File:BalticServers_data_center.jpg) | BalticServers.com | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 2: Dell servers in a rack, with rack-unit numbers (Wikimedia) | [Wikimedia Foundation Servers-8055 43](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_43.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 2: storage system at Ifremer's Datarmor centre | [Le Centre Datarmor, les coulisses (Ifremer 00957-106840 - 54953)](https://commons.wikimedia.org/wiki/File:Le_Centre_Datarmor,_les_coulisses_(Ifremer_00957-106840_-_54953).jpg) | Gregory Rocher / Ifremer | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Ch 2: network switches and cables | [Network switches](https://commons.wikimedia.org/wiki/File:Network_switches.jpg) | ShakataGaNai | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 3 opening: Wikimedia Foundation servers | [Wikimedia Foundation Servers-8055 13](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_13.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 3: rack servers | [Dell PowerEdge Servers](https://commons.wikimedia.org/wiki/File:Dell_PowerEdge_Servers.jpg) | Dsv | Public domain |
| Ch 3: HP BladeSystem c7000 blade chassis | [HP c7000-1](https://commons.wikimedia.org/wiki/File:HP_c7000-1.jpg) | Redline | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 3: tower-style servers on shelves (BalticServers) | [BalticServers data center](https://commons.wikimedia.org/wiki/File:BalticServers_data_center.jpg) | BalticServers.com | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 3: web and application servers (Wikimedia) | [Wikimedia Foundation Servers-8055 17](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_17.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 3: rack servers (Wikimedia) | [Wikimedia Foundation Servers-8055 08](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_08.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 3: storage server type | [Le Centre Datarmor, les coulisses (Ifremer 00957-106840 - 54953)](https://commons.wikimedia.org/wiki/File:Le_Centre_Datarmor,_les_coulisses_(Ifremer_00957-106840_-_54953).jpg) | Gregory Rocher / Ifremer | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Ch 3: AI server type | [Nvidia DGX-B200-HGX](https://commons.wikimedia.org/wiki/File:Nvidia_DGX-B200-HGX.jpg) | Pokiiri | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 3: IBM System z10 mainframe | [IBM System z10](https://commons.wikimedia.org/wiki/File:IBM_System_z10.jpg) | Roberto Berlim from Brazil | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| Ch 3: inside a 1U web server (Dell PowerEdge 850) | [Inside and Rear of Webserver](https://commons.wikimedia.org/wiki/File:Inside_and_Rear_of_Webserver.jpg) | Rodzilla at English Wikipedia | [CC BY 2.5](https://creativecommons.org/licenses/by/2.5) |
| Ch 3: NVIDIA HGX B200 GPU board | [Nvidia DGX-B200-HGX](https://commons.wikimedia.org/wiki/File:Nvidia_DGX-B200-HGX.jpg) | Pokiiri | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 3: NVIDIA GB200 NVL72 rack | [Nvidia DGX GB200](https://commons.wikimedia.org/wiki/File:Nvidia_DGX_GB200.jpg) | Pokiiri | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 4 opening: illuminated optical fibres | [Fiber optic illuminated](https://commons.wikimedia.org/wiki/File:Fiber_optic_illuminated.jpg) | Hustvedt | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 4: network cables plugged into servers (Wikimedia) | [Wikimedia Foundation Servers-8055 24](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_24.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 5 opening: UPS cabinet row | [EPS 6000 Row B](https://commons.wikimedia.org/wiki/File:EPS_6000_Row_B.jpg) | Robert.Harker | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 5: data center backup batteries | [Datacenter Backup Batteries](https://commons.wikimedia.org/wiki/File:Datacenter_Backup_Batteries.jpg) | Jelson25 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| Ch 5: diesel generator of a hospital data center | [Power generator of a hospital data center](https://commons.wikimedia.org/wiki/File:Power_generator_of_a_hospital_data_center.jpg) | Mikael Häggström | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Ch 6 opening: CRAC cooling units | [CRAC Cabinets 2](https://commons.wikimedia.org/wiki/File:CRAC_Cabinets_2.jpg) | Robert.Harker | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 6: aisle between server cabinets | [Cabinet Asile](https://commons.wikimedia.org/wiki/File:Cabinet_Asile.jpg) | Robert.Harker | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 6: perforated raised-floor panel | [All-steel perforated ventilation raised floor panel 28 percent open area](https://commons.wikimedia.org/wiki/File:All-steel_perforated_ventilation_raised_floor_panel_28_percent_open_area.jpg) | LP Floor Group | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Ch 6: cooling tower on a data center, Mesa, Arizona | [Data center cooling tower](https://commons.wikimedia.org/wiki/File:Data_center_cooling_tower.jpg) | Rsparks3 | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Ch 6: Asperitas immersion cooling system | [Asperitas AIC24 Immersion system](https://commons.wikimedia.org/wiki/File:Asperitas_AIC24_Immersion_system.jpg) | Rolf Brink | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 7 opening: locked customer cage | [Cage Quelle EMC HostCo GmbH](https://commons.wikimedia.org/wiki/File:Cage_Quelle_EMC_HostCo_GmbH.jpg) | Virtuo Doc | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 7: racks seen through protective enclosure (NOIRLab) | [Data Center Fish Eye View (noirlab-racks-155)](https://commons.wikimedia.org/wiki/File:Data_Center_Fish_Eye_View_(noirlab-racks-155).jpg) | International Gemini Observatory/NOIRLab/NSF/AURA/Manuel Paredes | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Ch 7: gas fire-suppression discharge in a server room | [COMPUTER ROOM DISCHARGE](https://commons.wikimedia.org/wiki/File:COMPUTER_ROOM_DISCHARGE.JPG) | Keith4048 | Public domain |
| Ch 8 opening: rows of Wikimedia Foundation servers | [Wikimedia Foundation Servers-8055 08](https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_08.jpg) | Victor Grigas | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 9 opening: IBM Blue Gene/P supercomputer, Argonne | [IBM Blue Gene P supercomputer](https://commons.wikimedia.org/wiki/File:IBM_Blue_Gene_P_supercomputer.jpg) | Argonne National Laboratory | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| Ch 10 opening: compute trays of an NVIDIA GB200 rack | [Nvidia DGX GB200](https://commons.wikimedia.org/wiki/File:Nvidia_DGX_GB200.jpg) | Pokiiri | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 11 opening: wind turbines and power lines, East Sussex | [Wind Turbines and Power Lines, East Sussex, England - April 2009](https://commons.wikimedia.org/wiki/File:Wind_Turbines_and_Power_Lines,_East_Sussex,_England_-_April_2009.jpg) | Diliff | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 11: Google data center campus, Mayes County, Oklahoma | [Google Mayes County P0004974a](https://commons.wikimedia.org/wiki/File:Google_Mayes_County_P0004974a.jpg) | Xpda | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 11: district heating pipes, Jyväskylä, Finland | [District heating pipes in Jyväskylä](https://commons.wikimedia.org/wiki/File:District_heating_pipes_in_Jyv%C3%A4skyl%C3%A4.jpg) | Antti Leppänen | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Ch 12 opening: generators at a nearly finished data center | [Una batteria di grossi generatori alimentati a gasolio in un Data Center in via di ultimazione](https://commons.wikimedia.org/wiki/File:Una_batteria_di_grossi_generatori_alimentati_a_gasolio_in_un_Data_Center_in_via_di_ultimazione.jpg) | Lapalmauz | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 12: load bank testing a standby generator | [Air cooled load bank](https://commons.wikimedia.org/wiki/File:Air_cooled_load_bank.jpg) | Wtshymanski | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Finale: computing rack at Ifremer's Datarmor centre | [Le Centre Datarmor, les coulisses (Ifremer 00957-106840 - 54954)](https://commons.wikimedia.org/wiki/File:Le_Centre_Datarmor,_les_coulisses_(Ifremer_00957-106840_-_54954).jpg) | Gregory Rocher / Ifremer | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Ch 1: computer room, University of St. Gallen (historic) | [Blick in einen Raum des HSG-Rechenzentrums HSGH 022-001118](https://commons.wikimedia.org/wiki/File:Blick_in_einen_Raum_des_HSG-Rechenzentrums_HSGH_022-001118.jpg) | University of St. Gallen | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Ch 12: technician working on network equipment | [Network server and technician](https://commons.wikimedia.org/wiki/File:Network_server_and_technician.jpg) | Bill Branson (Photographer) | Public domain |

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
