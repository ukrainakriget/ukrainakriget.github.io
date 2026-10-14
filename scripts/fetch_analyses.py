#!/usr/bin/env python3
"""
fetch_analyses.py
Insamlare och kurator av expertanalyser och strategiska bedömningar från professionella
svenska, nordiska och internationella militärexperter och tankesmedjor:
- Lars Wilderäng (Cornucopia.se - Operativ lägesbild & doktrin)
- Johan No.1 (Substack - Taktisk och doktrinär militäranalys)
- Anders Puck Nielsen (Forsvarsakademiet Danmark - Nordisk marin- och försvarsstrategi)
- Perun (Försvarsekonomi, ammunitionsproduktion och industriell utnötning)
- War on the Rocks (Michael Kofman m.fl. - Strategisk försvarsanalys)
- Mick Ryan (Generalmajor f.d. - Framtida krigföring och robotik)
- Phillips P. O'Brien (Professor i strategiska studier - Luftkrig och utnötning)
- Tatarigami_UA (Frontelligence Insight - Satellit- och OSINT-granskning)

Funktioner:
- Beständig historik: Befintliga analyser bevaras och slås samman så att tillfälliga nätverksfel aldrig raderar experter.
- Strikt kvalitetskurering: Filtrerar bort personliga inledningshälsningar, insamlingar och partipolitik.
- Tvåspråkigt stöd (sv/en) med hög precision.
"""

import json
import re
import sys
import time
import html
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_FILE = BASE_DIR / "data" / "output" / "analyses.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,sv;q=0.8"
}

def clean_html(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r'<figure[^>]*>.*?</figure>', ' ', raw_html, flags=re.DOTALL)
    text = re.sub(r'<img[^>]*>', ' ', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = html.unescape(text)
    text = re.sub(r'(?i)\b(bild|photo|image|foto):\s*@?\w+[\w./-]*', ' ', text)
    text = re.sub(r'(?i)\b(hi all|hello all|hej alla)[,!.]?\s*', ' ', text)
    text = re.sub(r'(?i)\bsorry it has taken so long[^.!?]*[.!?]\s*', ' ', text)
    text = re.sub(r'(?i)\bledsen att det tagit så lång tid[^.!?]*[.!?]\s*', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def clean_sentence_case(s):
    s = s.strip()
    if not s:
        return ""
    return s[0].upper() + s[1:]

def translate_text(text, sl='en', tl='sv'):
    if not text or not text.strip():
        return ""
    text = text.strip()
    
    t = text
    if sl == 'en' and tl == 'sv':
        t = re.sub(r'\bWildberries\b', 'Wildberries', t)
        t = re.sub(r'\bRussian strike\b', 'Russian attack', t, flags=re.I)
        t = re.sub(r'\bRussian strikes\b', 'Russian attacks', t, flags=re.I)
        t = re.sub(r'\bglide bomb strike\b', 'glide bomb attack', t, flags=re.I)
        t = re.sub(r'\bairstrike\b', 'air attack', t, flags=re.I)
        t = re.sub(r'\bairstrikes\b', 'air attacks', t, flags=re.I)
        t = re.sub(r'\bstrike\b', 'attack', t, flags=re.I)
        t = re.sub(r'\bstrikes\b', 'attacks', t, flags=re.I)
        t = re.sub(r'\bKyiv\b', 'Kyjiv', t)
        t = re.sub(r'\bKharkiv\b', 'Charkiv', t)
        t = re.sub(r'\bSubstack\b', 'Substack', t, flags=re.I)

    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q=" + urllib.parse.quote(t)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    
    result = ""
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                result = ''.join([p[0] for p in data[0] if p and p[0]])
                if result:
                    break
        except Exception:
            time.sleep(0.3)

    if not result:
        result = text

    if tl == 'sv':
        result = re.sub(r'\bKiev\b', 'Kyjiv', result)
        result = re.sub(r'\bKharkiv\b', 'Charkiv', result)
        result = re.sub(r'\bOdessa\b', 'Odesa', result)
        result = re.sub(r'\bvildbär\b', 'Wildberries', result, flags=re.I)
        result = re.sub(r'\bunderstack(en)?\b', 'Substack', result, flags=re.I)
        result = re.sub(r'\bstrejk(en|er|erna)? mot\b', r'attack\1 mot', result, flags=re.I)
        result = clean_sentence_case(result)

    return result

def parse_pub_datetime(pub_str):
    if not pub_str:
        return datetime.now(timezone.utc)
    try:
        return parsedate_to_datetime(pub_str)
    except Exception:
        pass
    try:
        return datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)

def fetch_url(url, timeout=10):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()

def fetch_substack_posts(subdomain, limit=5):
    """Hämtar inlägg från Substack via API eller RSS med fallback."""
    # Metod 1: Substack public JSON API
    api_url = f"https://{subdomain}.substack.com/api/v1/posts?limit={limit}"
    try:
        data_raw = fetch_url(api_url, timeout=8)
        posts = json.loads(data_raw.decode('utf-8'))
        if isinstance(posts, list) and len(posts) > 0:
            formatted = []
            for p in posts:
                formatted.append({
                    "title": (p.get("title") or "").strip(),
                    "link": p.get("canonical_url") or f"https://{subdomain}.substack.com/p/{p.get('slug', '')}",
                    "date_str": (p.get("post_date") or "")[:10],
                    "dt": parse_pub_datetime(p.get("post_date")),
                    "body_html": p.get("body_html") or p.get("description") or ""
                })
            return formatted
    except Exception as e:
        print(f"Substack API misslyckades för {subdomain}: {e}", file=sys.stderr)

    # Metod 2: Substack standard RSS feed
    rss_url = f"https://{subdomain}.substack.com/feed"
    try:
        xml_data = fetch_url(rss_url, timeout=10)
        root = ET.fromstring(xml_data)
        formatted = []
        for it in root.findall(".//item")[:limit]:
            title = (it.find("title").text or "").strip()
            link = (it.find("link").text or "").strip()
            pub_date_str = it.find("pubDate").text if it.find("pubDate") is not None else ""
            dt = parse_pub_datetime(pub_date_str)
            content_el = it.find("{http://purl.org/rss/1.0/modules/content/}encoded")
            raw_content = content_el.text if content_el is not None else (it.find("description").text or "")
            formatted.append({
                "title": title,
                "link": link,
                "date_str": dt.strftime("%Y-%m-%d"),
                "dt": dt,
                "body_html": raw_content
            })
        return formatted
    except Exception as e:
        print(f"Substack RSS misslyckades för {subdomain}: {e}", file=sys.stderr)

    return []

def extract_takeaways(text, lang='sv', max_bullets=3):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    valid_sentences = []
    fluff_terms = [
        'prenumerera', 'klicka här', 'läs mer', 'stödja', 'swish', 'patreon', 'subscribe', 'click here',
        'reader-supported', 'läsarstödd', 'ledsen att det', 'sorry it has taken', 'ursäkta', 'hej alla',
        'hello all', 'hi all', 'sandsäckar', 'bensinpump', 'foto:', 'bild:', 'leave a comment', 'share this'
    ]
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) < 40 or len(s_clean) > 300:
            continue
        if any(ign in s_clean.lower() for ign in fluff_terms):
            continue
        valid_sentences.append(s_clean)
    
    takeaways = []
    for s in valid_sentences[:max_bullets]:
        if lang == 'sv':
            s = clean_sentence_case(s)
        takeaways.append(s)
    return takeaways

def load_existing_analyses():
    """Läser in befintliga analyser per författare för att förhindra databortfall vid tillfälliga nätverksfel."""
    if not OUTPUT_FILE.exists():
        return {}
    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            by_author = {}
            for a in data.get("analyses", []):
                aid = a.get("author_id", "unknown")
                by_author.setdefault(aid, []).append(a)
            return by_author
    except Exception as e:
        print(f"Kunde inte läsa befintlig analyses.json: {e}", file=sys.stderr)
        return {}

def process_cornucopia():
    """
    Hämtar Lars Wilderängs analyser från Cornucopia.se.
    Extraherar LÄGESBILD och Bedömning för att prioritera genuin strategisk doktrinanalys
    framför råa dygnsbulletiner.
    """
    items_out = []
    try:
        xml_data = fetch_url("https://cornucopia.se/feed/", timeout=10)
        root = ET.fromstring(xml_data)
        
        for it in root.findall(".//item"):
            title = (it.find("title").text or "").strip()
            if not (title.lower().startswith("ukraina:") or title.lower().startswith("ukraina ")):
                continue

            link = (it.find("link").text or "").strip()
            pub_date_str = it.find("pubDate").text if it.find("pubDate") is not None else ""
            dt = parse_pub_datetime(pub_date_str)
            iso_date = dt.strftime("%Y-%m-%d")

            content_el = it.find("{http://purl.org/rss/1.0/modules/content/}encoded")
            raw_content = content_el.text if content_el is not None else (it.find("description").text or "")
            
            # Extrahera text ur LÄGESBILD / Bedömning-blocket om det finns
            text = re.sub(r'<[^>]+>', '\n', raw_content)
            text = html.unescape(text)
            
            m_lagesbild = re.search(r'(LÄGESBILD|Lägesbild)\s*(.*?)(Nu följer detaljrapportering|Artikeln uppdateras|Organisationer och projekt|$)', text, flags=re.DOTALL)
            if m_lagesbild:
                block = m_lagesbild.group(2)
                lines = [l.strip() for l in block.split('\n') if l.strip()]
                cleaned_lines = []
                for l in lines:
                    if re.match(r'^(Datum|Läge|Bedömning|\.|\-)\b', l, re.I):
                        continue
                    if len(l) > 30 and not any(ign in l.lower() for ign in ["swish", "patreon", "organisationer"]):
                        cleaned_lines.append(l)
                analysis_body = ' '.join(cleaned_lines)
            else:
                analysis_body = clean_html(raw_content)

            analysis_body = re.sub(r'\s+', ' ', analysis_body).strip()
            if len(analysis_body) < 100:
                continue

            # Sammanfattning av den doktrinära och taktiska bedömningen
            summary_match = re.search(r'^(.{120,450}[.!?])\s', analysis_body)
            summary_sv = summary_match.group(1).strip() if summary_match else analysis_body[:350].rsplit(' ', 1)[0] + '...'

            title_sv = clean_sentence_case(title)
            title_en = translate_text(title_sv, sl='sv', tl='en')
            summary_en = translate_text(summary_sv, sl='sv', tl='en')

            takeaways_sv = extract_takeaways(analysis_body, lang='sv', max_bullets=3)
            takeaways_en = [translate_text(t, sl='sv', tl='en') for t in takeaways_sv]

            items_out.append({
                "id": f"ana-cornucopia-{dt.strftime('%Y%m%d%H%M')}",
                "author_id": "wilderang",
                "author_name": "Lars Wilderäng",
                "author_title_sv": "Militärförfattare och försvarsdebattör (Cornucopia.se)",
                "author_title_en": "Military author and defense commentator (Cornucopia.se)",
                "author_type": "svensk_expert",
                "platform": "Cornucopia.se",
                "date": iso_date,
                "timestamp": dt.isoformat(),
                "title_sv": title_sv,
                "title_en": title_en,
                "summary_sv": summary_sv,
                "summary_en": summary_en,
                "key_takeaways_sv": takeaways_sv,
                "key_takeaways_en": takeaways_en,
                "topics": ["doktrin", "utnötningskrig", "frontlinje", "luftförsvar"],
                "url": link,
                "verified_credibility": "Hög (öppna källor, geolokalisering och daglig operativ lägesbild)"
            })
            if len(items_out) >= 2:
                break
    except Exception as e:
        print(f"Fel vid hämtning av Cornucopia: {e}", file=sys.stderr)
    return items_out

def process_johanno1():
    """Hämtar och kurerar Johan No.1 från Substack och filtrerar bort personliga inledningshälsningar."""
    items_out = []
    try:
        raw_items = fetch_substack_posts("johanno1", limit=6)
        if not raw_items:
            return []

        def clean_johan_content(raw_html):
            text = re.sub(r'<[^>]+>', '\n', raw_html)
            text = html.unescape(text)
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            substantive_lines = []
            fluff_patterns = [
                r'reader-supported', r'prenumerera', r'subscribe', r'röriga inlägg', r'diagnos',
                r'dengamle', r'dubbelstraff', r'kompensation', r'tålamod', r'fredagsmys',
                r'share this post', r'leave a comment', r'Mango Mussolini härjar vidare'
            ]
            for l in lines:
                if any(re.search(pat, l, re.I) for pat in fluff_patterns):
                    continue
                if len(l) > 35:
                    substantive_lines.append(l)
            return ' '.join(substantive_lines)

        sv_posts = []
        en_posts = []
        for it in raw_items:
            cleaned = clean_johan_content(it["body_html"])
            if len(cleaned) < 150:
                continue
            is_sv = any(c in it["title"].lower() for c in ["ä", "ö", "å"]) or bool(re.search(r'\b(vägen|offensiv|rapport|kriget|framgångar|oktober)\b', it["title"].lower()))
            item_data = {
                "title": it["title"],
                "link": it["link"],
                "dt": it["dt"],
                "date_str": it["date_str"],
                "cleaned": cleaned,
                "is_sv": is_sv
            }
            if is_sv:
                sv_posts.append(item_data)
            else:
                en_posts.append(item_data)

        # Skapa kuraterade objekt – prioritera de svenska inläggen och matcha med engelska
        candidates = sv_posts if sv_posts else en_posts
        for p_it in candidates[:2]:
            matching_pair = None
            if p_it["is_sv"]:
                for en_it in en_posts:
                    if abs((en_it["dt"] - p_it["dt"]).total_seconds()) < 172800:
                        matching_pair = en_it
                        break
                
                title_sv = clean_sentence_case(p_it["title"])
                summary_sv_match = re.search(r'^(.{120,450}[.!?])\s', p_it["cleaned"])
                summary_sv = summary_sv_match.group(1).strip() if summary_sv_match else p_it["cleaned"][:350].rsplit(' ', 1)[0] + '...'
                takeaways_sv = extract_takeaways(p_it["cleaned"], lang='sv', max_bullets=3)

                if matching_pair:
                    title_en = clean_sentence_case(matching_pair["title"])
                    summary_en_match = re.search(r'^(.{120,450}[.!?])\s', matching_pair["cleaned"])
                    summary_en = summary_en_match.group(1).strip() if summary_en_match else matching_pair["cleaned"][:350].rsplit(' ', 1)[0] + '...'
                    takeaways_en = extract_takeaways(matching_pair["cleaned"], lang='en', max_bullets=3)
                else:
                    title_en = translate_text(title_sv, sl='sv', tl='en')
                    summary_en = translate_text(summary_sv, sl='sv', tl='en')
                    takeaways_en = [translate_text(t, sl='sv', tl='en') for t in takeaways_sv]
            else:
                title_en = clean_sentence_case(p_it["title"])
                summary_en_match = re.search(r'^(.{120,450}[.!?])\s', p_it["cleaned"])
                summary_en = summary_en_match.group(1).strip() if summary_en_match else p_it["cleaned"][:350].rsplit(' ', 1)[0] + '...'
                takeaways_en = extract_takeaways(p_it["cleaned"], lang='en', max_bullets=3)

                title_sv = translate_text(title_en, sl='en', tl='sv')
                summary_sv = translate_text(summary_en, sl='en', tl='sv')
                takeaways_sv = [translate_text(t, sl='en', tl='sv') for t in takeaways_en]

            items_out.append({
                "id": f"ana-johanno1-{p_it['dt'].strftime('%Y%m%d%H%M')}",
                "author_id": "johanno1",
                "author_name": "Johan No.1",
                "author_title_sv": "Taktisk och doktrinär militäranalytiker (Substack)",
                "author_title_en": "Tactical and doctrinal military analyst (Substack)",
                "author_type": "svensk_expert",
                "platform": "Substack",
                "date": p_it["date_str"],
                "timestamp": p_it["dt"].isoformat(),
                "title_sv": title_sv,
                "title_en": title_en,
                "summary_sv": summary_sv,
                "summary_en": summary_en,
                "key_takeaways_sv": takeaways_sv,
                "key_takeaways_en": takeaways_en,
                "topics": ["frontlinje", "hybridkrig", "droner", "luftförsvar"],
                "url": p_it["link"],
                "verified_credibility": "Hög (djupgående taktisk och doktrinär analys av front- och vapensystem)"
            })
    except Exception as e:
        print(f"Fel vid hämtning av Johan No.1: {e}", file=sys.stderr)
    return items_out

def process_anders_puck():
    """Hämtar och sammanställer strategiska analyser från Anders Puck Nielsen (Forsvarsakademiet Danmark)."""
    items_out = []
    try:
        url = "https://www.youtube.com/feeds/videos.xml?channel_id=UCPPfK7Nq_yQR84rn1wcTXBg"
        xml_data = fetch_url(url, timeout=8)
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom', 'media': 'http://search.yahoo.com/mrss/'}

        for e in root.findall('atom:entry', ns)[:4]:
            title = (e.find('atom:title', ns).text or "").strip()
            link = e.find('atom:link', ns).attrib.get('href', '')
            pub_date_str = e.find('atom:published', ns).text
            dt = parse_pub_datetime(pub_date_str)

            desc_el = e.find('.//media:description', ns)
            desc_text = desc_el.text if desc_el is not None else ""
            cleaned = re.sub(r'https?://\S+', '', desc_text).strip()
            cleaned = re.sub(r'\s+', ' ', cleaned)

            if len(cleaned) < 80:
                continue

            summary_en_match = re.search(r'^(.{100,420}[.!?])\s', cleaned)
            summary_en = summary_en_match.group(1).strip() if summary_en_match else cleaned[:350].rsplit(' ', 1)[0] + '...'

            title_sv = translate_text(title, sl='en', tl='sv')
            summary_sv = translate_text(summary_en, sl='en', tl='sv')

            takeaways_en = extract_takeaways(cleaned, lang='en', max_bullets=3)
            if not takeaways_en:
                takeaways_en = [summary_en]
            takeaways_sv = [translate_text(t, sl='en', tl='sv') for t in takeaways_en]

            items_out.append({
                "id": f"ana-puck-{dt.strftime('%Y%m%d%H%M')}",
                "author_id": "puck_nielsen",
                "author_name": "Anders Puck Nielsen",
                "author_title_sv": "Orlogskaptajn och militäranalytiker vid Forsvarsakademiet i Danmark",
                "author_title_en": "Military analyst at Royal Danish Defence College",
                "author_type": "internationell_expert",
                "platform": "Forsvarsakademiet / Video Brief",
                "date": dt.strftime("%Y-%m-%d"),
                "timestamp": dt.isoformat(),
                "title_sv": clean_sentence_case(title_sv),
                "title_en": clean_sentence_case(title),
                "summary_sv": summary_sv,
                "summary_en": summary_en,
                "key_takeaways_sv": takeaways_sv,
                "key_takeaways_en": takeaways_en,
                "topics": ["strategi", "marin_krigföring", "mobilisering", "eskaleringskontroll"],
                "url": link,
                "verified_credibility": "Mycket hög (ledande nordisk militärstrateg och forskare vid Forsvarsakademiet)"
            })
            if len(items_out) >= 2:
                break
    except Exception as e:
        print(f"Fel vid hämtning av Anders Puck Nielsen: {e}", file=sys.stderr)
    return items_out

def process_perun():
    """Hämtar och sammanställer försvarsekonomiska och industriella analyser från Perun."""
    items_out = []
    try:
        url = "https://www.youtube.com/feeds/videos.xml?channel_id=UCC3ehuUksTyQ7bbjGntmx3Q"
        xml_data = fetch_url(url, timeout=8)
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom', 'media': 'http://search.yahoo.com/mrss/'}

        for e in root.findall('atom:entry', ns)[:4]:
            title = (e.find('atom:title', ns).text or "").strip()
            link = e.find('atom:link', ns).attrib.get('href', '')
            pub_date_str = e.find('atom:published', ns).text
            dt = parse_pub_datetime(pub_date_str)

            desc_el = e.find('.//media:description', ns)
            desc_text = desc_el.text if desc_el is not None else ""
            cleaned = re.sub(r'Sponsored by.*?(https?://\S+|\n|$)', '', desc_text, flags=re.DOTALL)
            cleaned = re.sub(r'https?://\S+', '', cleaned).strip()
            cleaned = re.sub(r'\s+', ' ', cleaned)

            if len(cleaned) < 80:
                continue

            summary_en_match = re.search(r'^(.{100,420}[.!?])\s', cleaned)
            summary_en = summary_en_match.group(1).strip() if summary_en_match else cleaned[:350].rsplit(' ', 1)[0] + '...'

            title_sv = translate_text(title, sl='en', tl='sv')
            summary_sv = translate_text(summary_en, sl='en', tl='sv')

            takeaways_en = extract_takeaways(cleaned, lang='en', max_bullets=3)
            if not takeaways_en:
                takeaways_en = [summary_en]
            takeaways_sv = [translate_text(t, sl='en', tl='sv') for t in takeaways_en]

            items_out.append({
                "id": f"ana-perun-{dt.strftime('%Y%m%d%H%M')}",
                "author_id": "perun",
                "author_name": "Perun",
                "author_title_sv": "Försvars- och materielstrateg specialiserad på krigsekonomi",
                "author_title_en": "Defense economics and military procurement analyst",
                "author_type": "internationell_expert",
                "platform": "Perun Defense Analysis",
                "date": dt.strftime("%Y-%m-%d"),
                "timestamp": dt.isoformat(),
                "title_sv": clean_sentence_case(title_sv),
                "title_en": clean_sentence_case(title),
                "summary_sv": summary_sv,
                "summary_en": summary_en,
                "key_takeaways_sv": takeaways_sv,
                "key_takeaways_en": takeaways_en,
                "topics": ["försvarsekonomi", "ammunitionsproduktion", "logistik", "industriell_kapacitet"],
                "url": link,
                "verified_credibility": "Mycket hög (ledande global referens för försvarsupphandling och logistikkalkyler)"
            })
            if len(items_out) >= 2:
                break
    except Exception as e:
        print(f"Fel vid hämtning av Perun: {e}", file=sys.stderr)
    return items_out

def process_war_on_the_rocks():
    """Hämtar och filtrerar strategiska analyser från War on the Rocks."""
    items_out = []
    try:
        url = "https://warontherocks.com/feed/"
        xml_data = fetch_url(url, timeout=10)
        root = ET.fromstring(xml_data)

        for it in root.findall(".//item"):
            title = (it.find("title").text or "").strip()
            desc = it.find("description").text or ""
            content_el = it.find("{http://purl.org/rss/1.0/modules/content/}encoded")
            raw_content = content_el.text if content_el is not None else desc
            
            combined_text = f"{title} {desc}".lower()
            if not any(k in combined_text for k in ["ukrain", "russia", "putin", "kyiv", "drone", "artillery", "attrition"]):
                continue

            link = (it.find("link").text or "").strip()
            pub_date_str = it.find("pubDate").text if it.find("pubDate") is not None else ""
            dt = parse_pub_datetime(pub_date_str)

            cleaned = clean_html(raw_content)
            summary_en_match = re.search(r'^(.{100,420}[.!?])\s', cleaned)
            summary_en = summary_en_match.group(1).strip() if summary_en_match else cleaned[:350].rsplit(' ', 1)[0] + '...'

            title_sv = translate_text(title, sl='en', tl='sv')
            summary_sv = translate_text(summary_en, sl='en', tl='sv')

            takeaways_en = extract_takeaways(cleaned, lang='en', max_bullets=3)
            takeaways_sv = [translate_text(t, sl='en', tl='sv') for t in takeaways_en]

            items_out.append({
                "id": f"ana-wotr-{dt.strftime('%Y%m%d%H%M')}",
                "author_id": "warontherocks",
                "author_name": "War on the Rocks",
                "author_title_sv": "Strategisk och militärteknisk analysorganisation (Michael Kofman m.fl.)",
                "author_title_en": "Defense and security analysis forum",
                "author_type": "internationell_expert",
                "platform": "War on the Rocks",
                "date": dt.strftime("%Y-%m-%d"),
                "timestamp": dt.isoformat(),
                "title_sv": clean_sentence_case(title_sv),
                "title_en": clean_sentence_case(title),
                "summary_sv": summary_sv,
                "summary_en": summary_en,
                "key_takeaways_sv": takeaways_sv,
                "key_takeaways_en": takeaways_en,
                "topics": ["strategi", "doktrin", "vapensystem", "försvarsallianser"],
                "url": link,
                "verified_credibility": "Mycket hög (ledande amerikansk tankesmedja och försvarsforum)"
            })
            if len(items_out) >= 2:
                break
    except Exception as e:
        print(f"Fel vid hämtning av War on the Rocks: {e}", file=sys.stderr)
    return items_out

def process_mick_ryan():
    """Hämtar och översätter analyser från generalmajor Mick Ryan."""
    items_out = []
    try:
        raw_items = fetch_substack_posts("mickryan", limit=5)
        for it in raw_items:
            title = it["title"]
            lower_title = title.lower()
            if not any(k in lower_title for k in ["ukrain", "robot", "drone", "air", "assault", "war", "russia", "military", "strategy"]):
                continue

            cleaned = clean_html(it["body_html"])
            summary_en_match = re.search(r'^(.{100,420}[.!?])\s', cleaned)
            summary_en = summary_en_match.group(1).strip() if summary_en_match else cleaned[:350].rsplit(' ', 1)[0] + '...'

            title_sv = translate_text(title, sl='en', tl='sv')
            summary_sv = translate_text(summary_en, sl='en', tl='sv')

            takeaways_en = extract_takeaways(cleaned, lang='en', max_bullets=3)
            takeaways_sv = [translate_text(t, sl='en', tl='sv') for t in takeaways_en]

            items_out.append({
                "id": f"ana-mickryan-{it['dt'].strftime('%Y%m%d%H%M')}",
                "author_id": "mickryan",
                "author_name": "Mick Ryan",
                "author_title_sv": "Generalmajor (f.d.), militärstrateg och författare",
                "author_title_en": "Major General (Retd), military strategist and author",
                "author_type": "internationell_expert",
                "platform": "Futura Doctrina / Substack",
                "date": it["date_str"],
                "timestamp": it["dt"].isoformat(),
                "title_sv": clean_sentence_case(title_sv),
                "title_en": clean_sentence_case(title),
                "summary_sv": summary_sv,
                "summary_en": summary_en,
                "key_takeaways_sv": takeaways_sv,
                "key_takeaways_en": takeaways_en,
                "topics": ["robotik", "autonoma_system", "doktrin", "militärstrategi"],
                "url": it["link"],
                "verified_credibility": "Mycket hög (tidigare general och militärdoktrinforskare)"
            })
            if len(items_out) >= 2:
                break
    except Exception as e:
        print(f"Fel vid hämtning av Mick Ryan: {e}", file=sys.stderr)
    return items_out

def process_phillips_obrien():
    """Hämtar och översätter analyser från professor Phillips P. O'Brien."""
    items_out = []
    try:
        raw_items = fetch_substack_posts("phillipspobrien", limit=5)
        for it in raw_items:
            title = it["title"]
            if any(ign in title.lower() for ign in ["second try", "resend", "test"]):
                continue

            cleaned = clean_html(it["body_html"])
            summary_en_match = re.search(r'^(.{100,420}[.!?])\s', cleaned)
            summary_en = summary_en_match.group(1).strip() if summary_en_match else cleaned[:350].rsplit(' ', 1)[0] + '...'

            title_sv = translate_text(title, sl='en', tl='sv')
            summary_sv = translate_text(summary_en, sl='en', tl='sv')

            takeaways_en = extract_takeaways(cleaned, lang='en', max_bullets=3)
            takeaways_sv = [translate_text(t, sl='en', tl='sv') for t in takeaways_en]

            items_out.append({
                "id": f"ana-obrien-{it['dt'].strftime('%Y%m%d%H%M')}",
                "author_id": "obrien",
                "author_name": "Phillips P. O'Brien",
                "author_title_sv": "Professor i strategiska studier vid University of St Andrews",
                "author_title_en": "Professor of Strategic Studies at University of St Andrews",
                "author_type": "internationell_expert",
                "platform": "Substack",
                "date": it["date_str"],
                "timestamp": it["dt"].isoformat(),
                "title_sv": clean_sentence_case(title_sv),
                "title_en": clean_sentence_case(title),
                "summary_sv": summary_sv,
                "summary_en": summary_en,
                "key_takeaways_sv": takeaways_sv,
                "key_takeaways_en": takeaways_en,
                "topics": ["luftkrig", "utmattningskrig", "logistik", "strategi"],
                "url": it["link"],
                "verified_credibility": "Mycket hög (ledande akademisk expert på luftmakt och logistik)"
            })
            if len(items_out) >= 2:
                break
    except Exception as e:
        print(f"Fel vid hämtning av Phillips O'Brien: {e}", file=sys.stderr)
    return items_out

def process_tatarigami():
    """Hämtar och sammanställer Frontelligence Insight (Tatarigami) om ryska logistikknutar och satellitfynd."""
    items_out = []
    try:
        raw_items = fetch_substack_posts("tatarigami", limit=5)
        for it in raw_items:
            title = it["title"]
            cleaned = clean_html(it["body_html"])
            summary_en_match = re.search(r'^(.{100,420}[.!?])\s', cleaned)
            summary_en = summary_en_match.group(1).strip() if summary_en_match else cleaned[:350].rsplit(' ', 1)[0] + '...'

            title_sv = translate_text(title, sl='en', tl='sv')
            summary_sv = translate_text(summary_en, sl='en', tl='sv')

            takeaways_en = extract_takeaways(cleaned, lang='en', max_bullets=3)
            takeaways_sv = [translate_text(t, sl='en', tl='sv') for t in takeaways_en]

            items_out.append({
                "id": f"ana-tatarigami-{it['dt'].strftime('%Y%m%d%H%M')}",
                "author_id": "tatarigami",
                "author_name": "Tatarigami_UA (Frontelligence Insight)",
                "author_title_sv": "Ukrainsk reservofficer, grundare av Frontelligence Insight",
                "author_title_en": "Ukrainian reserve officer, founder of Frontelligence Insight",
                "author_type": "osint_analytiker",
                "platform": "Frontelligence Insight",
                "date": it["date_str"],
                "timestamp": it["dt"].isoformat(),
                "title_sv": clean_sentence_case(title_sv),
                "title_en": clean_sentence_case(title),
                "summary_sv": summary_sv,
                "summary_en": summary_en,
                "key_takeaways_sv": takeaways_sv,
                "key_takeaways_en": takeaways_en,
                "topics": ["satellitanalys", "ammunition", "logistik", "depaer"],
                "url": it["link"],
                "verified_credibility": "Högsta OSINT-klass (satellitbildsverifiering av GRAU-arsenaler och logistik)"
            })
            if len(items_out) >= 2:
                break
    except Exception as e:
        print(f"Fel vid hämtning av Tatarigami: {e}", file=sys.stderr)
    return items_out

def merge_author_items(new_items, author_id, existing_by_author, max_items=2):
    """
    Kombinerar nya hämtade objekt med historiskt sparade objekt för författaren.
    Garanterar att författaren aldrig försvinner om en RSS/API-hämtning misslyckas.
    """
    existing_items = existing_by_author.get(author_id, [])
    if not new_items:
        if existing_items:
            print(f"  -> Använder {len(existing_items)} tidigare sparade analyser för {author_id} (fallback)")
        return existing_items[:max_items]

    # Slå samman och undvik dubbletter på URL eller ID
    merged = list(new_items)
    seen_urls = {item.get("url") for item in merged if item.get("url")}
    for ex in existing_items:
        if ex.get("url") not in seen_urls and len(merged) < max_items:
            merged.append(ex)
            seen_urls.add(ex.get("url"))

    return merged[:max_items]

def run_analyses_collection():
    print("=== Samlar in analyser från professionella militärexperter och strateger ===")
    existing_by_author = load_existing_analyses()
    all_analyses = []

    # 1. Lars Wilderäng (Cornucopia.se) - Operativ lägesbild och doktrin
    print("Bearbetar Cornucopia.se (Lars Wilderäng - Lägesbild och bedömning)...")
    c_items = merge_author_items(process_cornucopia(), "wilderang", existing_by_author)
    print(f"  -> {len(c_items)} analyser från Lars Wilderäng")
    all_analyses.extend(c_items)

    # 2. Johan No.1 (Substack) - Taktisk och doktrinär militäranalys
    print("Bearbetar Johan No.1 Substack...")
    j_items = merge_author_items(process_johanno1(), "johanno1", existing_by_author)
    print(f"  -> {len(j_items)} analyser från Johan No.1")
    all_analyses.extend(j_items)

    # 3. Anders Puck Nielsen (Forsvarsakademiet Danmark)
    print("Bearbetar Anders Puck Nielsen (Forsvarsakademiet Danmark)...")
    p_items = merge_author_items(process_anders_puck(), "puck_nielsen", existing_by_author)
    print(f"  -> {len(p_items)} analyser från Anders Puck Nielsen")
    all_analyses.extend(p_items)

    # 4. Perun (Försvarsekonomi och doktrin)
    print("Bearbetar Perun (Försvarsekonomi och logistik)...")
    pr_items = merge_author_items(process_perun(), "perun", existing_by_author)
    print(f"  -> {len(pr_items)} analyser från Perun")
    all_analyses.extend(pr_items)

    # 5. War on the Rocks (Michael Kofman m.fl.)
    print("Bearbetar War on the Rocks...")
    w_items = merge_author_items(process_war_on_the_rocks(), "warontherocks", existing_by_author)
    print(f"  -> {len(w_items)} analyser från War on the Rocks")
    all_analyses.extend(w_items)

    # 6. Mick Ryan (Futura Doctrina)
    print("Bearbetar Mick Ryan...")
    m_items = merge_author_items(process_mick_ryan(), "mickryan", existing_by_author)
    print(f"  -> {len(m_items)} analyser från Mick Ryan")
    all_analyses.extend(m_items)

    # 7. Phillips P. O'Brien (St Andrews)
    print("Bearbetar Phillips P. O'Brien...")
    o_items = merge_author_items(process_phillips_obrien(), "obrien", existing_by_author)
    print(f"  -> {len(o_items)} analyser från Phillips P. O'Brien")
    all_analyses.extend(o_items)

    # 8. Tatarigami (Frontelligence Insight)
    print("Bearbetar Tatarigami (Frontelligence Insight)...")
    t_items = merge_author_items(process_tatarigami(), "tatarigami", existing_by_author)
    print(f"  -> {len(t_items)} analyser från Tatarigami")
    all_analyses.extend(t_items)

    # Sortera alla efter tidsstämpel fallande
    all_analyses.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    result_doc = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_count": len(all_analyses),
        "analyses": all_analyses
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result_doc, f, ensure_ascii=False, indent=2)

    print(f"Sparade totalt {len(all_analyses)} kuraterade expertanalyser till {OUTPUT_FILE}")
    return result_doc

if __name__ == "__main__":
    run_analyses_collection()
