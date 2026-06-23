# My Vivid Vision — Tuesday, June 17, 2031

*Written in the present tense, as if I am already living it. This is not a forecast or a to-do list. It is a photograph of a day five years out, described so clearly that I'd recognize it when I walk into it.*

> **This is the genesis version.** There's a sister document — *smelly-cat* — that describes the fully realized campus: a complete sensor mesh, AR you can't live without, the thing humming on its own. That's the destination. *This* document is where it begins. In 2031 we're not running a finished machine; we're **building** one, in the open, testing things nobody's tested at this scale. It's scrappy, it's early, and it's the most exciting work of my career. Some quiet part of me wonders, half-joking: a campus that senses itself and advises its keepers on how to react — *is this how Skynet starts?* I'll take the joke. Then I'll go build the next node.

---

## How to read this (and the "how much can change" problem)

When I look backward, the asymmetry is obvious:

- **2002** — I start as a Mechanical Engineer in Oil & Gas. Physical systems, pressure, flow, things that move and fail in the real world.
- **2021** — I change directions entirely and become an Application Developer at Rice. New field, new tools, mid-life pivot. It worked.
- **2026** — I'm a mid/senior engineer who has found his lane: infrastructure deployment, and a growing obsession with IoT and bringing physical-world data together.
- **2031** — *this document.*

The lesson from looking back: **the tools changed enormously, the rhythms changed very little.** In 2021 the AI tooling I use every day didn't meaningfully exist; by 2026 it's everywhere. So when I write forward, I'm **bold about scope and tools** (assume big shifts — that's realistic) and **steady about the shape of my days** (mornings, climbing, building things with my hands). My pivot from steel and pressure to code wasn't a break from my past — it was the setup. In 2031 the two halves of my career finally fuse: I'm starting to make computers touch the physical world, the way I always understood the physical world first. Not finished — *started.* And starting is the hard, fun part.

---

## The Day

### 5:50 AM — Awake before the alarm, on my own terms
I wake up without dread. No 7:00 AM scramble, no commute hanging over me. The remote-first arrangement I fought for years ago is now just *how it works* — and I have more of the morning to myself than I did in 2026. The first hour belongs to me, not to a calendar.

The house is quiet. I check nothing work-related. My phone shows the home dashboard I built — the same Home Assistant tinkering that is now, professionally, becoming a campus-scale idea. Overnight the house ran itself: power, climate, the small automations. It's a reminder that good infrastructure is *invisible when it works* — and a reminder of exactly what I'm trying to grow from a house to a university. That's the standard I'm holding the new system to.

### 6:00 AM — Climb first, play late.... also first.
I'm not normally a morning person. But on days I get to work my bouldering project outside — or, like today because it's June, at the gym — the early wake-up is bearable, even good. Three mornings a week this is climbing; today it's a session at the gym wall before the day starts. I'm strong in a way I wasn't in 2026, because I finally have the time and stopped trading my health for deadlines. Climbing is back in my life as a *habit*, not a memory. The big trips — multi-day climbing, kayaking rivers — are on the calendar again, real and funded, not "someday."

This morning I have company. My five-year-old daughter just finished forest school, where she got deep into all things outdoors — and somehow that turned into her wanting to come to the climbing gym with me today. In a five-year-old way "looking for bugs under rocks" == "climbing indoors with dad".  I don't quite get it...but I accept it gladly. We go exercise (or, for her, play) together, then split our favorite apple fritter for breakfast. It's the kind of morning I couldn't have pictured in 2026.

### 7:15 School is important.  Go!
Leah and I wait in the parent drop-off line at Thrasher Elementary school.  We talk about the day she's going to have and dinner with friends tonight.  She runs off to kindergarden with an oversized backpack carrying all the stuff she doesn't need.  The heavy fog or the pollen must be causing my eyes to be watery.  My heart smiles as I drive off to "the office"

### 7:30 AM — Slow coffee, sharp mind
Coffee, no rush. I spend twenty minutes reading — not email, but the field. Keeping up with computer science is a daily ritual, not a panic. New deployment patterns, what's happening at the edge, cheap radar modules, the latest in how we orchestrate fleets of devices. I filter through articles, going deep on the one thing that matters this week — and lately, that one thing usually finds its way into a prototype on my bench by Friday. I'm never the last person in the room to hear about something. Often I'm the first.

### 8:30 AM — The work begins, and I'm the principal
I sit down as **Principal Engineer for Physical & Edge Infrastructure** at Rice. That title means something specific: when the hard infrastructure-deployment questions come up — the ones that span software, hardware, and the messy physical campus — they come to me. I'm the expert. The pivot I made in 2021 is complete; I didn't just join the field, I reached the top of a corner of it. And now I get to point that expertise at a blank canvas.

My morning standup is short. I lead a small, capable team. I'm not buried in tickets — I set direction, I unblock, I design the systems others build on. The +55% income I wanted didn't come from working more hours; it came from being **the person the institution can't easily replace**, operating at principal scope, on work the institution has never tried before.

### 9:30 AM — The campus starts to wake up
This is the work I dreamed about in 2026, and in 2031 it's finally *beginning* — real hardware on real buildings, the first nerves of a campus learning to feel itself.

We're standing up a **campus-wide sensor network**, and we're doing it the way you build something you intend to last: start small, prove value, earn the next step.

- **Where it started — water.** The first win was unglamorous and perfect: **monitoring water bills across campus.** A few sensors, a clear before/after, a number a CFO understands. That credibility bought everything that came after.
- **Where it's going now — energy & generation.** We're expanding into **live energy consumption *and* power generation** monitoring, building by building. For the first time Rice can start to see its own metabolism — not everywhere yet, but in more places every month.
- **The architecture.** Underneath it all, we're building a **Home Assistant architecture at campus scale.** Literally: the home-automation philosophy I've tinkered with for years — local-first, open, composable — stretched across a university. It's audacious and a little absurd, and it's working.
- **The device I can't stop talking about.** We're starting to incorporate **10G mmWave radar** to cut **cooling and lighting in auditoriums when no one's in them.** A **~$10 device is saving $1,000s a month** across campus. That ratio is the whole pitch in a single line — and it's why doors keep opening.

The open-source **LoRaWAN** spine is early too: a handful of nodes, the first outside contributors, the secure protocols still being hardened. The part I'm proudest of isn't scale yet — it's that we chose *open* from day one, so that when this grows, it grows as something the whole campus (and eventually beyond) can build on.

And the flashy stuff — **AR wayfinding, educator-glasses plugins** — that's *experiment*, not product. We're poking at it, building throwaway prototypes, learning what's real. 2031 is too early to pretend it's deployed. But I can see the shape of it from here, and we're laying the rails it'll one day run on.

### 11:00 AM — Taking the pulse of the web
The second thing we're building this year has nothing to do with sensors on walls — it's about the sprawl of *websites* Rice runs.

For years the dream was consolidation: get everything onto one platform and finally tame it. In 2031 I've **given that up — on purpose.** GCP is not the answer. Neither is AWS. Neither is Azure. **There is no one answer.** It's called the ***WEB*** for a reason — it's a web, heterogeneous and tangled by nature, and pretending you can pull it all under one roof is how you waste a decade. So we stopped fighting the shape of the thing.

Instead, I've brought **all of campus's web needs into one place where they can be *monitored*** — not owned, *watched.* The system **takes the pulse** of the entire web estate and **advises campus on how to prepare and react.** It watches:

- **Uptime / downtime** — is it even up?
- **SEO** — can anyone find it?
- **Cost** — what's each property actually burning?
- **AI token usage** — the new line item nobody was tracking until it hurt.
- **WCAG accessibility** — is it usable by everyone?
- **Outdated sites** — what's quietly rotting?
- **Security risks** — what's exposed?

And crucially, it **notifies the owners** — each site's people get told how their site is behaving, before it becomes someone else's emergency. One pulse, taken across an unruly web, turned into advice the institution can act on. This, more than anything, is the moment the campus starts to feel like it has a nervous system.

### 12:30 PM — Lunch away from the screen
A real break. No sad-desk lunch. Some days I'm out of the house entirely — the remote freedom means a coffee shop, a trail, a different city for a week. The flexibility I wanted isn't a perk anymore; it's the texture of my life.

### 1:30 PM — Deep work and mentoring
The afternoon is for the work only I can do: architecture, the hard deployment design, the gnarly integration between a physical system and the software stack — and right now, a lot of *figuring out what hasn't been figured out yet*, because so much of this is new. I also spend real time **mentoring** — turning mid-level engineers into the kind of expert I became. Teaching it is how I know I've mastered it. Watching someone on my team solve something I would've struggled with five years ago is one of the best feelings of the job.

### 3:30 PM — Impact I can point to
I work on **projects that visibly matter to Rice.** Not maintenance for its own sake — initiatives leadership cares about, that touch students and faculty every day, that touch the physical realm. I'd never go to a "dinner party," but I might host a cook-out with some ribs or burgers — and when I tell people there what I do, they get it immediately, because they can already *see* the first pieces of it on campus: the lights in the empty hall that turned themselves off, the water leak we caught before it flooded a basement.

A campus full of students and educators is a campus full of great thinkers. They know what they want and they suggest a lot of things to try. Because we're early, we get to actually *try* them — fast, cheap, in the open. Some ideas die in a week. A few become the next node in the network nobody will be able to imagine living without.

### 5:00 PM — Down tools, on time
Before I close the laptop, I take a few minutes to recap the day and plan for tomorrow — a small ritual that lets me actually let go once the lid is shut. The boundary holds because I designed it to: even this early, I refuse to build a system that needs me babysitting it after hours. The "more time for myself" I asked for in 2026 is now just normal. Evenings are mine.

### 5:30 PM — The maker comes out
Building projects are back. Garage, workbench, a soldering iron, a 3D printer humming. Half of it feeds my work — the next mmWave enclosure, a LoRaWAN node I'm hardening, the home-lab prototype that becomes Monday's campus pitch — half is pure play. The mechanical engineer never left — he just got a code editor and an army of microcontrollers. Some evenings it's a kayak to patch or gear to sort for the next trip.

### 6:30 PM — Family & Friends dinner night
It's Tuesday, so it's Family & Friends dinner night. In the days gone by, my wife and my sister and brother-in-law used to do family dinner back in Houston at our favorite Mexican place. We kept tempting them and others to migrate to the Appalachians with us — and a few actually took us up on it. Mexican food is seriously lacking up here, but the tradition survived the move: Tuesday night, somewhere with room for the kids to play and a drink for the adults. Tonight it's at our usual spot, and I'm actually *there* — not half-checking a phone, not mentally debugging. Present in a way the 2026 version of me wasn't always able to be.

### 9:30 PM — Quiet, and a clear head
The house settles into its overnight self. I read a little, plan nothing frantically. I fall asleep as someone who is **respected for his expertise, paid well for it, healthy, free with his time, and at the very start of building something that touches the real world** — exactly the things I set out to do five years ago, on a day I almost couldn't picture. Not finished. *Begun.* And the beginning is the best seat in the house.

---

## The anchors (what's true on June 17, 2031)

- **Role**: Principal / expert engineer in infrastructure deployment, with a defined specialty in physical & edge computing at Rice — now pointed at brand-new, unproven work.
- **Craft**: I'm current. Keeping up with CS is a daily, calm habit — I'm at or ahead of the curve, and turning what I read into prototypes the same week.
- **Impact — the genesis, not the finished thing**:
  - An **emerging campus sensor network**: started with **water-bill monitoring**, now expanding into **energy use and power generation** — a **Home Assistant architecture at campus scale.**
  - The flagship early win: **10G mmWave radar** cutting **cooling/lighting in empty auditoriums** — a **~$10 device saving $1,000s/month.**
  - An **open-source LoRaWAN spine** in its early days, with its first outside contributors.
  - A **campus web-monitoring "pulse" system**: I gave up on one-cloud consolidation (**no GCP/AWS/Azure single answer — it's the *WEB***) and instead *watch and advise* — tracking **uptime, SEO, cost, AI tokens, WCAG accessibility, outdated sites, security risks**, and **notifying site owners** of how their sites behave.
  - **AR/wayfinding** as a deliberate *experiment*, not a product — too early to be real, but rails are being laid.
  - The half-serious through-line: a campus that senses itself and advises its keepers. *The start of Skynet?* The good kind, I hope.
- **Work style**: Remote-first, boundaried, flexible — living in the Appalachians, working for a Houston campus. Location is a choice, not a constraint.
- **Time**: Mornings and evenings are mine. Climbing weekly, big trips on the calendar, the workbench busy again.
- **Money**: +55% over 2026 — earned through scope and irreplaceability, not extra hours.

---

*Revisit this once a quarter. Don't grade it — steer by it. This isn't the finished campus from the smelly-cat vision; it's the first stretch of the road there. The 2021 pivot proved I can become someone new in five years. This is just the next one — and this time I get to watch it being born.*
