# Google Maps — Person-to-person navigation capability report

**Status:** Research for stack lock (navigation layer). Not a product commitment.  
**Date:** 2026-09-12  
**Related:** [stack.md](stack.md), [day-of.md](day-of.md), [auth.md](auth.md)  
**Question answered:** What does Google Maps Platform actually give us for *person → person* navigation on a map overlay — including buildings/floors?

---

## 1. Executive answer

**Google Maps will not give Converge “AirTag-style indoor floor navigation to another person” out of the box.**

| Need (Converge day-of) | Google Maps Platform? | Notes |
|------------------------|----------------------|--------|
| Show people as pins on a map | **Yes** | Maps JavaScript API markers / Advanced Markers |
| Draw a line / overlay between me and them | **Yes** | Polyline, symbols, custom overlays |
| Live update their position | **Partially** | **Your backend** streams lat/lng; Google only renders |
| Outdoor walking route (sidewalks/roads) me → them | **Yes** | Routes API / Directions (WALKING) between two coordinates |
| Turn-by-turn nav in the **browser** | **Weak / no** | Navigation SDK is **Android/iOS**, not Maps JS |
| Indoor floor plans for arbitrary venues | **No (general)** | Only Google **Indoor Maps partner** buildings |
| Indoor **routing** across floors (stairs/elevators) | **No** via Google APIs for custom venues | Needs venue graph (MapsIndoors, Mappedin, custom) |
| Know which floor someone is on | **No from GPS alone** | Needs beacons / Wi‑Fi RTT / manual floor / venue SDK |
| “Warmer / colder” proximity | **DIY** | Haversine (and optional heading) on your coords — Google optional |

**Implication for Converge:** Day-of locked UX (map-first + coarse pin + warmer/colder + team privacy) is **aligned with what Google can support**. True corridor-level indoor P2P is a **different product layer** (venue indoor platform or custom floor graphs), not a Google Maps checkbox.

---

## 2. Separate three problems people conflate

```
A. MAP CANVAS          → draw basemap + overlays
B. LIVE P2P POSITION   → share continuous locations between users
C. NAVIGATION / ROUTING → path + guidance from A to B
     C1 outdoor street/path network
     C2 indoor floor-aware graph
```

Google is strong at **A** and **C1**.  
**B** is almost entirely **Converge + Supabase realtime + browser Geolocation**.  
**C2** is where Google falls short for hackathon venues.

---

## 3. Product surface → Google capability matrix

### 3.1 Maps JavaScript API (web — our Next.js client)

| Capability | Available | P2P relevance |
|------------|-----------|---------------|
| Interactive map, camera, styling | Yes | Basemap for day-of |
| Markers / Advanced Markers | Yes | Me, teammate, match, looking pins |
| Polylines / polygons | Yes | Straight “bearing line” me→them; geofence rings |
| Ground overlays (image over lat bounds) | Yes | **Custom floor-plan PNG** per floor (DIY indoor look) |
| Custom overlays / WebGL overlay | Yes | Richer finder UI on map |
| Geolocation blue-dot (browser) | Via browser + Marker | Not Google “sharing” another user |
| DirectionsRenderer (legacy Directions) | Yes | Outdoor route polyline on map |
| Routes library (`computeRoutes`) in JS | Yes (newer) | Outdoor multi-modal routes including **walking** |
| Indoor floor picker for partner buildings | **Limited vs native** | Android/iOS have first-class `IndoorBuilding`; web historically weaker; do not bet MVP on this |
| Indoor walking directions through halls | **No** | Not a Maps JS feature for arbitrary buildings |

### 3.2 Routes API / Directions (server or client)

| Capability | Available | P2P relevance |
|------------|-----------|---------------|
| Route between two lat/lng | Yes | Me → their **last known outdoor** point |
| Travel mode WALKING | Yes | Campus outdoors |
| ETA, distance, step instructions | Yes | Optional “~4 min walk” outdoors |
| Follows roads/paths Google knows | Yes | **Not** through private building interiors |
| Floor index in request | **No** (Google) | Floor is not a first-class Routes parameter for custom indoor |
| Re-route as target moves | DIY | Re-call Routes as their pin moves (cost + rate limits) |

**P2P outdoor pattern:**  
`viewer.latlng` + `target.latlng` → Routes WALKING → draw polyline + optional step list.  
When target is indoors / GPS jumps, route quality degrades; Converge should fall back to **bearing + distance + warmer/colder**.

### 3.3 Navigation SDK (Android / iOS)

| Capability | Available | P2P relevance |
|------------|-----------|---------------|
| In-app turn-by-turn (Google nav UI) | Yes (native) | Driver/fleet style; **not** our Next.js web MVP |
| Pass Routes API route token | Yes | Mobile only |
| Web / Next.js | **No** | Out of medium lock unless native shell later |

### 3.4 Google Indoor Maps (partner program)

| Capability | Available | P2P relevance |
|------------|-----------|---------------|
| Floor plans in Google Maps consumer app | Partner venues | Airports, malls, stadiums, some campuses |
| Floor switcher when zoomed in | Partner venues | Display only |
| Submit *your* hackathon venue floors via public API | **No self-serve API** | Property owner partnership / tools |
| Guaranteed coverage for random hackathon halls | **No** | Assume **unavailable** |
| Indoor routing API for those floors | **Not a general developer product** for custom P2P | Don’t plan on it |

### 3.5 What Google does *not* provide (critical)

- A **Location Sharing API** (“share my live position with user X in your app”)
- **Floor detection** from the Maps API
- **Indoor graph routing** (rooms → corridors → stairs) for buildings you control
- Sub-meter indoor accuracy from Maps alone
- Web Navigation SDK equivalent

---

## 4. Person-to-person patterns on a Google map overlay

### Pattern P1 — Presence map (minimum viable Converge)

```
Supabase: broadcast presence {userId, lat, lng, updatedAt, looking/team flags}
Next.js + Maps JS: render AdvancedMarkers
Privacy rules: team-only vs looking (already locked in day-of.md)
```

**Google role:** canvas + markers.  
**Converge role:** who can see whom, geofence hide, throttle updates.

### Pattern P2 — Direct overlay guidance (no street routing)

```
Polyline or dotted line from me → target
UI: distance (m), bearing arrow, warmer/colder as distance delta
Optional: Compass heading from DeviceOrientationEvent
```

**Google role:** draw overlay.  
**Best fit** for indoor GPS noise and locked warmer/colder UX.

### Pattern P3 — Outdoor routed P2P

```
Routes API WALKING(me, target) → encode polyline on map
Refresh on significant target move (debounced)
```

**Google role:** path that follows campus paths/streets.  
**Fails** inside buildings, multi-floor, courtyards Google doesn’t model well.

### Pattern P4 — Custom floor plan overlay (DIY indoor)

```
Per floor: GroundOverlay(floorPlanImage, latLngBounds)
UI floor switcher (Converge-owned)
Pins carry optional floorId; filter markers by active floor
Routing: none from Google — either no route, or your own graph
```

**Google role:** basemap + image overlay.  
**Converge role:** floor assets, switcher, pin floor tags.

### Pattern P5 — Venue indoor platform on Google basemap

```
MapsIndoors / Mappedin / similar
  - ingest venue CAD/floor data
  - floor-aware directions (incl. stairs)
  - often uses Google or Mapbox as basemap
```

**Google role:** optional basemap provider under their SDK.  
**Cost/ops:** venue onboarding per event — heavy for “any hackathon.”

---

## 5. Floors & buildings — blunt assessment

> “Will Google Maps provide realtime navigation within a building considering floors?”

| Interpretation | Answer |
|----------------|--------|
| Show Google’s indoor floor plan if the venue is a partner | Sometimes (display) |
| Switch floors in **our web app** for those partner buildings | Unreliable as MVP dependency; stronger on Android/iOS SDKs |
| Navigate person-to-person room→room with turn-by-turn indoors | **No** via Google alone |
| Detect that user moved from floor 1 → 2 automatically | **No** via Google Maps APIs |
| Overlay our own floor PNGs and switch floors manually | **Yes** (GroundOverlay + our UI) |
| Route across our own floor PNGs | **Not Google** — need indoor SDK or custom mesh |

For Converge’s typical customer (university hall / startup warehouse / conference center **without** Google Indoor partnership), treat **floors as Converge features**, not Google features.

---

## 6. Fit vs Converge locked day-of UX

| Locked decision | Google fit |
|-----------------|------------|
| Map-first web | Maps JS ✓ |
| Join before share location | App gate ✓ (not Google) |
| Team-private locations | App queries ✓ |
| Want to be found | App flag ✓ |
| Finder + warmer/colder | DIY on coords ✓ (Google optional for outdoor Routes) |
| User-dropped pins | Markers ✓ |
| Hybrid geofence | Geometry in app ± Maps circles ✓ |
| In-app only notifs | N/A |

**Conclusion:** Google Maps is a **strong basemap + outdoor routing + overlay** choice. It is a **weak indoor P2P navigation engine**.

---

## 7. Alternatives to evaluate next (navigation-focused)

| Option | Indoor floors | P2P live | Web | Notes |
|--------|---------------|----------|-----|--------|
| **Google Maps JS + DIY finder** | DIY overlays only | Yes (our realtime) | Yes | Lean for MVP |
| **Mapbox GL + DIY** | DIY | Yes | Yes | Similar split; nicer custom styling often |
| **Mappedin** | First-class | Possible | Yes | Venue mapping product |
| **MapsIndoors** | First-class + routing | Possible | Yes (Google/Mapbox basemap) | Strong indoor wayfinding |
| **Custom floor graph** (GeoJSON + router) | Yes if we build it | Yes | Yes | Eng heavy |
| **Native Google Navigation SDK** | Outdoor TBT | Destination-based | No web | Conflicts with web-first medium |

---

## 8. Recommended decision frame for Converge

### Tier 0 — Lock for MVP (matches product already)
- **Basemap:** Google Maps JS *or* Mapbox (still open — see stack.md)
- **P2P:** Supabase Realtime presence + markers
- **Finder:** bearing + distance + warmer/colder (**no** dependency on indoor Routes)
- **Optional:** Routes WALKING when both points look “outdoor” / high GPS accuracy

### Tier 1 — If organizers need real indoor wayfinding
- Add **Mappedin or MapsIndoors** for venues that upload floor data
- Keep Google/Mapbox as basemap underneath
- Still use our presence layer for P2P; use indoor SDK for “route to booth / room,” not only to person

### Tier 2 — Later
- Native shell only if web geolocation quality fails (already in medium.md)

---

## 9. Cost / complexity flags (Google)

- Maps JS + Routes are **billable** per load / request; moving-target P2P that re-routes often can get expensive — prefer overlay guidance indoors.
- Navigation SDK requires mobile apps + different licensing posture.
- Indoor partner program is **sales/ops**, not an API key flip.

---

## MVP conclusion (product lock — 2026-09-12)

**Yes — person-to-person navigation on Google Maps using live shared locations is the MVP approach**, as long as we treat it as:

1. **Supabase** = live lat/lng stream (presence)  
2. **Google Maps JS** = map + markers + optional outdoor walking route to the *moving* target  
3. **Finder UX** = distance / bearing / warmer-colder (especially when GPS is indoor-noisy)

Not in MVP: Google multi-floor indoor corridor routing for arbitrary venues (see §5–8 above). Tracked as locked **S3** in [stack.md](stack.md).

---

## Sources (primary)

- [Google Maps JavaScript API — Ground Overlays](https://developers.google.com/maps/documentation/javascript/examples/groundoverlay-simple)
- [Maps JavaScript API — Route / computeRoutes overview](https://developers.google.com/maps/documentation/javascript/routes/route-class-overview)
- [Navigation SDK overview (Android)](https://developers.google.com/maps/documentation/navigation/android-sdk/overview) — mobile turn-by-turn, not web
- [Google Indoor Maps partner / FAQs](https://maps.google.com/help/maps/indoormaps/faqs.html)
- [Indoor maps availability](https://support.google.com/maps/answer/1685827)
- [Maps SDK for Android — indoor configuration](https://developers.google.com/maps/documentation/android-sdk/configure-map)
- Third-party indoor on Google basemap examples: [MapsIndoors directions](https://docs.mapsindoors.com/sdks-and-frameworks/web/directions-and-routing/directions-service.md)
