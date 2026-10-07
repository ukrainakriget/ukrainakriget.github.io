/**
 * i18n.js
 * Tvåspråkigt språkstöd (svenska och engelska) för Ukrainakriget.
 * Växlar dynamiskt mellan språken och sparar valet i localStorage.
 */

const translations = {
  sv: {
    // Header & Meta
    siteTitle: "Ukrainakriget",
    siteSubtitle: "Oberoende underrättelse- och situationsdashboard",
    siteDescription: "En öppen, strukturerad och automatisk analysportal för händelseutvecklingen i Ukrainakriget.",
    liveStatus: "Aktuell lägesbild",
    systemLiveStatus: "Automatisk drift",
    systemDelayedStatus: "Fördröjd drift",
    lastUpdatedLabel: "Senast uppdaterad:",
    nextUpdateLabel: "Nästa uppdatering:",
    delayedRun: "Fördröjd driftkörning",
    statusTooltip: "Webbplatsen uppdateras autonomt var 30:e minut via GitHub Actions och roterar ut händelser äldre än 24 timmar till arkivet.",
    feedSyncText: "Uppdateras var 30:e minut • Nästa",
    activeEventsHeading: "Aktuella händelser (senaste dygnet)",
    activeEventsDesc: "Händelser som visats roteras automatiskt till arkivet efter 24 timmar så att dashboarden alltid visar dagens situation.",
    lastUpdated: "Senast uppdaterad:",
    hoursAgo: "timmar sedan",
    today: "Idag",
    langButton: "English",
    
    // Navigation
    navEvents: "Aktuella händelser",
    navSituation: "Lägesbild",
    navDashboard: "Aktuella händelser",
    navTimeline: "Flerdimensionellt filter",
    navArchive: "Arkiv (>24 tim)",
    navAnalyses: "Analyser och expertbedömningar",
    navSources: "Källkatalog",
    navMethodology: "Metod och struktur",

    // Lägesbild
    situationTitle: "Lägesbild",
    situationSubtitle: "Kvantitativa nyckeltal, luftförsvarseffektivitet samt taktisk och strategisk situationskarta",

    // KPI / Sammanfattning
    kpiInterception: "Luftförsvarseffektivitet",
    kpiInterceptionDesc: "Nedskjutna Shahed och kryssningsrobotar senaste dygnet",
    kpiFrontline: "Frontstrider (24 tim)",
    kpiFrontlineDesc: "Intensivast strider kring Pokrovsk och Kurachove",
    kpiCorridor: "Sjökorsväg Svarta havet",
    kpiCorridorDesc: "Månatlig export genom ukrainsk sjökorridor",
    kpiCivilianShare: "Civila anfallsmål",
    kpiCivilianShareDesc: "Andel av ryska luft- och robotangrepp mot civila mål",

    // Filter och dimensioner
    filterTitle: "Flerdimensionell klassificering",
    filterSubtitle: "Kombinera perspektiv för att analysera läget ur specifika dimensioner",
    filterSearchPlaceholder: "Sök händelser, städer, vapentyper, aktörer...",
    filterReset: "Återställ alla filter",
    filterShowing: "Visar",
    filterOf: "av",
    filterEvents: "händelser",

    // Dimensionsnamn
    dimTime: "Tidshorisonter",
    dimGeo: "Geografiska områden",
    dimActors: "Parter och intressenter",
    dimPurpose: "Syfte och målnivå",
    dimTarget: "Anfallsmålets egenskap",
    dimConfidence: "Vetskap och sannolikhet",

    // Dimensionsalternativ
    optAll: "Alla",
    timeDaily: "Dagligen (senaste dygnet)",
    timeWeekly: "Veckovis",
    timeMonthly: "Månatligen",
    timeYearly: "Årsvis",

    geoFreeUA: "Fria Ukraina",
    geoOccupiedUA: "Ockuperade Ukraina (inkl. Krym)",
    geoRussia: "Ryssland",
    geoBorders: "Ukrainas gränser / Svarta havet",
    geoEUEEA: "EU och EES",
    geoWorld: "Resten av världen",

    actorUA: "Ukraina",
    actorRU: "Ryssland",
    actorEU: "EU",
    actorUK: "Storbritannien",
    actorUS: "USA",
    actorCN: "Kina",
    actorWorld: "Övriga världen",

    purposeReal: "Äkta syfte",
    purposeVision: "Vision",
    purposeStrategic: "Strategiskt mål",
    purposeTactical: "Taktiskt mål",
    purposeOperational: "Operationellt mål",
    purposeOutput: "Prestationsmål",
    purposeOutcome: "Resultatmål",
    purposeEffect: "Effektmål",

    targetCivilian: "Helt civila mål (sjukhus, skolor)",
    targetInfra: "Civil infrastruktur och transport",
    targetMilitary: "Militära resurser (trupp, pansar)",
    targetEnergy: "Energiproduktion och distribution",
    targetAmmo: "Krigsmaterielproduktion och lager",
    targetDiplomatic: "Diplomatiskt / politiskt initiativ",

    confConfirmed: "100% bekräftad (geoverifierad)",
    confHigh: "≥85% hög sannolikhet",
    confMedium: "≥60% måttlig / obekräftad",
    confClaim: "<50% påstående / propaganda",

    // Kortdetaljer
    sourceLabel: "Källa:",
    directSourceLink: "Gå till ursprungskälla",
    credibilityLabel: "Trovärdighet:",
    verificationLabel: "Verifieringsgrad:",
    targetTypeLabel: "Måltyp:",
    purposeLabel: "Syfte:",
    impactLabel: "Måluppfyllnad:",
    impactCompleted: "Fullbordad",
    impactPartial: "Delvis uppnådd",
    impactRepelled: "Avvärjd / nedskjuten",
    impactOngoing: "Pågående",
    impactUnknown: "Okänd",

    // Kartsektion
    mapTitle: "Taktisk och strategisk situationskarta",
    mapSubtitle: "Växla mellan taktisk frontkarta (24 timmar) och strategisk luftkrigskarta (30 dagar)",
    mapModeTactical: "Taktisk frontkarta (24 tim)",
    mapModeStrategic: "Strategisk luftkrigskarta (30 dagar)",

    // Förlustsektion (Minfin / Generalstaben)
    casualtiesTitle: "Ryska förluster (senaste dygnet och totalt)",
    casualtiesSubtitle: "Officiella operativa uppskattningar från Ukrainas Generalstab via Minfin, uppdateras dagligen",
    casualtiesDate: "Datum:",
    casualtiesLastUpdated: "Senast synkroniserad:",
    casualtiesDailyDelta: "Dygnsförändring",
    casualtiesTotalLosses: "Totalt sedan invasionens start",
    casualtiesHighlightsHeading: "Nyckeltal senaste dygnet",
    casualtiesBreakdownHeading: "Samtliga materiel- och personalkategorier",
    casualtiesCategory: "Kategori",
    casualtiesToday: "Idag",
    casualtiesTotal: "Totalt",
    casualtiesSourceLabel: "Källa & metod:",
    casualtiesSourceDescription: "Siffrorna baseras på Ukrainas Generalstabs officiella dygnsrapporter sammanställda av Minfin. Detta utgör ukrainska försvarsmaktens operativa uppskattningar. Som oberoende och konservativt referensmått redovisas fotoverifierade minimiförluster via Oryx under Metod.",
    casualtiesMinfinLink: "Se källdata på Minfin",
    casualtiesPersonnel: "Personal (stupade och sårade)",
    casualtiesArtillery: "Artillerisystem",
    casualtiesDrones: "Drönare (UAV)",
    casualtiesVehicles: "Transport- och tankfordon",
    casualtiesEquipmentDaily: "Materiel totalt idag",
    casualtiesShowAllCategories: "Visa alla 15 materielkategorier",
    casualtiesHideCategories: "Dölj detaljerade kategorier",

    // Analys- och expertsektion
    analysesTitle: "Professionella analyser och bedömningar",
    analysesSubtitle: "Utvalda och kurerade strategiska analyser från svenska och internationella militärexperter",
    analysesSearch: "Sök bland analyser och författare...",
    analysesAll: "Alla analytiker",
    analysesSwedish: "Svenska experter",
    analysesInternational: "Internationella strateger",
    analysesOSINT: "OSINT och satellitgranskare",
    analysesFeaturedHeading: "Utvalda expertanalyser",
    analysesFeaturedDesc: "Senaste strategiska bedömningarna från professionella analytiker",
    analysesViewAll: "Visa alla expertanalyser →",
    keyTakeawaysLabel: "Kärnslutsatser och strategisk effekt:",
    readOriginalAnalysis: "Läs fullständig analys",
    analysesEmpty: "Inga analyser matchar dina valda filter.",

    // Arkivsektion
    archiveTitle: "Historiskt arkiv",
    archiveSubtitle: "Dagliga händelser flyttas hit efter 24 timmars visning för att hålla dashboarden aktuell.",
    archiveSearch: "Sök i arkivet...",
    archiveEmpty: "Inga arkiverade händelser matchar dina valda filter.",

    // Källsektion
    sourcesTitle: "Källkatalog och verifieringskedja",
    sourcesSubtitle: "Alla publicerade uppgifter härrör från dokumenterade primärkällor eller oberoende granskare.",
    sourcesTierPrimary: "Primärkällor",
    sourcesTierIntel: "Underrättelsetjänster",
    sourcesTierOSINT: "OSINT och satellit",
    sourcesTierMedia: "Oberoende nyhetsmedier",
    sourcesTierFact: "Faktagranskning",

    // Metodologi
    methodTitle: "Metodologi och informationsstruktur",
    methodSubtitle: "Hur informationen struktureras, klassificeras och verifieras",

    // Footer
    footerText: "Ukrainakriget – Helautomatiskt, öppet dashboard för systematisk situationsanalys.",
    footerRepo: "Källkod på GitHub (ukrainakriget/ukrainakriget.github.io)",
    footerDisclaimer: "Informationen samlas in automatiskt och klassificeras med öppna källor i enlighet med internationella OSINT-standarder."
  },

  en: {
    // Header & Meta
    siteTitle: "The War in Ukraine",
    siteSubtitle: "Independent intelligence and situational dashboard",
    siteDescription: "An open, structured, automated situational awareness portal tracking developments in the Russo-Ukrainian War.",
    liveStatus: "Live briefing",
    systemLiveStatus: "Automated operation",
    systemDelayedStatus: "Delayed operation",
    lastUpdatedLabel: "Last updated:",
    nextUpdateLabel: "Next update:",
    delayedRun: "Delayed run",
    statusTooltip: "The site updates autonomously every 30 minutes via GitHub Actions and rotates events older than 24 hours to the archive.",
    feedSyncText: "Updated every 30 minutes • Next",
    activeEventsHeading: "Active events (last 24 hours)",
    activeEventsDesc: "Events displayed are automatically rotated to the archive after 24 hours ensuring the dashboard always displays today's situation.",
    lastUpdated: "Last updated:",
    hoursAgo: "hours ago",
    today: "Today",
    langButton: "Svenska",
    
    // Navigation
    navEvents: "Current events",
    navSituation: "Situational picture",
    navDashboard: "Current events",
    navTimeline: "Multi-perspective matrix",
    navArchive: "Archive (>24h)",
    navAnalyses: "Analyst insights",
    navSources: "Sources directory",
    navMethodology: "Methodology and structure",

    // Situational picture
    situationTitle: "Situational picture",
    situationSubtitle: "Operational metrics, air defense interception rate, and tactical and strategic conflict maps",

    // KPI / Summary
    kpiInterception: "Air defense interception rate",
    kpiInterceptionDesc: "Shaheds and cruise missiles intercepted in the last 24h",
    kpiFrontline: "Frontline clashes (24h)",
    kpiFrontlineDesc: "Heaviest fighting around Pokrovsk and Kurakhove",
    kpiCorridor: "Black Sea corridor",
    kpiCorridorDesc: "Monthly cargo volume exported via Ukrainian maritime corridor",
    kpiCivilianShare: "Civilian target ratio",
    kpiCivilianShareDesc: "Share of Russian missile/drone strikes targeting civilian infrastructure",

    // Filters & Dimensions
    filterTitle: "Multi-dimensional classification",
    filterSubtitle: "Combine multiple viewpoints to analyze the conflict from structured perspectives",
    filterSearchPlaceholder: "Search events, cities, weapon types, stakeholders...",
    filterReset: "Reset all filters",
    filterShowing: "Showing",
    filterOf: "of",
    filterEvents: "events",

    // Dimensions Names
    dimTime: "Time horizons",
    dimGeo: "Geographic sectors",
    dimActors: "Parties and stakeholders",
    dimPurpose: "Strategic purpose and intent",
    dimTarget: "Target characteristics",
    dimConfidence: "Confidence and probability",

    // Dimension Options
    optAll: "All",
    timeDaily: "Daily (last 24 hours)",
    timeWeekly: "Weekly",
    timeMonthly: "Monthly",
    timeYearly: "Yearly",

    geoFreeUA: "Free Ukraine",
    geoOccupiedUA: "Occupied Ukraine (incl. Crimea)",
    geoRussia: "Russian territory",
    geoBorders: "Ukraine's borders / Black Sea",
    geoEUEEA: "EU and EEA",
    geoWorld: "Rest of the world",

    actorUA: "Ukraine",
    actorRU: "Russia",
    actorEU: "EU",
    actorUK: "United Kingdom",
    actorUS: "United States",
    actorCN: "China",
    actorWorld: "Rest of world",

    purposeReal: "Underlying purpose",
    purposeVision: "Vision",
    purposeStrategic: "Strategic goal",
    purposeTactical: "Tactical goal",
    purposeOperational: "Operational goal",
    purposeOutput: "Output goal",
    purposeOutcome: "Outcome goal",
    purposeEffect: "Effect goal",

    targetCivilian: "Purely civilian (hospitals, schools, homes)",
    targetInfra: "Civilian infrastructure and transport",
    targetMilitary: "Military assets (troops, armor, command)",
    targetEnergy: "Energy generation and distribution",
    targetAmmo: "Arms manufacturing and munitions arsenals",
    targetDiplomatic: "Diplomatic / political initiative",

    confConfirmed: "100% confirmed (geolocated)",
    confHigh: "≥85% high probability",
    confMedium: "≥60% moderate / unconfirmed",
    confClaim: "<50% unsubstantiated claim / disinfo",

    // Card Details
    sourceLabel: "Source:",
    directSourceLink: "Open primary source",
    credibilityLabel: "Reliability:",
    verificationLabel: "Verification score:",
    targetTypeLabel: "Target classification:",
    purposeLabel: "Intent / purpose:",
    impactLabel: "Target fulfillment:",
    impactCompleted: "Achieved",
    impactPartial: "Partially achieved",
    impactRepelled: "Repelled / intercepted",
    impactOngoing: "In progress",
    impactUnknown: "Unknown",

    // Map section
    mapTitle: "Tactical and strategic operational map",
    mapSubtitle: "Toggle between tactical frontline (24h) and strategic deep air war (30 days)",
    mapModeTactical: "Tactical frontline map (24h)",
    mapModeStrategic: "Strategic air war map (30 days)",

    // Casualties section (Minfin / General Staff)
    casualtiesTitle: "Russian casualties (last 24 hours and cumulative)",
    casualtiesSubtitle: "Official operational estimates from the General Staff of the Armed Forces of Ukraine via Minfin, updated daily",
    casualtiesDate: "Date:",
    casualtiesLastUpdated: "Last synchronized:",
    casualtiesDailyDelta: "Daily delta",
    casualtiesTotalLosses: "Total since full-scale invasion",
    casualtiesHighlightsHeading: "Key daily highlights",
    casualtiesBreakdownHeading: "All equipment and personnel categories",
    casualtiesCategory: "Category",
    casualtiesToday: "Today",
    casualtiesTotal: "Total",
    casualtiesSourceLabel: "Source & methodology:",
    casualtiesSourceDescription: "Figures reflect official daily operational reporting from the General Staff of the Armed Forces of Ukraine compiled by Minfin. These constitute Ukrainian military operational estimates. For independent conservative reference, photo-verified minimum equipment losses from Oryx are documented under Methodology.",
    casualtiesMinfinLink: "View primary data on Minfin",
    casualtiesPersonnel: "Military personnel (killed / wounded)",
    casualtiesArtillery: "Artillery systems",
    casualtiesDrones: "UAVs / Drones",
    casualtiesVehicles: "Cars and fuel cisterns",
    casualtiesEquipmentDaily: "Total equipment delta today",
    casualtiesShowAllCategories: "Show all 15 equipment categories",
    casualtiesHideCategories: "Collapse detailed categories",

    // Analyses section
    analysesTitle: "Professional analyses and assessments",
    analysesSubtitle: "Curated strategic assessments from Swedish and international military experts",
    analysesSearch: "Search analyses and authors...",
    analysesAll: "All analysts",
    analysesSwedish: "Swedish experts",
    analysesInternational: "International strategists",
    analysesOSINT: "OSINT and satellite analysts",
    analysesFeaturedHeading: "Featured analyst insights",
    analysesFeaturedDesc: "Latest strategic evaluations from leading military analysts",
    analysesViewAll: "View all analyst insights →",
    keyTakeawaysLabel: "Key takeaways and strategic impact:",
    readOriginalAnalysis: "Read complete analysis",
    analysesEmpty: "No analyses match your selected filters.",

    // Archive section
    archiveTitle: "Historical archive",
    archiveSubtitle: "Daily events automatically rotate into the archive after 24 hours to keep the live dashboard current.",
    archiveSearch: "Search historical archive...",
    archiveEmpty: "No archived events match your selected criteria.",

    // Sources section
    sourcesTitle: "Sources catalog and lineage",
    sourcesSubtitle: "All published data points trace directly back to verified primary sources or independent investigators.",
    sourcesTierPrimary: "Primary sources",
    sourcesTierIntel: "Allied intelligence",
    sourcesTierOSINT: "OSINT and geolocation",
    sourcesTierMedia: "Independent media",
    sourcesTierFact: "Fact-checkers",

    // Methodology
    methodTitle: "Methodology and information structure",
    methodSubtitle: "Why Ukrainakriget provides structural clarity absent in legacy news feeds",

    // Footer
    footerText: "Ukrainakriget – Fully automated open dashboard for structured conflict intelligence.",
    footerRepo: "Source code on GitHub (ukrainakriget/ukrainakriget.github.io)",
    footerDisclaimer: "Information is curated and automatically classified using verified open-source intelligence standards."
  }
};

let currentLanguage = localStorage.getItem("ukrainakriget_lang") || "sv";

function getLang() {
  return currentLanguage;
}

function setLang(lang) {
  if (lang !== "sv" && lang !== "en") lang = "sv";
  currentLanguage = lang;
  localStorage.setItem("ukrainakriget_lang", lang);
  applyTranslations();
  // Trigger update event
  window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
}

function toggleLang() {
  setLang(currentLanguage === "sv" ? "en" : "sv");
}

function t(key) {
  const dict = translations[currentLanguage] || translations.sv;
  return dict[key] || translations.sv[key] || key;
}

function applyTranslations() {
  const dict = translations[currentLanguage] || translations.sv;
  document.documentElement.lang = currentLanguage;
  
  // Elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Elements with data-i18n-placeholder attribute
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // Elements with data-i18n-title attribute
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key]) {
      el.title = dict[key];
    }
  });

  const langBtn = document.getElementById("lang-toggle-btn");
  if (langBtn) {
    langBtn.innerHTML = currentLanguage === "sv" 
      ? `<span class="flag-icon">🇬🇧</span> English` 
      : `<span class="flag-icon">🇸🇪</span> Svenska`;
  }
}
