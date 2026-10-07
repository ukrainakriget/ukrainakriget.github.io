/**
 * app.js
 * Huvudkontroller för Ukrainakriget Dashboard.
 * Sköter navigering, filtertillstånd, rendering av händelsekort, arkiv och källkatalog.
 */

window.App = {
  activeTab: "events",
  filters: {
    search: "",
    tidshorisont: "alla",
    geografiskt_omrade: "alla",
    part: "alla",
    syfte: "alla",
    anfallsmal: "alla",
    minSannolikhet: 0
  },
  analysesFilters: {
    authorType: "alla",
    search: ""
  },

  async init() {
    console.log("Initierar Ukrainakriget Dashboard...");
    
    // 1. Initialisera språksystem
    applyTranslations();

    // 2. Ladda data (fetch eller fallback)
    await AppData.init();

    // 3. Initiera taktisk och strategisk karta
    TacticalMap.init("tactical-map-container");

    // 4. Koppla händelselyssnare
    this.setupEventListeners();

    // 5. Rendera dashboard
    this.renderKPIs();
    this.renderCasualties();
    this.renderSystemStatus();
    this.renderActiveFeed();
    this.renderFeaturedAnalyses();
    this.renderSourcesList();

    // 6. Automatisk uppdatering av klockor och relativ tid
    setInterval(() => this.renderSystemStatus(), 60000);

    console.log("Ukrainakriget Dashboard färdigladdad.");
  },

  setupEventListeners() {
    // Språkväxlare
    const langBtn = document.getElementById("lang-toggle-btn");
    if (langBtn) {
      langBtn.addEventListener("click", () => toggleLang());
    }

    // Språkhändelse
    window.addEventListener("languageChanged", () => {
      this.renderKPIs();
      this.renderCasualties();
      this.renderSystemStatus();
      this.renderActiveFeed();
      this.renderArchiveFeed();
      this.renderFeaturedAnalyses();
      this.renderAnalyses();
      this.renderSourcesList();
      TacticalMap.render();
    });

    // Navigeringstabb-knappar
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });

    // Sökfält för händelser
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.filters.search = e.target.value;
        this.applyFilters();
      });
    }

    // Filter-väljare (Dropdowns & Selects)
    const filterSelectors = [
      { id: "filter-time", key: "tidshorisont" },
      { id: "filter-geo", key: "geografiskt_omrade" },
      { id: "filter-actor", key: "part" },
      { id: "filter-purpose", key: "syfte" },
      { id: "filter-target", key: "anfallsmal" },
      { id: "filter-confidence", key: "minSannolikhet", parse: v => parseInt(v, 10) || 0 }
    ];

    filterSelectors.forEach(({ id, key, parse }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", (e) => {
          this.filters[key] = parse ? parse(e.target.value) : e.target.value;
          this.applyFilters();
        });
      }
    });

    // Återställningsknapp
    const resetBtn = document.getElementById("reset-filters-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetFilters();
      });
    }

    // Arkiv-sökfält
    const archiveSearchInput = document.getElementById("archive-search-input");
    if (archiveSearchInput) {
      archiveSearchInput.addEventListener("input", (e) => {
        this.renderArchiveFeed(e.target.value);
      });
    }

    // Analyssökfält
    const analysesSearchInput = document.getElementById("analyses-search-input");
    if (analysesSearchInput) {
      analysesSearchInput.addEventListener("input", (e) => {
        this.analysesFilters.search = e.target.value;
        this.renderAnalyses();
      });
    }

    // Analys-författarfilter (Pills)
    document.querySelectorAll(".analyses-author-pills .pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".analyses-author-pills .pill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.analysesFilters.authorType = btn.getAttribute("data-author-filter") || "alla";
        this.renderAnalyses();
      });
    });

    // Toggle-knapp för att expandera/komprimera samtliga förlustkategorier
    const btnToggleCasualties = document.getElementById("btn-toggle-casualties");
    const breakdownGrid = document.getElementById("casualties-breakdown-grid");
    if (btnToggleCasualties && breakdownGrid) {
      btnToggleCasualties.addEventListener("click", () => {
        const isHidden = breakdownGrid.classList.toggle("hidden");
        const isSv = getLang() === "sv";
        btnToggleCasualties.textContent = isHidden
          ? (isSv ? "Visa alla 15 materielkategorier" : "Show all 15 equipment categories")
          : (isSv ? "Dölj detaljerade kategorier" : "Collapse detailed categories");
      });
    }
  },

  switchTab(tab) {
    if (tab === "dashboard") tab = "events";
    this.activeTab = tab;
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });

    document.querySelectorAll(".tab-content-section").forEach(sec => {
      sec.classList.toggle("hidden", sec.id !== `tab-${tab}`);
    });

    if (tab === "archive") {
      this.renderArchiveFeed();
    } else if (tab === "analyses") {
      this.renderAnalyses();
    } else if (tab === "sources") {
      this.renderSourcesList();
    } else if (tab === "situation") {
      this.renderKPIs();
      this.renderCasualties();
      if (typeof TacticalMap !== "undefined" && TacticalMap.render) {
        TacticalMap.render();
      }
    } else if (tab === "events" || tab === "timeline") {
      this.applyFilters();
      if (tab === "events") {
        this.renderFeaturedAnalyses();
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  resetFilters() {
    this.filters = {
      search: "",
      tidshorisont: "alla",
      geografiskt_omrade: "alla",
      part: "alla",
      syfte: "alla",
      anfallsmal: "alla",
      minSannolikhet: 0
    };

    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = "";

    const selects = ["filter-time", "filter-geo", "filter-actor", "filter-purpose", "filter-target", "filter-confidence"];
    selects.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "alla";
    });
    const confEl = document.getElementById("filter-confidence");
    if (confEl) confEl.value = "0";

    this.applyFilters();
  },

  applyMapFilter(geoFilter, sectorName) {
    this.filters.geografiskt_omrade = geoFilter;
    const geoSelect = document.getElementById("filter-geo");
    if (geoSelect) geoSelect.value = geoFilter;

    // Switch to feed view
    this.switchTab("timeline");
    this.applyFilters();
  },

  applyFilters() {
    const listToFilter = this.activeTab === "archive" 
      ? AppData.getArchivedEvents() 
      : (this.activeTab === "timeline" ? AppData.getAllEvents() : AppData.getActiveEvents());

    const filtered = AppData.filter(listToFilter, this.filters);

    if (this.activeTab === "archive") {
      this.renderEventCards("archive-events-container", filtered, true);
    } else if (this.activeTab === "timeline") {
      this.renderEventCards("timeline-events-container", filtered, false);
    } else {
      this.renderEventCards("active-events-container", filtered, false);
    }

    // Uppdatera räknare
    const countEl = document.getElementById("filtered-count");
    if (countEl) {
      countEl.textContent = `${filtered.length} ${t("filterOf")} ${listToFilter.length} ${t("filterEvents")}`;
    }
  },

  renderKPIs() {
    const stats = AppData.statistics.daily_metrics || {};
    const lang = getLang();

    // 1. Luftförsvarseffektivitet
    const elInterception = document.getElementById("kpi-interception-val");
    const interceptionRate = stats.shahed_interception_rate_percent || 69;
    if (elInterception) elInterception.textContent = `${Math.round(interceptionRate)}%`;

    const elInterceptionSub = document.getElementById("kpi-interception-sub");
    if (elInterceptionSub) {
      if (stats.drones_down && stats.drones_total) {
        elInterceptionSub.textContent = lang === "sv"
          ? `${stats.drones_down} av ${stats.drones_total} ryska drönare nedskjutna idag`
          : `${stats.drones_down} of ${stats.drones_total} Russian drones intercepted today`;
      }
    }

    // 2. Frontstrider
    const elFrontline = document.getElementById("kpi-frontline-val");
    if (elFrontline) elFrontline.textContent = `${stats.frontline_skirmishes_24h || 174}`;

    const elFrontlineSub = document.getElementById("kpi-frontline-sub");
    if (elFrontlineSub && stats.hotspots && stats.hotspots.length) {
      const topSpots = stats.hotspots.slice(0, 3).map(h => lang === "sv" ? h.name_sv : h.name_en).join(", ");
      elFrontlineSub.textContent = lang === "sv"
        ? `Intensivast strider kring ${topSpots}`
        : `Heaviest clashes around ${topSpots}`;
    }

    // 3. Sjökorridor
    const elCorridor = document.getElementById("kpi-corridor-val");
    const corridorVol = stats.black_sea_export_monthly_tons_millions || 6.4;
    if (elCorridor) {
      elCorridor.textContent = lang === "sv" ? `${corridorVol.toString().replace(".", ",")} milj. ton` : `${corridorVol}M tons`;
    }

    // 4. Civila mål
    const elCivilian = document.getElementById("kpi-civilian-val");
    const civPct = AppData.statistics.target_distribution_percent?.helt_civila || 48;
    if (elCivilian) elCivilian.textContent = `${civPct}%`;

    const elCivilianSub = document.getElementById("kpi-civilian-sub");
    if (elCivilianSub) {
      elCivilianSub.textContent = lang === "sv"
        ? `${civPct}% av anfallen mot bostäder, skolor, vårdcentraler och akademi`
        : `${civPct}% of strikes hitting residences, clinics, and academy`;
    }
  },

  renderCasualties() {
    const casualties = AppData.getCasualties();
    if (!casualties) return;

    const lang = getLang();
    const isSv = lang === "sv";

    // 1. Datum & synk-badge
    const dateBadge = document.getElementById("casualties-date-badge");
    if (dateBadge && casualties.date) {
      dateBadge.textContent = casualties.date;
    }

    const syncEl = document.getElementById("casualties-sync-time");
    if (syncEl) {
      if (casualties.last_updated) {
        try {
          const d = new Date(casualties.last_updated);
          const timeStr = d.toLocaleTimeString(isSv ? "sv-SE" : "en-GB", { hour: "2-digit", minute: "2-digit" });
          syncEl.textContent = isSv ? `Synkroniserad idag ${timeStr}` : `Synchronized today at ${timeStr}`;
        } catch (e) {
          syncEl.textContent = isSv ? "Idag" : "Today";
        }
      } else {
        syncEl.textContent = isSv ? "Idag" : "Today";
      }
    }

    // 2. Highlights (Personal, Artilleri, Drönare, Transport, Materiel totalt)
    const highlightsContainer = document.getElementById("casualties-highlights");
    if (highlightsContainer) {
      const summary = casualties.summary || {};
      const formatNumber = num => (num || 0).toLocaleString(isSv ? "sv-SE" : "en-US");

      const artCat = casualties.categories?.find(c => c.key === "artillery");
      const uavCat = casualties.categories?.find(c => c.key === "uav");
      const vehCat = casualties.categories?.find(c => c.key === "vehicles");

      const highlightCards = [
        {
          key: "personnel",
          title: isSv ? "Personal (stupade/sårade)" : "Personnel (killed/wounded)",
          daily: summary.daily_personnel || 0,
          total: summary.total_personnel || 0,
          icon: "🪖",
          unit: isSv ? "man" : "troops",
          tone: "danger"
        },
        {
          key: "artillery",
          title: isSv ? "Artillerisystem" : "Artillery systems",
          daily: summary.daily_artillery || (artCat?.daily || 0),
          total: artCat?.total || 0,
          icon: "💥",
          unit: isSv ? "st" : "units",
          tone: "danger"
        },
        {
          key: "uav",
          title: isSv ? "Drönare (UAV)" : "UAVs / Drones",
          daily: summary.daily_drones || (uavCat?.daily || 0),
          total: uavCat?.total || 0,
          icon: "🛸",
          unit: isSv ? "st" : "units",
          tone: "warn"
        },
        {
          key: "vehicles",
          title: isSv ? "Transport- och tankfordon" : "Cars & fuel cisterns",
          daily: vehCat?.daily || 0,
          total: vehCat?.total || 0,
          icon: "🚛",
          unit: isSv ? "st" : "units",
          tone: "primary"
        },
        {
          key: "equipment_total",
          title: isSv ? "Materiel totalt idag" : "Total equipment today",
          daily: summary.daily_equipment_total || 0,
          total: null,
          icon: "🛡️",
          unit: isSv ? "enheter" : "units",
          tone: "highlight"
        }
      ];

      highlightsContainer.innerHTML = highlightCards.map(c => `
        <div class="casualty-kpi-card casualty-${c.tone}">
          <div class="casualty-kpi-header">
            <span class="casualty-kpi-title">${c.title}</span>
            <span class="casualty-kpi-icon">${c.icon}</span>
          </div>
          <div class="casualty-kpi-daily">
            <span class="casualty-delta-badge ${c.daily > 0 ? 'delta-positive' : 'delta-zero'}">+${formatNumber(c.daily)}</span>
            <span class="casualty-daily-label">${isSv ? "senaste dygnet" : "last 24h"}</span>
          </div>
          ${c.total !== null ? `
            <div class="casualty-kpi-total">
              <span class="total-label">${isSv ? "Totalt:" : "Total:"}</span>
              <span class="total-value">${formatNumber(c.total)} ${c.unit}</span>
            </div>
          ` : `
            <div class="casualty-kpi-total">
              <span class="total-label">${isSv ? "Omfattning:" : "Scope:"}</span>
              <span class="total-value">${isSv ? "Alla 14 fordons- och vapenslag" : "Across all 14 equipment types"}</span>
            </div>
          `}
        </div>
      `).join("");
    }

    // 3. Detaljerad nedbrytning (15 kategorier)
    const breakdownGrid = document.getElementById("casualties-breakdown-grid");
    if (breakdownGrid && casualties.categories) {
      const formatNumber = num => (num || 0).toLocaleString(isSv ? "sv-SE" : "en-US");

      breakdownGrid.innerHTML = casualties.categories.map(cat => {
        const name = isSv ? cat.name_sv : cat.name_en;
        const unit = isSv ? cat.unit_sv : cat.unit_en;
        const dailyStr = cat.daily > 0 ? `+${formatNumber(cat.daily)}` : "0";
        const dailyClass = cat.daily > 0 ? "badge-delta-pos" : "badge-delta-zero";

        return `
          <div class="breakdown-category-row ${cat.highlight ? 'category-highlighted' : ''}">
            <div class="category-meta">
              <span class="category-icon">${cat.icon || '▫️'}</span>
              <span class="category-name">${name}</span>
            </div>
            <div class="category-stats">
              <span class="category-daily ${dailyClass}">${dailyStr}</span>
              <span class="category-total">${formatNumber(cat.total)} <span class="category-unit">${unit}</span></span>
            </div>
          </div>
        `;
      }).join("");
    }

    // 4. Metodologifotnot & länk
    const methText = document.getElementById("casualties-methodology-text");
    if (methText) {
      methText.textContent = isSv
        ? casualties.methodology_note_sv || t("casualtiesSourceDescription")
        : casualties.methodology_note_en || t("casualtiesSourceDescription");
    }
  },

  renderSystemStatus() {
    const lang = getLang();
    const lastUpdatedStr = AppData.lastUpdated;
    let lastDate = lastUpdatedStr ? new Date(lastUpdatedStr) : null;
    if (!lastDate || isNaN(lastDate.getTime())) {
      const allEvents = AppData.getAllEvents();
      if (allEvents.length && allEvents[0].timestamp) {
        lastDate = new Date(allEvents[0].timestamp);
      } else {
        lastDate = new Date();
      }
    }

    const now = new Date();
    const timeOpts = { hour: "2-digit", minute: "2-digit" };

    // 1. Formatera senaste uppdatering
    const isLastToday = lastDate.toDateString() === now.toDateString();
    const lastTime = lastDate.toLocaleTimeString(lang === "sv" ? "sv-SE" : "en-GB", timeOpts);
    
    let formattedLast = "";
    if (isLastToday) {
      formattedLast = lang === "sv" ? `Idag ${lastTime}` : `Today ${lastTime}`;
    } else {
      const lastDatePart = lastDate.toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", {
        day: "numeric",
        month: "short"
      }).replace(".", "");
      formattedLast = lang === "sv" ? `${lastDatePart} ${lastTime}` : `${lastDatePart} at ${lastTime}`;
    }

    // 2. Beräkna nästa schemalagda uppdatering och eventuell fördröjning
    const intervalMs = (AppData.updateFrequencyHours || 0.5) * 60 * 60 * 1000;
    const diffSinceLastMs = now.getTime() - lastDate.getTime();
    // Om det gått mer än 50 minuter sedan senaste körning vid 30m-schema (eller intervalMs + 35m) flaggas driften som fördröjd
    const isDelayed = diffSinceLastMs > (intervalMs + 35 * 60 * 1000);

    let nextDate = new Date(lastDate.getTime() + intervalMs);
    while (nextDate.getTime() <= now.getTime()) {
      nextDate = new Date(nextDate.getTime() + intervalMs);
    }

    const isNextToday = nextDate.toDateString() === now.toDateString();
    const nextTime = nextDate.toLocaleTimeString(lang === "sv" ? "sv-SE" : "en-GB", timeOpts);
    const diffMs = nextDate.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / (60 * 1000));
    const diffHrs = Math.max(1, Math.round(diffMs / (60 * 60 * 1000)));

    let relativeStr = "";
    if (diffMin <= 5) {
      relativeStr = lang === "sv" ? "strax" : "soon";
    } else if (diffMin < 60) {
      relativeStr = lang === "sv" ? `om ${diffMin} min` : `in ${diffMin} min`;
    } else {
      relativeStr = lang === "sv" ? `om ca ${diffHrs} tim` : `in ~${diffHrs}h`;
    }

    let formattedNext = "";
    if (isDelayed) {
      formattedNext = t("delayedRun");
    } else if (isNextToday) {
      formattedNext = lang === "sv" ? `ca ${nextTime} (${relativeStr})` : `approx. ${nextTime} (${relativeStr})`;
    } else {
      const nextDatePart = nextDate.toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", {
        day: "numeric",
        month: "short"
      }).replace(".", "");
      formattedNext = lang === "sv" ? `${nextDatePart} ca ${nextTime} (${relativeStr})` : `${nextDatePart} approx. ${nextTime} (${relativeStr})`;
    }

    // 3. Uppdatera DOM-element i headern
    const elLast = document.getElementById("status-last-updated");
    if (elLast) elLast.textContent = formattedLast;

    const elNext = document.getElementById("status-next-update");
    if (elNext) {
      elNext.textContent = formattedNext;
      elNext.style.color = isDelayed ? "#f59e0b" : "#fff";
    }

    const elStatusLabel = document.querySelector(".status-indicator .status-label");
    if (elStatusLabel) {
      elStatusLabel.textContent = isDelayed ? t("systemDelayedStatus") : t("systemLiveStatus");
    }

    // Uppdatera pulserande statusprickar
    document.querySelectorAll(".pulse-dot").forEach(dot => {
      if (isDelayed) {
        dot.classList.add("delayed");
      } else {
        dot.classList.remove("delayed");
      }
    });

    // 4. Uppdatera indikator i flödeshuvudet
    const elFeedIndicator = document.getElementById("active-feed-time-indicator");
    if (elFeedIndicator) {
      const freqHours = AppData.updateFrequencyHours || 0.5;
      let freqTextSv = freqHours === 1 ? "Uppdateras varje timme" : `Uppdateras var ${freqHours}:e timme`;
      let freqTextEn = freqHours === 1 ? "Updated every hour" : `Updated every ${freqHours} hours`;
      if (freqHours <= 0.5) {
        freqTextSv = "Uppdateras var 30:e minut";
        freqTextEn = "Updated every 30 minutes";
      }
      const freqBase = lang === "sv" ? freqTextSv : freqTextEn;

      if (isDelayed) {
        elFeedIndicator.textContent = `${freqBase} • ${t("delayedRun")}`;
      } else {
        elFeedIndicator.textContent = lang === "sv"
          ? `${freqBase} • Nästa ca ${nextTime}`
          : `${freqBase} • Next approx. ${nextTime}`;
      }
    }
  },

  renderActiveFeed() {
    const active = AppData.getActiveEvents();
    this.renderEventCards("active-events-container", active, false);
    
    // Also timeline if open
    const all = AppData.getAllEvents();
    this.renderEventCards("timeline-events-container", all, false);

    const countEl = document.getElementById("filtered-count");
    if (countEl) {
      countEl.textContent = `${active.length} ${t("filterOf")} ${active.length} ${t("filterEvents")}`;
    }
  },

  renderArchiveFeed(searchFilter = "") {
    let archived = AppData.getArchivedEvents();
    if (searchFilter) {
      archived = AppData.filter(archived, { ...this.filters, search: searchFilter });
    }
    this.renderEventCards("archive-events-container", archived, true);
  },

  renderEventCards(containerId, eventsList, isArchive = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!eventsList || eventsList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>${isArchive ? t("archiveEmpty") : (getLang() === "sv" ? "Inga händelser matchar dina valda filter." : "No events match the selected filters.")}</p>
          <button class="btn btn-secondary btn-sm" onclick="App.resetFilters()">${t("filterReset")}</button>
        </div>
      `;
      return;
    }

    const lang = getLang();
    const isEn = lang === "en";

    const cardsHtml = eventsList.map(evt => {
      const title = isEn ? (evt.title_en || evt.title_sv) : evt.title_sv;
      const summary = isEn ? (evt.summary_en || evt.summary_sv) : evt.summary_sv;
      const confidence = evt.niva_vetskap_sannolikhet || { procent: 100, niva: "bekraftad" };
      const confidencePct = confidence.procent || 100;
      const confidenceReason = isEn ? (confidence.motivering_en || confidence.motivering_sv) : confidence.motivering_sv;

      // Target classification label
      const targetBadge = this.formatTargetBadge(evt.egenskaper_anfallsmal, isEn);

      // Geographic label
      const geoLabel = this.formatGeoLabel(evt.geografiskt_omrade, isEn);

      // Purpose
      const purposeDesc = evt.syfte 
        ? (isEn ? (evt.syfte.beskrivning_en || evt.syfte.beskrivning_sv) : evt.syfte.beskrivning_sv)
        : "";

      // Actors badges
      const actorBadges = (evt.parter_intressenter || []).map(p => this.formatActorBadge(p, isEn)).join(" ");

      // Confidence badge color
      let confBadgeClass = "conf-verified";
      let confText = `${confidencePct}% ${isEn ? "Confirmed" : "Bekräftad"}`;
      if (confidencePct < 60) {
        confBadgeClass = "conf-claim";
        confText = `${confidencePct}% ${isEn ? "Unverified Claim" : "Påstående"}`;
      } else if (confidencePct < 85) {
        confBadgeClass = "conf-medium";
        confText = `${confidencePct}% ${isEn ? "Moderate" : "Medel sannolikhet"}`;
      } else if (confidencePct < 100) {
        confBadgeClass = "conf-high";
        confText = `${confidencePct}% ${isEn ? "High Confidence" : "Hög sannolikhet"}`;
      }

      // Time tag
      const timeStr = evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      const dateStr = evt.date || "";

      return `
        <article class="event-card ${evt.egenskaper_anfallsmal || ''}" id="${evt.id}">
          <div class="event-card-header">
            <div class="event-meta-top">
              <span class="badge badge-date">📅 ${dateStr} ${timeStr ? '• ' + timeStr : ''}</span>
              <span class="badge badge-geo">📍 ${geoLabel}</span>
              ${evt.location_name ? `<span class="badge badge-subloc">${evt.location_name}</span>` : ''}
              <div class="actors-wrapper">${actorBadges}</div>
            </div>
            <div class="verification-meter ${confBadgeClass}" title="${confidenceReason}">
              <span class="meter-dot"></span>
              <span class="meter-text">${confText}</span>
            </div>
          </div>

          <h3 class="event-title">${title}</h3>
          
          <p class="event-summary">${summary}</p>

          <!-- Flerdimensionell analysram -->
          <div class="dimension-breakdown-box">
            <div class="dimension-row">
              <span class="dim-label">🎯 ${t("purposeLabel")}</span>
              <span class="dim-val">${purposeDesc}</span>
            </div>
            <div class="dimension-row">
              <span class="dim-label">🏢 ${t("targetTypeLabel")}</span>
              <span class="dim-val">${targetBadge}</span>
            </div>
            <div class="dimension-row">
              <span class="dim-label">🔍 ${t("verificationLabel")}</span>
              <span class="dim-val faint">${confidenceReason}</span>
            </div>
          </div>

          <!-- Källhänvisning (Obligatoriskt krav i Ukrainakriget.md) -->
          <footer class="event-card-footer">
            <div class="source-info">
              <span class="source-prefix">${t("sourceLabel")}</span>
              <strong class="source-name">${evt.kalla}</strong>
              ${evt.kallkategori ? `<span class="source-cat">(${evt.kallkategori})</span>` : ''}
              ${evt.cluster_count && evt.cluster_count > 1 ? `
                <span class="badge badge-cluster" style="margin-left: 6px; font-size: 0.75rem; background: var(--color-surface-hover, #232c3d); padding: 2px 7px; border-radius: 4px; color: var(--color-primary-light, #60a5fa); border: 1px solid var(--color-border, #374151); font-weight: 500;" title="${isEn ? `${evt.cluster_count} news reports consolidated into this verified event` : `${evt.cluster_count} nyhetsrapporter samlade till denna verifierade händelse`}">
                  🔗 ${isEn ? `${evt.cluster_count} reports merged` : `${evt.cluster_count} rapporter samlade`}
                </span>
              ` : ''}
            </div>
            <a href="${evt.kallurl}" target="_blank" rel="noopener noreferrer" class="source-link-btn" title="${t("directSourceLink")}">
              ${t("directSourceLink")} <span class="external-arrow">↗</span>
            </a>
          </footer>
        </article>
      `;
    }).join("");

    container.innerHTML = cardsHtml;
  },

  formatTargetBadge(type, isEn) {
    const map = {
      helt_civila: { sv: "Helt civila mål", en: "Purely civilian", icon: "🏥", cls: "target-civ" },
      civil_infrastruktur: { sv: "Civil infrastruktur och transport", en: "Civil infrastructure and transport", icon: "⛽", cls: "target-infra" },
      militara_resurser: { sv: "Militära resurser", en: "Military assets", icon: "🛡️", cls: "target-mil" },
      energiproduktion: { sv: "Energiproduktion och distribution", en: "Energy generation and distribution", icon: "⚡", cls: "target-energy" },
      krigsmaterielproduktion: { sv: "Krigsmateriel och arsenal", en: "Arms and munitions", icon: "🏭", cls: "target-ammo" },
      diplomatiskt_politiskt: { sv: "Diplomatiskt / politiskt initiativ", en: "Diplomatic / political initiative", icon: "🤝", cls: "target-diplo" }
    };
    const t = map[type] || { sv: type, en: type, icon: "📌", cls: "target-gen" };
    return `<span class="badge ${t.cls}">${t.icon} ${isEn ? t.en : t.sv}</span>`;
  },

  formatGeoLabel(geo, isEn) {
    const map = {
      fria_ukraina: { sv: "Fria Ukraina", en: "Free Ukraine" },
      ockuperade_ukraina: { sv: "Ockuperade Ukraina (inkl. Krym)", en: "Occupied Ukraine (incl. Crimea)" },
      ryssland: { sv: "Ryssland", en: "Russian territory" },
      ukrainas_granser: { sv: "Ukrainas gränser / Svarta havet", en: "Ukraine's borders / Black Sea" },
      eu_ees: { sv: "EU och EES", en: "EU and EEA" },
      resten_av_varlden: { sv: "Resten av världen", en: "Rest of the world" }
    };
    const g = map[geo];
    return g ? (isEn ? g.en : g.sv) : geo;
  },

  formatActorBadge(actor, isEn) {
    const map = {
      ukraina: { label: "🇺🇦 UA", title: isEn ? "Ukraine" : "Ukraina" },
      ryssland: { label: "🇷🇺 RU", title: isEn ? "Russia" : "Ryssland" },
      eu: { label: "🇪🇺 EU", title: "EU" },
      uk: { label: "🇬🇧 UK", title: isEn ? "United Kingdom" : "Storbritannien" },
      usa: { label: "🇺🇸 US", title: isEn ? "United States" : "USA" },
      kina: { label: "🇨🇳 CN", title: isEn ? "China" : "Kina" },
      ovriga_varlden: { label: "🌐 Global", title: isEn ? "Rest of World" : "Övriga världen" }
    };
    const a = map[actor] || { label: actor, title: actor };
    return `<span class="badge badge-actor" title="${a.title}">${a.label}</span>`;
  },

  renderFeaturedAnalyses() {
    const container = document.getElementById("dashboard-featured-analyses");
    if (!container) return;

    const allAnalyses = AppData.getAnalyses() || [];
    const featured = allAnalyses.slice(0, 3);
    const lang = getLang();
    const isEn = lang === "en";

    if (!featured.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = featured.map(a => {
      const title = isEn ? (a.title_en || a.title_sv) : a.title_sv;
      const summary = isEn ? (a.summary_en || a.summary_sv) : a.summary_sv;
      const authorTitle = isEn ? (a.author_title_en || a.author_title_sv) : a.author_title_sv;
      const takeaways = (isEn ? (a.key_takeaways_en || a.key_takeaways_sv) : a.key_takeaways_sv) || [];

      return `
        <article class="featured-analysis-card">
          <div class="analysis-card-top">
            <div class="author-meta-box">
              <span class="author-badge-icon">${a.author_type === 'svensk_expert' ? '🇸🇪' : (a.author_type === 'osint_analytiker' ? '🛰️' : '🌐')}</span>
              <div>
                <strong class="author-name-text">${a.author_name}</strong>
                <span class="author-title-text">${authorTitle}</span>
              </div>
            </div>
            <span class="analysis-date-badge">📅 ${a.date}</span>
          </div>

          <h3 class="analysis-card-title">${title}</h3>
          <p class="analysis-card-summary">${summary}</p>

          ${takeaways.length ? `
            <div class="analysis-takeaways-box">
              <strong class="takeaways-header">💡 ${isEn ? 'Key takeaways:' : 'Kärnslutsatser:'}</strong>
              <ul class="takeaways-list">
                ${takeaways.slice(0, 2).map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="analysis-card-footer">
            <span class="analysis-platform-tag">🔗 ${a.platform}</span>
            <a href="${a.url}" target="_blank" rel="noopener noreferrer" class="source-link-btn btn-sm">
              ${isEn ? 'Read full analysis' : 'Läs fullständig analys'} ↗
            </a>
          </div>
        </article>
      `;
    }).join("");
  },

  renderAnalyses() {
    const container = document.getElementById("analyses-container");
    if (!container) return;

    const filtered = AppData.filterAnalyses(this.analysesFilters) || [];
    const lang = getLang();
    const isEn = lang === "en";

    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>${isEn ? 'No analyses match the selected filters.' : 'Inga analyser matchar dina valda filter.'}</p>
          <button class="btn btn-secondary btn-sm" onclick="App.resetAnalysesFilters()">${isEn ? 'Reset filters' : 'Återställ filter'}</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(a => {
      const title = isEn ? (a.title_en || a.title_sv) : a.title_sv;
      const summary = isEn ? (a.summary_en || a.summary_sv) : a.summary_sv;
      const authorTitle = isEn ? (a.author_title_en || a.author_title_sv) : a.author_title_sv;
      const takeaways = (isEn ? (a.key_takeaways_en || a.key_takeaways_sv) : a.key_takeaways_sv) || [];
      const topics = a.topics || [];

      let typeBadge = isEn ? "International strategist" : "Internationell strateg";
      if (a.author_type === "svensk_expert") typeBadge = isEn ? "Swedish defense analyst" : "Svensk försvarsexpert";
      else if (a.author_type === "osint_analytiker") typeBadge = isEn ? "Satellite OSINT" : "Satellit & OSINT";

      return `
        <article class="analysis-full-card">
          <header class="analysis-card-header">
            <div class="author-block">
              <div class="author-avatar">${a.author_name.charAt(0)}</div>
              <div>
                <div class="author-title-row">
                  <h3 class="analysis-author-name">${a.author_name}</h3>
                  <span class="badge badge-author-type">${typeBadge}</span>
                </div>
                <div class="analysis-author-bio">${authorTitle}</div>
              </div>
            </div>
            <div class="analysis-header-right">
              <span class="analysis-date">📅 ${a.date}</span>
              <span class="badge badge-credibility" title="${a.verified_credibility || ''}">🛡️ ${isEn ? 'Verified analyst' : 'Verifierad analytiker'}</span>
            </div>
          </header>

          <h4 class="analysis-headline">${title}</h4>
          
          <div class="analysis-body-text">
            <p>${summary}</p>
          </div>

          ${takeaways.length ? `
            <div class="analysis-takeaways-container">
              <div class="takeaways-lead">⚡ ${isEn ? 'Strategic impact and takeaways:' : 'Strategisk effekt och slutsatser:'}</div>
              <ul class="takeaways-bullet-points">
                ${takeaways.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <footer class="analysis-card-bottom">
            <div class="analysis-topics-row">
              ${topics.map(t => `<span class="topic-tag">#${t}</span>`).join(' ')}
            </div>
            <div class="analysis-action-row">
              <span class="analysis-origin-label">${isEn ? 'Published on' : 'Publicerad på'} <strong>${a.platform}</strong></span>
              <a href="${a.url}" target="_blank" rel="noopener noreferrer" class="source-link-btn">
                ${isEn ? 'Read complete analysis' : 'Läs fullständig analys'} <span class="external-arrow">↗</span>
              </a>
            </div>
          </footer>
        </article>
      `;
    }).join("");
  },

  resetAnalysesFilters() {
    this.analysesFilters = { authorType: "alla", search: "" };
    const searchInput = document.getElementById("analyses-search-input");
    if (searchInput) searchInput.value = "";
    document.querySelectorAll(".analyses-author-pills .pill-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-author-filter") === "alla");
    });
    this.renderAnalyses();
  },

  renderSourcesList() {
    const container = document.getElementById("sources-container");
    if (!container) return;

    const sources = AppData.sources || [];
    const categories = AppData.sourceCategories || [];
    const isEn = getLang() === "en";

    let html = "";
    categories.forEach(cat => {
      const catSources = sources.filter(s => s.category === cat.id);
      if (catSources.length === 0) return;

      const catName = isEn ? (cat.name_en || cat.name_sv) : cat.name_sv;
      const catDesc = isEn ? (cat.description_en || cat.description_sv) : cat.description_sv;

      html += `
        <div class="source-category-section">
          <div class="source-cat-header">
            <h3 class="source-cat-title">${catName}</h3>
            ${catDesc ? `<p class="source-cat-desc">${catDesc}</p>` : ''}
          </div>
          <div class="source-cards-grid">
            ${catSources.map(s => `
              <div class="source-card">
                <div class="source-card-top">
                  <h4 class="source-card-name">${s.name}</h4>
                  <span class="source-card-tier">${s.tier || 'Källa'}</span>
                </div>
                <p class="source-card-desc">${isEn ? (s.description_en || s.description_sv) : s.description_sv}</p>
                <div class="source-card-footer">
                  <span class="source-credibility">🛡️ ${s.credibility || 'Verifierad'}</span>
                  <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="source-ext-link">
                    ${isEn ? 'Visit source' : 'Besök källa'} ↗
                  </a>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }
};

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.App.init();
});
