/**
 * data.js
 * Datahantering, inläsning och flerdimensionellt filtersystem.
 * Inkluderar inbäddad fallback för säker drift offline och under file:// protokoll.
 */

const AppData = {
  events: [],
  archive: [],
  sources: [],
  sourceCategories: [],
  statistics: {},
  analyses: [],
  casualties: null,
  lastUpdated: null,
  updateFrequencyHours: 0.5,
  isLoaded: false,

  async init() {
    try {
      // Försök ladda via fetch från data-katalogen
      const [resEvents, resArchive, resSources, resStats, resAnalyses, resCasualties] = await Promise.all([
        fetch("data/output/events.json").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("data/output/archive.json").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("data/sources.json").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("data/output/statistics.json").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("data/output/analyses.json").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("data/output/casualties.json").then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (resEvents && resEvents.events) {
        this.events = resEvents.events;
        if (resEvents.last_updated) {
          this.lastUpdated = resEvents.last_updated;
        }
        if (resEvents.update_frequency_hours !== undefined) {
          this.updateFrequencyHours = resEvents.update_frequency_hours;
        }
      }
      if (resArchive && resArchive.events) {
        this.archive = resArchive.events;
      }
      if (resSources) {
        this.sources = resSources.sources || [];
        this.sourceCategories = resSources.categories || [];
      }
      if (resStats) {
        this.statistics = resStats;
        if (!this.lastUpdated && resStats.updated_at) {
          this.lastUpdated = resStats.updated_at;
        }
      }
      if (resAnalyses && resAnalyses.analyses) {
        this.analyses = resAnalyses.analyses || [];
      }
      if (resCasualties) {
        this.casualties = resCasualties;
      }
    } catch (e) {
      console.warn("Kunde inte ladda live JSON via fetch (troligtvis file:// CORS). Använder inbyggd fallback-data.", e);
    }

    // Om datan inte kunde hämtas via nätverk, använd inbyggd grunddata
    if (!this.events.length) {
      this.loadFallbackData();
    }

    this.isLoaded = true;
    return this;
  },

  getCasualties() {
    return this.casualties;
  },

  getAllEvents() {
    return [...this.events, ...this.archive];
  },

  getActiveEvents() {
    return this.events.filter(e => !e.arkiverad);
  },

  getArchivedEvents() {
    return this.archive;
  },

  getAnalyses() {
    return this.analyses;
  },

  filterAnalyses(filters = {}) {
    let list = this.analyses || [];
    if (filters.authorType && filters.authorType !== "alla") {
      list = list.filter(a => a.author_type === filters.authorType);
    }
    if (filters.topic && filters.topic !== "alla") {
      list = list.filter(a => a.topics && a.topics.includes(filters.topic));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(a => 
        (a.title_sv || "").toLowerCase().includes(q) ||
        (a.title_en || "").toLowerCase().includes(q) ||
        (a.summary_sv || "").toLowerCase().includes(q) ||
        (a.summary_en || "").toLowerCase().includes(q) ||
        (a.author_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  },

  filter(eventsList, filters) {
    if (!eventsList) return [];

    return eventsList.filter(item => {
      // 1. Text search
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matchTitleSv = (item.title_sv || "").toLowerCase().includes(query);
        const matchTitleEn = (item.title_en || "").toLowerCase().includes(query);
        const matchSummarySv = (item.summary_sv || "").toLowerCase().includes(query);
        const matchSummaryEn = (item.summary_en || "").toLowerCase().includes(query);
        const matchLocation = (item.location_name || "").toLowerCase().includes(query);
        const matchSource = (item.kalla || "").toLowerCase().includes(query);
        const matchTags = (item.tags || []).some(t => t.toLowerCase().includes(query));

        if (!matchTitleSv && !matchTitleEn && !matchSummarySv && !matchSummaryEn && !matchLocation && !matchSource && !matchTags) {
          return false;
        }
      }

      // 2. Tidshorisont
      if (filters.tidshorisont && filters.tidshorisont !== "alla") {
        if (item.tidshorisont !== filters.tidshorisont) return false;
      }

      // 3. Geografiskt område
      if (filters.geografiskt_omrade && filters.geografiskt_omrade !== "alla") {
        if (item.geografiskt_omrade !== filters.geografiskt_omrade) return false;
      }

      // 4. Parter / Intressenter
      if (filters.part && filters.part !== "alla") {
        if (!item.parter_intressenter || !item.parter_intressenter.includes(filters.part)) return false;
      }

      // 5. Syfte
      if (filters.syfte && filters.syfte !== "alla") {
        if (!item.syfte || item.syfte.kategori !== filters.syfte) return false;
      }

      // 6. Egenskaper hos anfallsmål
      if (filters.anfallsmal && filters.anfallsmal !== "alla") {
        if (item.egenskaper_anfallsmal !== filters.anfallsmal) return false;
      }

      // 7. Vetskap & Sannolikhetsgrad
      if (filters.minSannolikhet && filters.minSannolikhet > 0) {
        const pct = item.niva_vetskap_sannolikhet ? item.niva_vetskap_sannolikhet.procent : 0;
        if (pct < filters.minSannolikhet) return false;
      }

      return true;
    });
  },

  loadFallbackData() {
    if (!this.lastUpdated) {
      this.lastUpdated = "2026-09-28T04:19:03.956722+00:00";
    }
    this.events = [
      {
        "id": "evt-2026-09-27-01",
        "date": "2026-09-27",
        "timestamp": "2026-09-27T14:15:00+02:00",
        "title_sv": "Massivt ryskt kombinerat drönarangrepp mot energiknutpunkter i Poltava och Dnipropetrovsk avvärjt till 88%",
        "title_en": "Massive Russian combined drone strike on energy hubs in Poltava and Dnipropetrovsk intercepted at 88%",
        "summary_sv": "Ukrainas flygvapen rapporterar att 72 av 82 iransktillverkade Shahed-136/Geran-drönare sköts ned under natten och morgonen. Huvudmålet var regionala ställverk och transformatorstationer inför vintersäsongen. Skador på ett lokalt ställverk i Poltava orsakade tillfälliga strömavbrott för ca 14 000 hushåll, men inga dödsoffer har rapporterats.",
        "summary_en": "The Ukrainian Air Force reports that 72 out of 82 Iranian-designed Shahed-136/Geran drones were brought down overnight and this morning. Primary targets were regional transmission stations and substations ahead of the winter season. Local substation damage in Poltava caused rolling blackouts for ~14,000 households, with zero casualties confirmed.",
        "location_name": "Poltava & Dnipropetrovsk",
        "tidshorisont": "dagligen",
        "geografiskt_omrade": "fria_ukraina",
        "parter_intressenter": ["ukraina", "ryssland"],
        "syfte": {
          "kategori": "strategiskt_mal",
          "beskrivning_sv": "Strategiskt mål: Slå ut civil energiförsörjning och undergräva civilbefolkningens motståndskraft inför vintern.",
          "beskrivning_en": "Strategic goal: Cripple civilian energy infrastructure and degrade domestic morale ahead of winter."
        },
        "egenskaper_anfallsmal": "energiproduktion",
        "niva_vetskap_sannolikhet": {
          "procent": 100,
          "niva": "bekraftad",
          "motivering_sv": "Bekräftat av Ukrainas flygvapen, regionala räddningstjänsten DSNS med fotobevis samt oberoende nätdata.",
          "motivering_en": "Confirmed by Ukrainian Air Force operational report, DSNS emergency services photo records, and grid telemetry."
        },
        "effekt_maluppfyllnad": "delvis",
        "kalla": "Ukrainas Flygvapen & DSNS",
        "kallurl": "https://t.me/kpszsu",
        "kallkategori": "Officiell militär part",
        "arkiverad": false,
        "tags": ["Luftangrepp", "Shahed", "Energi", "Luftförsvar", "Poltava"]
      },
      {
        "id": "evt-2026-09-27-02",
        "date": "2026-09-27",
        "timestamp": "2026-09-27T12:30:00+02:00",
        "title_sv": "Ukrainska precisionsdrönare träffade oljedepå och bränslelager vid järnvägsknutpunkt i Rostov oblast",
        "title_en": "Ukrainian precision drones strike oil depot and fuel stockpile at rail junction in Rostov Oblast",
        "summary_sv": "Satellitbilder från NASA FIRMS och geolokaliserade videor visar kraftiga bränder vid en oljedepå i Rostov oblast, som försörjer ryska sydliga armégruppen med drivmedel längs järnvägssträckan mot Donetskområdet. Ukrainas försvarsunderrättelsetjänst (GUR) bekräftar operationen.",
        "summary_en": "NASA FIRMS thermal anomalies and geolocated video show extensive fires at a petroleum terminal in Rostov Oblast serving the Russian Southern Group of Forces supplying the Donetsk sector. Ukrainian Defence Intelligence (GUR) confirmed the targeted long-range strike.",
        "location_name": "Rostov Oblast (Ryssland)",
        "tidshorisont": "dagligen",
        "geografiskt_omrade": "ryssland",
        "parter_intressenter": ["ukraina", "ryssland"],
        "syfte": {
          "kategori": "operationellt_mal",
          "beskrivning_sv": "Operationellt mål: Strypa bränslelogistiken för ryska mekaniserade enheter och tvinga ryska armén att sprida ut sina depåer.",
          "beskrivning_en": "Operational goal: Sever fuel supply lines for mechanized units and force Russian logistics to disperse storage depots further behind the frontlines."
        },
        "egenskaper_anfallsmal": "krigsmaterielproduktion",
        "niva_vetskap_sannolikhet": {
          "procent": 100,
          "niva": "bekraftad",
          "motivering_sv": "Bekräftat genom geolokaliserad video från ryska lokala kanaler, NASA FIRMS värmeanomalier samt officiellt GUR-uttalande.",
          "motivering_en": "Confirmed via geolocated civilian videos in Rostov, NASA FIRMS heat signatures, and official Ukrainian GUR operational statement."
        },
        "effekt_maluppfyllnad": "fullbordad",
        "kalla": "GUR & GeoConfirmed",
        "kallurl": "https://geoconfirmed.org",
        "kallkategori": "OSINT & Underrättelse",
        "arkiverad": false,
        "tags": ["Drönarangrepp", "Logistik", "Rostov", "GUR", "Bränsledepå"]
      },
      {
        "id": "evt-2026-09-27-03",
        "date": "2026-09-27",
        "timestamp": "2026-09-27T10:45:00+02:00",
        "title_sv": "Intensiva ryska infanteristormningar avvärjda vid Pokrovsk – Ukrainska 47:e brigaden stabiliserar flanken",
        "title_en": "Intense Russian infantry assaults repelled near Pokrovsk – Ukrainian 47th brigade stabilizes flank",
        "summary_sv": "Enligt DeepState och Generalstabens morgonrapport genomförde ryska styrkor över 34 separata stormningsförsök under det senaste dygnet sydost om Pokrovsk. Ukrainska FPV-drönare och artillerield slog ut 12 bepansrade stridsfordon och tvingade anfallande förband att retirera från en framskjuten skogsdunge.",
        "summary_en": "According to DeepState and the Ukrainian General Staff morning report, Russian forces launched over 34 separate assault attempts in the past 24 hours southeast of Pokrovsk. Ukrainian FPV drone operators and coordinated artillery knocked out 12 armored combat vehicles, repelling the advance.",
        "location_name": "Pokrovsk-sektorn (Donetsk)",
        "tidshorisont": "dagligen",
        "geografiskt_omrade": "fria_ukraina",
        "parter_intressenter": ["ukraina", "ryssland"],
        "syfte": {
          "kategori": "taktiskt_mal",
          "beskrivning_sv": "Taktiskt mål: Rysk strävan att nå logistikvägen T0504 och skära av försörjningslinjerna till Pokrovsk.",
          "beskrivning_en": "Tactical goal: Russian effort to sever highway T0504 and interdict logistics hubs supporting the Pokrovsk pocket."
        },
        "egenskaper_anfallsmal": "militara_resurser",
        "niva_vetskap_sannolikhet": {
          "procent": 85,
          "niva": "hog",
          "motivering_sv": "Hög sannolikhet: Geoverifierade drönarfilmer från 47:e mekaniserade brigaden och samstämmiga rapporter i DeepStateMap.",
          "motivering_en": "High confidence: Geolocated combat footage from the 47th Mechanized Brigade corroborated by DeepStateMap updates."
        },
        "effekt_maluppfyllnad": "avvardad",
        "kalla": "Ukrainas Generalstab & DeepStateMap",
        "kallurl": "https://deepstatemap.live",
        "kallkategori": "OSINT & Officiell rapport",
        "arkiverad": false,
        "tags": ["Pokrovsk", "Markstrid", "FPV-drönare", "Donetsk", "DeepState"]
      },
      {
        "id": "evt-2026-09-27-04",
        "date": "2026-09-27",
        "timestamp": "2026-09-27T09:00:00+02:00",
        "title_sv": "Rysk glidbombsattack mot bostadskvarter och vårdcentral i Charkiv – 16 civila skadade",
        "title_en": "Russian glide bomb strike hits residential apartment block and health clinic in Kharkiv – 16 civilians injured",
        "summary_sv": "Ryska flygvapnet fällde tre UMPK-glidbomber (FAB-500) från belgorodskt luftrum mot de norra stadsdelarna i Charkiv. En bomb träffade direkt invid ett 9-vånings bostadshus och skadade en närliggande vårdcentral. Bland de 16 skadade finns tre barn. Inga militära mål fanns inom 2 kilometers radie.",
        "summary_en": "Russian aircraft released three UMPK guided glide bombs (FAB-500) from Belgorod airspace into northern residential quarters of Kharkiv. One bomb impacted immediately adjacent to a 9-story apartment complex and municipal clinic. Sixteen civilians, including three children, sustained injuries. No military facilities exist within 2 km.",
        "location_name": "Charkiv",
        "tidshorisont": "dagligen",
        "geografiskt_omrade": "fria_ukraina",
        "parter_intressenter": ["ryssland", "ukraina"],
        "syfte": {
          "kategori": "akta_syfte",
          "beskrivning_sv": "Äkta syfte: Terrorbombning och psykologisk krigföring i syfte att göra Ukrainas näst största stad obeboelig och framkalla flyktingvågor.",
          "beskrivning_en": "Underlying purpose: Terror bombing and psychological attrition aimed at depopulating Ukraine's second largest city and spurring migration."
        },
        "egenskaper_anfallsmal": "helt_civila",
        "niva_vetskap_sannolikhet": {
          "procent": 100,
          "niva": "bekraftad",
          "motivering_sv": "Verifierad: Borgmästare Ihor Terechov, Charkivs åklagarmyndighet och internationella journalister på plats med fotodokumentation.",
          "motivering_en": "Verified: Mayor Ihor Terekhov, Kharkiv regional prosecutor, and international photojournalists on site."
        },
        "effekt_maluppfyllnad": "fullbordad",
        "kalla": "Charkivs Åklagarmyndighet & Suspilne",
        "kallurl": "https://suspilne.media",
        "kallkategori": "Officiell civil part & Public Service",
        "arkiverad": false,
        "tags": ["Civila mål", "Glidbomb", "Krigsbrott", "Charkiv", "FAB-500"]
      },
      {
        "id": "evt-2026-09-27-05",
        "date": "2026-09-27",
        "timestamp": "2026-09-27T07:45:00+02:00",
        "title_sv": "EU och Storbritannien godkänner nytt stödpaket på 3,5 miljarder euro finansierat av frysta ryska tillgångar",
        "title_en": "EU and UK approve €3.5 billion tranche backed by frozen Russian sovereign assets",
        "summary_sv": "EU-kommissionen och brittiska finansdepartementet formaliserade det första låneutbetalningssteget från G7:s initiativ kopplat till räntor på ryska centralbankens frysta tillgångar. Medlen öronmärks direkt till inköp av ukrainsktillverkad artilleriammunition och reparationsmateriel för kraftnätet.",
        "summary_en": "The European Commission and HM Treasury finalized terms for a €3.5 billion financing tranche derived from the windfall profits of immobilized Russian Central Bank assets under the G7 framework. Funds are earmarked for direct procurement of Ukrainian-manufactured artillery shells and power grid repair hardware.",
        "location_name": "Bryssel & London",
        "tidshorisont": "dagligen",
        "geografiskt_omrade": "eu_ees",
        "parter_intressenter": ["eu", "uk", "ukraina", "ryssland"],
        "syfte": {
          "kategori": "strategiskt_mal",
          "beskrivning_sv": "Strategiskt mål: Etablera en långsiktigt hållbar finansieringsmekanism för Ukrainas försvarsindustri som belastar ryska staten ekonomiskt.",
          "beskrivning_en": "Strategic goal: Institutionalize sustainable defense financing for Ukraine's domestic weapons production financed directly by Russian state assets."
        },
        "egenskaper_anfallsmal": "diplomatiskt_politiskt",
        "niva_vetskap_sannolikhet": {
          "procent": 100,
          "niva": "bekraftad",
          "motivering_sv": "Bekräftad: Officiellt pressmeddelande från Europeiska kommissionen och brittiska regeringen.",
          "motivering_en": "Confirmed: Official joint communique from the European Commission and UK Government."
        },
        "effekt_maluppfyllnad": "fullbordad",
        "kalla": "EU-kommissionen & UK Gov",
        "kallurl": "https://ec.europa.eu",
        "kallkategori": "Officiell allierad institution",
        "arkiverad": false,
        "tags": ["Bistånd", "Frysta tillgångar", "EU", "Storbritannien", "Ekonomi"]
      },
      {
        "id": "evt-2026-09-27-06",
        "date": "2026-09-27",
        "timestamp": "2026-09-27T06:15:00+02:00",
        "title_sv": "Svarta havets exportkorridor slog nytt månadsskeppningsrekord – 6,2 miljoner ton spannmål och gods",
        "title_en": "Black Sea maritime corridor reaches record 6.2 million metric tons shipped despite Russian blockade threats",
        "summary_sv": "Ukrainas infrastrukturdepartement meddelar att den autonoma ukrainska sjökorridoren genom västra Svarta havet under senaste 30-dagarsperioden transporterat 6,2 miljoner ton jordbruksprodukter och metaller. Ryska flottan hålls effektivt borta från västra Svarta havet tack vare ukrainska sjödrönare (Magura V5) och sjömålsrobotar (Neptune).",
        "summary_en": "Ukraine's Ministry for Restoration reports that the unilateral maritime corridor through the western Black Sea achieved a monthly throughput of 6.2 million tons of agricultural and industrial goods. The Russian Black Sea Fleet remains effectively quarantined from western waters due to Ukrainian naval drone operations (Magura V5) and shore-based Neptune anti-ship systems.",
        "location_name": "Odessa & Svarta havet",
        "tidshorisont": "dagligen",
        "geografiskt_omrade": "ukrainas_granser",
        "parter_intressenter": ["ukraina", "ovriga_varlden", "ryssland"],
        "syfte": {
          "kategori": "resultatmal",
          "beskrivning_sv": "Resultatmål: Upprätthålla Ukrainas kommersiella livsnerv och exportintäkter oberoende av ryska avtal.",
          "beskrivning_en": "Outcome goal: Preserve Ukraine's commercial maritime artery and export revenue streams independent of Russian veto or extortion."
        },
        "egenskaper_anfallsmal": "civil_infrastruktur",
        "niva_vetskap_sannolikhet": {
          "procent": 100,
          "niva": "bekraftad",
          "motivering_sv": "Bekräftad genom AIS-fartygsspårning, hamnloggar i Odesa samt internationella sjöförsäkringsdata.",
          "motivering_en": "Confirmed by commercial AIS vessel telemetry, Odesa port manifests, and Lloyd's maritime underwriting registries."
        },
        "effekt_maluppfyllnad": "fullbordad",
        "kalla": "Infrastrukturministeriet & Lloyd's List",
        "kallurl": "https://mtu.gov.ua",
        "kallkategori": "Officiell myndighet & Sjöfartsdata",
        "arkiverad": false,
        "tags": ["Svarta havet", "Spannmål", "Odesa", "Sjödrönare", "Ekonomi"]
      }
    ];

    this.archive = [
      {
        "id": "evt-2026-09-26-01",
        "date": "2026-09-26",
        "timestamp": "2026-09-26T18:20:00+02:00",
        "title_sv": "Ukrainska långdistansdrönare slog ut stor ammunitionsdepå i Toropets (Tver oblast)",
        "title_en": "Ukrainian deep strike demolishes major 107th GRAU munitions arsenal in Toropets",
        "summary_sv": "Ukrainas säkerhetstjänst (SBU) och GUR genomförde ett samordnat angrepp med över 100 ukrainsktillverkade attackdrönare mot den 107:e GRAU-huvudarsenalen i Toropets. Sekundärexplosionerna registrerades som seismiska skakningar med magnitud 2,8 och orsakade en massiv detonation av robotar av typen Iskander, Totjka-U och nordkoreanska KN-23.",
        "summary_en": "Coordinated strikes by the SBU and Ukrainian GUR using over 100 domestic long-range drones struck Russia's 107th GRAU arsenal in Toropets. Secondary detonations registered as a magnitude 2.8 earthquake, obliterating significant stockpiles of Iskander ballistic missiles, Tochka-U systems, and North Korean KN-23 munitions.",
        "location_name": "Toropets (Tver oblast, Ryssland)",
        "tidshorisont": "veckovis",
        "geografiskt_omrade": "ryssland",
        "parter_intressenter": ["ukraina", "ryssland"],
        "syfte": {
          "kategori": "effektmal",
          "beskrivning_sv": "Effektmål: Radikalt minska tillgången på ballistiska robotar och artillerigranater vid de aktiva frontavsnitten.",
          "beskrivning_en": "Effect goal: Drastically degrade operational availability of ballistic missiles and heavy artillery rounds along eastern fronts."
        },
        "egenskaper_anfallsmal": "krigsmaterielproduktion",
        "niva_vetskap_sannolikhet": {
          "procent": 100,
          "niva": "bekraftad",
          "motivering_sv": "100% Verifierad: Maxar-satellitbilder, seismiska mätningar från NORSAR och geolokaliserade videor på explosionerna.",
          "motivering_en": "100% Confirmed: High-resolution Maxar satellite imagery, NORSAR seismic tracking, and geolocated video footage."
        },
        "effekt_maluppfyllnad": "fullbordad",
        "kalla": "Maxar Technologies & ISW",
        "kallurl": "https://understandingwar.org",
        "kallkategori": "Satellit & Underrättelse",
        "arkiverad": true,
        "tags": ["Arsenal", "GRAU", "Toropets", "SBU", "GUR"]
      },
      {
        "id": "evt-2026-09-25-01",
        "date": "2026-09-25",
        "timestamp": "2026-09-25T15:40:00+02:00",
        "title_sv": "Ryskt missilangrepp mot civil stormarknad och bageri i Kostiantynivka – 14 döda",
        "title_en": "Russian missile strike on civilian supermarket and bakery in Kostiantynivka – 14 dead",
        "summary_sv": "En rysk Kh-38-missil träffade en fullsatt stormarknad mitt på dagen i Kostiantynivka, Donetsk oblast. Byggnaden totalförstördes och 14 civila dödades, varav två barn, medan 44 skadades. Det fanns inga militära mål i kvarteret.",
        "summary_en": "A Russian air-to-surface Kh-38 missile struck a bustling supermarket and adjoining bakery in central Kostiantynivka, Donetsk Oblast. Fourteen civilians including two children were killed and 44 injured. The target was strictly commercial and civilian.",
        "location_name": "Kostiantynivka (Donetsk)",
        "tidshorisont": "veckovis",
        "geografiskt_omrade": "fria_ukraina",
        "parter_intressenter": ["ryssland", "ukraina"],
        "syfte": {
          "kategori": "akta_syfte",
          "beskrivning_sv": "Äkta syfte: Skrämma bort befolkningen från frontnära städer och skapa kaos i civil logistik.",
          "beskrivning_en": "Underlying purpose: Demoralize and depopulate frontline support communities, dismantling local food supply chains."
        },
        "egenskaper_anfallsmal": "helt_civila",
        "niva_vetskap_sannolikhet": {
          "procent": 100,
          "niva": "bekraftad",
          "motivering_sv": "100% Verifierad: Räddningsarbetet dokumenterat av FN:s människorättskontor (OHCHR) och internationell press på plats.",
          "motivering_en": "100% Confirmed: Rescue operations documented by UN OHCHR monitors and international photojournalists."
        },
        "effekt_maluppfyllnad": "fullbordad",
        "kalla": "FN OHCHR & Kyiv Independent",
        "kallurl": "https://kyivindependent.com",
        "kallkategori": "FN-organ & Oberoende media",
        "arkiverad": true,
        "tags": ["Krigsbrott", "Civila offer", "Donetsk", "FN", "OHCHR"]
      },
      {
        "id": "evt-2026-09-20-01",
        "date": "2026-09-20",
        "timestamp": "2026-09-20T17:00:00+02:00",
        "title_sv": "Ukrainskt robotanfall mot ryska S-400 Triumf-luftvärnsställningar på ockuperade Krym",
        "title_en": "Ukrainian ATACMS strike destroys Russian S-400 Triumf air defense complex in occupied Crimea",
        "summary_sv": "Geolokaliserade satellitbilder bekräftar att ett ukrainskt anfall med ATACMS-robotar slog ut en 92N6E-radar och minst två avfyrningsramper tillhörande ett modernt S-400-batteri nära Sevastopol.",
        "summary_en": "Geolocated satellite imagery verifies that a coordinated Ukrainian ATACMS strike knocked out a 92N6E target acquisition radar and at least two launcher vehicles of an S-400 complex near Sevastopol.",
        "location_name": "Sevastopol (Ockuperade Krym)",
        "tidshorisont": "manadsvis",
        "geografiskt_omrade": "ockuperade_ukraina",
        "parter_intressenter": ["ukraina", "ryssland"],
        "syfte": {
          "kategori": "operationellt_mal",
          "beskrivning_sv": "Operationellt mål: Slå hål i den ryska luftförsvarsbubblan över Krym för att möjliggöra djupangrepp mot logistik.",
          "beskrivning_en": "Operational goal: Degrade Russian integrated air defense coverage over the Crimean peninsula, clearing flight avenues for drone salvos."
        },
        "egenskaper_anfallsmal": "militara_resurser",
        "niva_vetskap_sannolikhet": {
          "procent": 100,
          "niva": "bekraftad",
          "motivering_sv": "100% Verifierad: Planet Labs satellitbilder analyserade av Radio Free Europe och GeoConfirmed.",
          "motivering_en": "100% Verified: Planet Labs multispectral satellite before/after imagery verified by GeoConfirmed analysts."
        },
        "effekt_maluppfyllnad": "fullbordad",
        "kalla": "GeoConfirmed & Radio Free Europe",
        "kallurl": "https://geoconfirmed.org",
        "kallkategori": "OSINT & Satellitverifiering",
        "arkiverad": true,
        "tags": ["Krym", "ATACMS", "S-400", "Luftvärn", "Sevastopol"]
      },
      {
        "id": "evt-2026-09-08-01",
        "date": "2026-09-08",
        "timestamp": "2026-09-08T08:15:00+02:00",
        "title_sv": "Ukrainska operationer i Kursk oblast tvingar Ryssland att omplacera 40 000 soldater från Donbass",
        "title_en": "Ukrainian Kursk operation forces Moscow to divert 40,000 troops from eastern theaters",
        "summary_sv": "General Oleksandr Syrskyj och ISW rapporterar att den ukrainska buffertzonen i Kursk oblast framgångsrikt har dragit ryska elitreserver (marininfanteri och VDV) bort från offensiverna mot Toretsk och Kupiansk.",
        "summary_en": "Commander-in-Chief Oleksandr Syrskyi and ISW assess that the Ukrainian operational buffer zone in Kursk Oblast has diverted approximately 40,000 Russian troops away from Toretsk and Kupiansk axes.",
        "location_name": "Kursk Oblast (Ryssland)",
        "tidshorisont": "manadsvis",
        "geografiskt_omrade": "ryssland",
        "parter_intressenter": ["ukraina", "ryssland"],
        "syfte": {
          "kategori": "operationellt_mal",
          "beskrivning_sv": "Operationellt mål: Tvinga rysk militärledning att föra kriget på eget territorium och avlasta försvarslinjer i öster.",
          "beskrivning_en": "Operational goal: Impose dilemmas on Russian command by forcing combat onto Russian soil, thereby diluting mechanized thrusts in the Donbas."
        },
        "egenskaper_anfallsmal": "militara_resurser",
        "niva_vetskap_sannolikhet": {
          "procent": 100,
          "niva": "bekraftad",
          "motivering_sv": "Verifierad: Geoverifierade ryska och ukrainska stridsvideor och ISW:s kontinuerliga rapportering.",
          "motivering_en": "Verified: Cross-referenced geolocated combat video, satellite ground truth, and comprehensive ISW campaign tracking."
        },
        "effekt_maluppfyllnad": "delvis",
        "kalla": "ISW & DeepStateMap",
        "kallurl": "https://understandingwar.org",
        "kallkategori": "Militär analys",
        "arkiverad": true,
        "tags": ["Kursk", "Syrskyj", "Manöverkrig", "Buffertzon", "ISW"]
      }
    ];

    this.sources = [
      {
        "id": "general-staff-ua",
        "name": "Ukrainas Generalstab (General Staff of AFU)",
        "category": "official_ua",
        "tier": "Primärkälla",
        "url": "https://www.facebook.com/GeneralStaff.ua",
        "credibility": "Hög (Operativ militär part)",
        "description_sv": "Dagliga morgon- och kvällsuppdateringar om frontlinjen och ryska materielförluster.",
        "description_en": "Daily operational briefings on frontline engagements and equipment attrition."
      },
      {
        "id": "isw",
        "name": "Institute for the Study of War (ISW)",
        "category": "intelligence",
        "tier": "Sekundärkälla / Analys",
        "url": "https://understandingwar.org",
        "credibility": "Mycket hög (Forskningsinstitut)",
        "description_sv": "Världsledande dagliga lägesrapporter med noggrann geolokalisering av frontsektorer.",
        "description_en": "World-leading daily operational assessments with geolocated frontline mapping."
      },
      {
        "id": "deepstate",
        "name": "DeepStateMap",
        "category": "osint",
        "tier": "Primärkälla / OSINT",
        "url": "https://deepstatemap.live",
        "credibility": "Mycket hög (Strikt verifiering)",
        "description_sv": "Realtidskarta över frontlinjen, framryckningar och befriade områden.",
        "description_en": "Authoritative open-source frontline map documenting territorial control."
      },
      {
        "id": "kyiv-independent",
        "name": "The Kyiv Independent",
        "category": "independent_media",
        "tier": "Oberoende nyhetsmedium",
        "url": "https://kyivindependent.com",
        "credibility": "Hög (Oberoende granskning)",
        "description_sv": "Ukrainas främsta oberoende engelskspråkiga redaktion med djupgående journalistik.",
        "description_en": "Leading independent Ukrainian media outlet delivering 24/7 on-the-ground reporting."
      },
      {
        "id": "svt-ukraina",
        "name": "SVT Nyheter – Ukrainakriget",
        "category": "independent_media",
        "tier": "Svensk Public Service",
        "url": "https://www.svt.se/nyheter/om/ukraina",
        "credibility": "Mycket hög (Svensk public service)",
        "description_sv": "Svensk bevakning med fokus på konsekvenser för Sverige och säkerhetsläget i närområdet.",
        "description_en": "Swedish public broadcaster providing Nordic-focused analysis and verified war reports."
      }
    ];

    this.sourceCategories = [
      { "id": "official_ua", "name_sv": "Officiella ukrainska myndigheter", "name_en": "Official Ukrainian authorities" },
      { "id": "intelligence", "name_sv": "Militära underrättelsetjänster och analysinstitut", "name_en": "Military intelligence and think tanks" },
      { "id": "osint", "name_sv": "OSINT och geolokalisering", "name_en": "OSINT and geolocation" },
      { "id": "independent_media", "name_sv": "Oberoende nyhetsmedier och journalistik", "name_en": "Independent media and journalism" }
    ];

    this.statistics = {
      "daily_metrics": {
        "shahed_interception_rate_percent": 87.8,
        "frontline_skirmishes_24h": 164
      }
    };

    this.analyses = [
      {
        "id": "ana-cornucopia-fallback",
        "author_id": "wilderang",
        "author_name": "Lars Wilderäng",
        "author_title_sv": "Författare och försvarsdebattör (Cornucopia.se)",
        "author_title_en": "Military author and defense commentator (Cornucopia.se)",
        "author_type": "svensk_expert",
        "platform": "Cornucopia.se",
        "date": "2026-09-28",
        "title_sv": "Ukraina: Vapenfabriker bombade i ryska Tula och Voronezj, attackdrönarbaser i Kaluga och två bränsledepåer i Krasnodar Kraj",
        "title_en": "Ukraine: Weapons factories bombed in Russian Tula and Voronezh, attack drone bases in Kaluga and two fuel depots in Krasnodar Krai",
        "summary_sv": "Ryssland fortsätter sina terrorbombningar mot civila mål och Nationella Vetenskapsakademin i Kyjiv. Ukraina slog samtidigt till djupt in i Rysslands krigsindustri med drönaranfall mot vapenfabrikerna i Tula och Voronezj, samt bränsledepåer i Krasnodar Kraj.",
        "summary_en": "Russia continues its terror bombings targeting civilian structures and the National Academy of Sciences in Kyiv. Ukraine simultaneously struck deep into Russian war industry facilities in Tula, Voronezh, and fuel depots in Krasnodar Krai.",
        "key_takeaways_sv": [
          "Ukraina genomförde samordnade drönaranfall mot vapenfabriker i Tula och Voronezj.",
          "Två bränsledepåer i Krasnodar Kraj sattes i brand och tvingade fram lokal evakuering.",
          "Ryska anfall fortsätter att rikta in sig på civil och akademisk infrastruktur i Kyjiv."
        ],
        "key_takeaways_en": [
          "Ukraine executed coordinated drone strikes on weapons manufacturing plants in Tula and Voronezh.",
          "Two fuel depots in Krasnodar Krai were set ablaze, forcing localized evacuations.",
          "Russian strikes continue to hit civilian and academic infrastructure in Kyiv."
        ],
        "topics": ["luftkrig", "djupanfall", "frontlinje", "vapenindustri"],
        "url": "https://cornucopia.se",
        "verified_credibility": "Hög (öppna källor, geolokalisering och daglig operativ bevakning)"
      },
      {
        "id": "ana-johanno1-fallback",
        "author_id": "johanno1",
        "author_name": "Johan No.1",
        "author_title_sv": "Strategisk och militär analytiker (Substack)",
        "author_title_en": "Strategic and military analyst (Substack)",
        "author_type": "svensk_expert",
        "platform": "Substack",
        "date": "2026-09-24",
        "title_sv": "Vägen till eskalering, 24 September 2026",
        "title_en": "The Road to Escalation, 24th September 2026",
        "summary_sv": "Ukrainska 3:e stormbrigaden experimenterar framgångsrikt med markbunden elektronisk krigföring (EW) för att slå ut ryska FPV-drönare och släpper autonoma markrobotar bakom ryssarnas linjer i kombination med SOF på djupet.",
        "summary_en": "The Ukrainian 3rd Assault Brigade is experimenting successfully with ground-based electronic warfare (EW) to counter Russian FPV drones, deploying autonomous ground robots behind lines combined with deep SOF operations.",
        "key_takeaways_sv": [
          "3rd Assault Corps experimenterar med integrerad EW för att uppnå lokalt drönarövertag.",
          "Autonoma markrobotar sätts in bakom fiendens linjer före mekaniserade anfall.",
          "Ukrainska taktiska anpassningar överträffar i nuläget ryska motåtgärder."
        ],
        "key_takeaways_en": [
          "3rd Assault Corps experiments with integrated EW to secure local drone dominance.",
          "Autonomous ground robots deployed behind enemy lines ahead of mechanized thrusts.",
          "Ukrainian tactical adaptations currently outpace Russian counter-adjustments."
        ],
        "topics": ["strategi", "eskalering", "droner", "doktrin"],
        "url": "https://johanno1.substack.com",
        "verified_credibility": "Hög (djupgående taktisk och doktrinär analys)"
      },
      {
        "id": "ana-mickryan-fallback",
        "author_id": "mickryan",
        "author_name": "Mick Ryan",
        "author_title_sv": "Generalmajor (f.d.), militärstrateg och författare",
        "author_title_en": "Major General (Retd), military strategist and author",
        "author_type": "internationell_expert",
        "platform": "Futura Doctrina / Substack",
        "date": "2026-09-27",
        "title_sv": "Robotic air assaults när Vivaldi rullar framåt",
        "title_en": "Robotic Air Assaults as Vivaldi Rolls Forward",
        "summary_sv": "Autonoma och semi-autonoma drönarangrepp i luften omdefinierar modern luftburen manöver. Ukraina integrerar svärmdrönare med mekaniserade markstyrkor på ett sätt som västerländska försvarsmakter nu studerar intensivt.",
        "summary_en": "Autonomous and semi-autonomous airborne drone strikes are redefining aerial maneuver warfare. Ukraine integrates swarm UAVs with mechanized ground formations, providing lessons closely studied by Western militaries.",
        "key_takeaways_sv": [
          "Drönarsvärmar fungerar nu som luftburet understöd för att öppna genombrott i befästa linjer.",
          "Rysslands strategiska motstånd bygger på långsam politisk utmattning snarare än militär dynamik.",
          "Teknisk anpassningshastighet är den avgörande framgångsfaktorn på det moderna slagfältet."
        ],
        "key_takeaways_en": [
          "Drone swarms now act as aerial breakthrough assets for fortified defensive lines.",
          "Russian strategic endurance relies on political attrition rather than military dynamism.",
          "Cycle speed of technological adaptation remains the decisive operational factor."
        ],
        "topics": ["robotik", "autonoma_system", "doktrin", "militärstrategi"],
        "url": "https://mickryan.substack.com",
        "verified_credibility": "Mycket hög (tidigare general och militärdoktrinforskare)"
      },
      {
        "id": "ana-obrien-fallback",
        "author_id": "obrien",
        "author_name": "Phillips P. O'Brien",
        "author_title_sv": "Professor i strategiska studier vid University of St Andrews",
        "author_title_en": "Professor of Strategic Studies at University of St Andrews",
        "author_type": "internationell_expert",
        "platform": "Substack",
        "date": "2026-09-27",
        "title_sv": "En armé av robotar och luftkriget på djupet",
        "title_en": "An Army Of Robots and the Deep Air Campaign",
        "summary_sv": "Krigets utgång avgörs inte enbart vid skyttegravarna i Donbas utan av den industriella förmågan att slå ut fiendens raffinaderier, logistikcentraler och ammunitionslager 500 till 1 200 km bakom frontlinjen.",
        "summary_en": "The war's outcome is decided not solely in Donbas trenches, but by the industrial capacity to neutralize adversary refineries, logistical nodes, and ammunition depots 500 to 1,200 km behind the frontlines.",
        "key_takeaways_sv": [
          "Ukrainas systematiska anfall mot ryska oljeraffinaderier har tvingat Moskva till bränsleexportstopp.",
          "GRAU-arsenalernas förstörelse sänker Rysslands eldhastighet längs hela fronten.",
          "Luftkriget på djupet är Ukrainas primära hävstång för att tvinga fram rysk utmattning."
        ],
        "key_takeaways_en": [
          "Systematic strikes on Russian oil refineries forced Moscow into domestic fuel export restrictions.",
          "Destruction of GRAU arsenals diminishes Russian artillery fire rates across the entire front.",
          "The deep air war is Ukraine's primary lever to impose strategic attrition on Russia."
        ],
        "topics": ["luftkrig", "utmattningskrig", "logistik", "strategi"],
        "url": "https://phillipspobrien.substack.com",
        "verified_credibility": "Mycket hög (ledande akademisk expert på luftmakt och logistik)"
      },
      {
        "id": "ana-tatarigami-fallback",
        "author_id": "tatarigami",
        "author_name": "Tatarigami_UA (Frontelligence Insight)",
        "author_title_sv": "Ukrainsk reservofficer, grundare av Frontelligence Insight",
        "author_title_en": "Ukrainian reserve officer, founder of Frontelligence Insight",
        "author_type": "osint_analytiker",
        "platform": "Frontelligence Insight",
        "date": "2026-09-25",
        "title_sv": "Satellitgranskning av ryska GRAU-arsenaler efter ukrainska djupanfall",
        "title_en": "Satellite Investigation of Russian GRAU Arsenals Following Deep Strikes",
        "summary_sv": "Analys av kommersiella högupplösta satellitbilder över Toropets (107:e GRAU) och Karatsjev (67:e GRAU) bekräftar totalförstörelse av dussintals missilbunkrar och bevisar att ryska jordvallar inte skyddar mot vertikala drönaranfall.",
        "summary_en": "Commercial high-resolution satellite analysis of Toropets (107th GRAU) and Karachev (67th GRAU) confirms total destruction of dozens of missile revetments, proving Russian earthen berms fail against vertical UAV attacks.",
        "key_takeaways_sv": [
          "Över 60 bunkrar och öppna ammunitionsupplag i Toropets brändes ned till grunden.",
          "Sekundära detonationer slog ut brandbilar och järnvägsspår för vidare transport.",
          "Rysslands ammunitionslogistik måste nu flyttas 500+ km bakåt, vilket skapar akuta transportflaskhalsar."
        ],
        "key_takeaways_en": [
          "Over 60 hardened bunkers and open storage pads in Toropets burned to the ground.",
          "Secondary blasts destroyed specialized firefighting vehicles and connecting rail lines.",
          "Russian ammunition supply chains must now relocate 500+ km deeper, creating acute transport bottlenecks."
        ],
        "topics": ["satellitanalys", "ammunition", "logistik", "depaer"],
        "url": "https://frontelligence.substack.com",
        "verified_credibility": "Högsta OSINT-klass (satellitbildsverifiering av GRAU-arsenaler och logistik)"
      }
    ];

    if (!this.casualties) {
      this.casualties = {
        "date": "2026-09-30",
        "last_updated": "2026-09-30T11:16:33.872501+00:00",
        "source": {
          "name": "Minfin – Russian Casualties Index",
          "url": "https://index.minfin.com.ua/en/russian-invading/casualties/",
          "origin": "Ukrainas Generalstab (Armed Forces of Ukraine / RNBO)",
          "credibility": "Officiell militär operativ uppskattning"
        },
        "methodology_note_sv": "Uppgifterna baseras på Ukrainas Generalstabs officiella dygnsrapporter och sammanställs av Minfin. Siffrorna återspeglar den ukrainska militärens operativa uppskattningar. Som komplement redovisas oberoende fotoverifierade minimiförluster via Oryx under Metod.",
        "methodology_note_en": "Data sourced from official daily reports of the General Staff of the Armed Forces of Ukraine, aggregated by Minfin. These represent Ukrainian military operational estimates. For comparison, conservative photo-verified equipment losses from Oryx are documented under Methodology.",
        "summary": {
          "daily_personnel": 1470,
          "daily_artillery": 21,
          "daily_drones": 1393,
          "daily_equipment_total": 1763,
          "total_personnel": 1533970
        },
        "categories": [
          { "key": "personnel", "name_sv": "Personal (stupade och allvarligt sårade)", "name_en": "Military personnel (killed / wounded)", "total": 1533970, "daily": 1470, "unit_sv": "man", "unit_en": "troops", "icon": "🪖", "highlight": true },
          { "key": "artillery", "name_sv": "Artillerisystem", "name_en": "Artillery systems", "total": 50519, "daily": 21, "unit_sv": "st", "unit_en": "units", "icon": "💥", "highlight": true },
          { "key": "uav", "name_sv": "Drönare (UAV)", "name_en": "UAVs / Drones", "total": 540095, "daily": 1393, "unit_sv": "st", "unit_en": "units", "icon": "🛸", "highlight": true },
          { "key": "vehicles", "name_sv": "Transport- och tankfordon", "name_en": "Cars and fuel cisterns", "total": 155363, "daily": 332, "unit_sv": "st", "unit_en": "units", "icon": "🚛", "highlight": true },
          { "key": "tanks", "name_sv": "Stridsvagnar", "name_en": "Tanks", "total": 11634, "daily": 0, "unit_sv": "st", "unit_en": "units", "icon": "🛡️", "highlight": false },
          { "key": "afv", "name_sv": "Pansarskytte- och stridsfordon", "name_en": "Armored fighting vehicles", "total": 23992, "daily": 0, "unit_sv": "st", "unit_en": "units", "icon": "🚜", "highlight": false },
          { "key": "mlrs", "name_sv": "Raketartilleri (MLRS)", "name_en": "Multiple launch rocket systems", "total": 1550, "daily": 0, "unit_sv": "st", "unit_en": "units", "icon": "🚀", "highlight": false },
          { "key": "anti_air", "name_sv": "Luftvärnssystem", "name_en": "Anti-aircraft warfare", "total": 1262, "daily": 1, "unit_sv": "st", "unit_en": "units", "icon": "📡", "highlight": false },
          { "key": "special_equipment", "name_sv": "Special- och ingenjörsfordon", "name_en": "Special equipment", "total": 4512, "daily": 16, "unit_sv": "st", "unit_en": "units", "icon": "🛠️", "highlight": false },
          { "key": "cruise_missiles", "name_sv": "Kryssningsrobotar (nedskjutna)", "name_en": "Cruise missiles intercepted", "total": 4125, "daily": 0, "unit_sv": "st", "unit_en": "units", "icon": "🎯", "highlight": false },
          { "key": "ground_robots", "name_sv": "Markgående robotsystem", "name_en": "Ground robotic systems", "total": 28, "daily": 1, "unit_sv": "st", "unit_en": "units", "icon": "🤖", "highlight": false },
          { "key": "planes", "name_sv": "Flygplan", "name_en": "Planes", "total": 435, "daily": 0, "unit_sv": "st", "unit_en": "units", "icon": "✈️", "highlight": false },
          { "key": "helicopters", "name_sv": "Helikoptrar", "name_en": "Helicopters", "total": 346, "daily": 0, "unit_sv": "st", "unit_en": "units", "icon": "🚁", "highlight": false },
          { "key": "ships", "name_sv": "Krigsfartyg och båtar", "name_en": "Warships and boats", "total": 28, "daily": 0, "unit_sv": "st", "unit_en": "units", "icon": "🚢", "highlight": false },
          { "key": "submarines", "name_sv": "Ubåtar", "name_en": "Submarines", "total": 1, "daily": 0, "unit_sv": "st", "unit_en": "units", "icon": "⚓", "highlight": false }
        ]
      };
    }
  }
};
