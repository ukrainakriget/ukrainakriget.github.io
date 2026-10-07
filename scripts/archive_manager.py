#!/usr/bin/env python3
"""
archive_manager.py
Hanterar automatisk arkivering av händelser i enlighet med kraven i Ukrainakriget.md:
"Dagliga händelser som visats läggs till ett Archive efter en dags visning, 
så att allt det som står på sajten alltid är relevant, även om man besöker den varje dag."
"""

import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
EVENTS_FILE = BASE_DIR / "data" / "output" / "events.json"
ARCHIVE_FILE = BASE_DIR / "data" / "output" / "archive.json"

def parse_iso_datetime(dt_str):
    try:
        # Handles offsets like +02:00
        return datetime.fromisoformat(dt_str)
    except Exception:
        # Fallback to current time if parsing fails
        return datetime.now(timezone.utc)

def run_archive_rotation(retention_hours=24):
    print(f"[{datetime.now().isoformat()}] Kör arkivrotation (gräns: {retention_hours} timmar)...")

    if not EVENTS_FILE.exists():
        print(f"Fel: Hittade inte {EVENTS_FILE}")
        return False

    with open(EVENTS_FILE, "r", encoding="utf-8") as f:
        events_data = json.load(f)

    if ARCHIVE_FILE.exists():
        with open(ARCHIVE_FILE, "r", encoding="utf-8") as f:
            archive_data = json.load(f)
    else:
        archive_data = {"total_archived_events": 0, "events": []}

    archived_events = {e["id"]: e for e in archive_data.get("events", [])}

    current_events = events_data.get("events", [])
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=retention_hours)

    active_kept = []
    moved_count = 0

    for evt in current_events:
        evt_dt = parse_iso_datetime(evt.get("timestamp", ""))
        
        # If older than cutoff, rotate to archive
        if evt_dt < cutoff:
            evt["arkiverad"] = True
            archived_events[evt["id"]] = evt
            moved_count += 1
            print(f"  -> Arkiverade händelse: [{evt['id']}] {evt['title_sv'][:60]}...")
        else:
            evt["arkiverad"] = False
            active_kept.append(evt)

    # Säkerhetsgaranti: Töm aldrig aktiva händelser helt (behåll minst de 3 senaste om tillgängliga)
    min_keep = 3
    if len(active_kept) < min_keep and current_events:
        sorted_by_time = sorted(current_events, key=lambda x: x.get("timestamp", ""), reverse=True)
        for cand in sorted_by_time[:min_keep]:
            if cand not in active_kept:
                cand["arkiverad"] = False
                active_kept.append(cand)
                if cand["id"] in archived_events:
                    del archived_events[cand["id"]]

    # Sort archive descending by timestamp
    sorted_archive = sorted(
        archived_events.values(),
        key=lambda x: x.get("timestamp", ""),
        reverse=True
    )

    archive_data["events"] = sorted_archive
    archive_data["total_archived_events"] = len(sorted_archive)
    archive_data["last_archived_rotation"] = now.isoformat()

    events_data["events"] = active_kept
    events_data["total_active_events"] = len(active_kept)
    events_data["last_updated"] = now.isoformat()
    events_data["update_frequency_hours"] = 0.5

    with open(ARCHIVE_FILE, "w", encoding="utf-8") as f:
        json.dump(archive_data, f, indent=2, ensure_ascii=False)

    with open(EVENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(events_data, f, indent=2, ensure_ascii=False)

    STATS_FILE = BASE_DIR / "data" / "output" / "statistics.json"
    if STATS_FILE.exists():
        try:
            with open(STATS_FILE, "r", encoding="utf-8") as f:
                stats_data = json.load(f)
            stats_data["updated_at"] = now.isoformat()
            with open(STATS_FILE, "w", encoding="utf-8") as f:
                json.dump(stats_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Kunde inte uppdatera statistics.json: {e}")

    print(f"Klar: {moved_count} händelser flyttades till arkivet. {len(active_kept)} händelser kvar som aktiva.")
    return True

if __name__ == "__main__":
    run_archive_rotation()
