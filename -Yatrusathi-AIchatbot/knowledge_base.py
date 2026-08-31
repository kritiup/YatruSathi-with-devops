"""
YatruSathi Knowledge Base — v2
District-based Nepal travel data from CSV + curated popular data.
"""
import csv
import os
import re
from difflib import get_close_matches
from typing import List, Dict, Tuple, Optional
from collections import defaultdict

# ── CSV path ──────────────────────────────────────────────────────────────────
_CSV_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "Data Collection form (Responses) - Form Responses 1.csv",
)

# ── Column header mapping ────────────────────────────────────────────────────
COL = {
    "type":        "What type of hidden gem are you sharing?",
    "district":    "Which district or region of Nepal is this related to?",
    "food":        "Name of the local food or dish.\n(Iike Newari food, thai, any local dish)",
    "food_known":  "How well-known is this food?\n",
    "food_where":  "Where can visitors find it?",
    "food_season": "Best time or season\n(spring, summer, autumn (fall), and winter)",
    "food_why":    "Why do you recommend this food to visitors?\n",
    "place":       "Name of place",
    "place_type":  "Type of place",
    "place_why":   " Why is it special but not famous?\n(In your opinions)",
    "visit_time":  "Best time to visit",
    "activities":  "Activities possible",
    "culture":     "Name of culture or tradition",
    "culture_when":"When does it take place?",
    "outsiders":   "Can outsiders participate?",
    "culture_why": "Why should travelers experience this?",
    "suitability": "Suitability for travelers",
    "tips":        "Tips or precautions",
    "rating":      "Rating",
    "pitch":       "In one sentence, why should you feature this?",
}

# ── District name normalization ──────────────────────────────────────────────
_DISTRICT_ALIASES = {
    "ktm": "kathmandu", "bhakatapur": "bhaktapur",
    "kaplivastu": "kapilvastu", "kapilvastu district": "kapilvastu",
    "district rupandehi": "rupandehi", "rupandehi district": "rupandehi",
    "lumbini province ( rupandehi district)": "rupandehi",
    "butwal": "rupandehi", "bhairahawa": "rupandehi",
    "parasi": "nawalparasi", "nawalparasi east": "nawalparasi",
    "nawalparasi west": "nawalparasi", "nawalpur": "nawalparasi",
    "bardaghat susta east": "nawalparasi", "bardaghat susta west": "nawalparasi",
    "rukum east": "rukum", "rukum west": "rukum",
    "dharan": "sunsari", "itahari": "sunsari",
    "biratnagar": "morang", "janakpur": "dhanusha",
    "birgunj": "parsa", "hetauda": "makwanpur",
    "nepalgunj": "banke", "gulariya": "bardiya",
    "birendranagar": "surkhet", "sankhuwashava": "sankhuwasabha",
    "arghakhachi": "arghakhanchi",
    "palpa district, lumbini province, nepal": "palpa",
    "jhapa district :a place close to your heart, rich in local culture and lesser-known spots that deserve poetic attention.": "jhapa",
    "jhapa district koshi province": "jhapa",
    "ilam district, koshi province": "ilam",
    "lunbibi": "lumbini", "kalaiya": "bara",
    "hilly region": "hills", "terai region": "terai", "terai": "terai",
    "eastern": "eastern nepal", "gandaki province": "gandaki",
    "karnali province": "karnali",
    "pokhara": "kaski",
    "bandipur": "tanahun", "dumre": "tanahun", "damauli": "tanahun",
    "kushma": "parbat", "bungee": "parbat",
    "tansen": "palpa", "rani mahal": "palpa",
    "besisahar": "lamjung", "ghalegaun": "lamjung",
    "jomsom": "mustang", "muktinath": "mustang", "marpha": "mustang", "lo manthang": "mustang",
    "beni": "myagdi", "poon hill": "myagdi", "ghorepani": "myagdi",
    "manakamana": "gorkha",
    "kanyam": "ilam",
    "everest": "solukhumbu", "ebc": "solukhumbu", "namche": "solukhumbu", "lukla": "solukhumbu",
}

def _normalize_district(raw: str) -> str:
    s = raw.strip().lower()
    if not s or s == "lol":
        return ""
    return _DISTRICT_ALIASES.get(s, s)


# ── Quality filter for survey text ───────────────────────────────────────────
_JUNK_TEXTS = {
    "yes", "no", "nice", "good", "ok", "okay", "fine", "tasty", "mitho",
    "famous", "beautiful", "amazing", "awesome", "cool", "lovely",
    "not any", "no tips", "precautions", "goggle map", "google map",
    "not applicable", "n/a", "na", "none", "nothing", "nope",
    "lol", "idk", "dunno", "authentic food", "authentic", "it's best!",
    "scenic view", "it's goooooooood", "be happy", "chill, enjoy and eat",
}

def _is_quality_text(text: str, min_len: int = 20) -> bool:
    """Check if a survey text entry meets minimum quality for display."""
    if not text:
        return False
    clean = text.strip().lower()
    if clean in _JUNK_TEXTS:
        return False
    if len(clean) < min_len:
        return False
    # Detect gibberish: low ratio of dictionary-like words
    words = re.findall(r"[a-z]+", clean)
    if not words:
        return False
    return True


def _is_valid_name(name: str, max_len: int = 60) -> bool:
    """Check if a food/place/culture name looks like a real name (not a free-text dump)."""
    if not name or len(name) > max_len:
        return False
    # Skip if it contains typical sentence patterns (multiple verbs/articles in a row)
    lower = name.lower()
    if any(p in lower for p in ["because ", "i think ", "we can ", "mostly ", "it is "]):
        return False
    return True


def _detect_category(query: str):
    """Detect if the query focuses on a specific category (food/place/culture)."""
    q = query.lower()
    food_kw = {"food", "eat", "dish", "cuisine", "restaurant", "taste", "momo",
               "dal", "bhat", "thali", "drink", "tea", "coffee", "snack", "meal",
               "breakfast", "lunch", "dinner", "tongba", "sel", "roti", "recipe"}
    place_kw = {"place", "places", "visit", "see", "trek", "trekking", "hike",
                "temple", "lake", "park", "viewpoint", "sight", "destination",
                "attraction", "travel", "go", "explore", "hidden", "gem", "spots"}
    culture_kw = {"culture", "cultural", "festival", "tradition", "dance",
                  "celebration", "heritage", "custom", "ritual", "ceremony"}

    tokens = set(re.findall(r"\b\w+\b", q))
    scores = {
        "food": len(tokens & food_kw),
        "place": len(tokens & place_kw),
        "culture": len(tokens & culture_kw),
    }
    best = max(scores, key=scores.get)
    if scores[best] > 0:
        return best
    return None  # general query


# ── Load CSV ─────────────────────────────────────────────────────────────────
def _load_csv() -> List[Dict]:
    rows = []
    try:
        with open(_CSV_PATH, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                row["_district"] = _normalize_district(row.get(COL["district"], ""))
                rows.append(row)
    except FileNotFoundError:
        print(f"[KB] WARNING: CSV not found at {_CSV_PATH}")
    return rows

_DATA: List[Dict] = _load_csv()

# ── Build district index ─────────────────────────────────────────────────────
_BY_DISTRICT: Dict[str, List[Dict]] = defaultdict(list)
for _row in _DATA:
    d = _row["_district"]
    if d:
        _BY_DISTRICT[d].append(_row)


# ══════════════════════════════════════════════════════════════════════════════
#  VERIFIED NEPAL DATA — ALL 77 DISTRICTS
#  (Nawalparasi East/West combined as "nawalparasi", Rukum East/West as "rukum")
#  Sources: Nepal Tourism Board, UNESCO, Lonely Planet Nepal, verified local info
# ══════════════════════════════════════════════════════════════════════════════
POPULAR_DATA: Dict[str, Dict] = {

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  KOSHI PROVINCE (Province 1) — 14 districts                        ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    "taplejung": {
        "foods": [
            {"name": "Tongba (Millet Beer)", "where": "Local homes and lodges", "why": "Traditional Limbu/Rai fermented millet drink, served in a wooden dhungro", "season": "All year, best in winter"},
            {"name": "Sel Roti & Kinema", "where": "Local eateries", "why": "Sel roti (rice doughnut) paired with fermented soybean (kinema) curry", "season": "All year"},
        ],
        "places": [
            {"name": "Kanchenjunga Base Camp", "type": "Trekking", "why": "Trek to the base of the world's 3rd highest peak (8586m), remote and pristine", "time": "Oct-Nov, Mar-May"},
            {"name": "Pathibhara Devi Temple", "type": "Religious", "why": "Famous hilltop temple with panoramic Himalayan views, sacred to Hindus", "time": "Oct-Nov, Mar-Apr"},
        ],
        "culture": [{"name": "Limbu Culture & Chasok Tangnam", "when": "Dec", "why": "Limbu harvest festival with traditional dances, Tongba celebrations, and rituals"}],
        "tips": "Remote area — limited ATMs and phone coverage. Kanchenjunga trek requires special permits. Fly to Suketar or bus via Ilam.",
    },
    "panchthar": {
        "foods": [
            {"name": "Tongba", "where": "Local homes, small teashops", "why": "Signature Limbu millet beer, warm and comforting in the cold hills", "season": "All year"},
            {"name": "Wachipa (Limbu Rice Dish)", "where": "Local Limbu households", "why": "Traditional rice dish served during Limbu celebrations", "season": "Festival seasons"},
        ],
        "places": [
            {"name": "Phidim Bazaar", "type": "Town", "why": "District headquarters with pleasant climate, gateway to eastern hills", "time": "Oct-Mar"},
            {"name": "Kanchenjunga Viewpoint", "type": "Viewpoint", "why": "Clear views of Kanchenjunga range from Phidim and surrounding ridges", "time": "Oct-Nov mornings"},
        ],
        "culture": [{"name": "Limbu Mundhum Culture", "when": "Year-round", "why": "Ancient oral tradition of the Limbu people, rich in mythology and nature worship"}],
        "tips": "Bus from Birtamod (~6 hrs). Cool climate year-round. Good base for exploring eastern Nepal.",
    },
    "ilam": {
        "foods": [
            {"name": "Ilam Tea", "where": "Tea gardens, Kanyam tea shops, local markets", "why": "Nepal's answer to Darjeeling — fragrant orthodox black and green teas grown on rolling green hillsides. Visit the gardens, watch the plucking and processing, and taste fresh-brewed cups straight from the estate. Tea enthusiasts say Ilam teas rival their Indian neighbors across the border", "season": "Mar-Nov for gardens, tea available all year"},
            {"name": "Dhido with Gundruk & Local Chicken", "where": "Local eateries in Ilam Bazaar", "why": "Traditional Nepali staple — thick maize or millet porridge served with fermented leafy greens (gundruk, a uniquely Nepali flavor) and free-range chicken curry. Hearty, wholesome, and authentically hill Nepali", "season": "All year"},
            {"name": "Tongba", "where": "Local Limbu restaurants and homes", "why": "Warm fermented millet beer sipped through a bamboo straw from a wooden vessel. A Limbu tradition — hot water is poured over the fermented millet and you sip slowly. Perfect for cold evenings in the hills", "season": "All year, best in winter"},
        ],
        "places": [
            {"name": "Kanyam Tea Garden", "type": "Nature/Agriculture", "why": "Sweeping green tea terraces stretching across the hills, often compared to Sri Lanka or Darjeeling but far less crowded. Walk through the neatly clipped tea bushes, photograph the pluckers in their colorful clothes, and buy some of Nepal's finest tea directly from the estate", "time": "Mar-May, Sep-Nov for lush green gardens"},
            {"name": "Mai Pokhari", "type": "Lake/Wetland/UNESCO", "why": "A Ramsar-listed sacred lake at 2100m surrounded by dense forest and rhododendrons. Sacred to the local community, serene and atmospheric — a beautiful half-day trip from Ilam", "time": "Oct-Nov for clear skies"},
            {"name": "Antu Danda", "type": "Viewpoint", "why": "The first place in Nepal to see the sunrise. On a clear morning, watch the sun rise over the Kanchenjunga massif (the world's third-highest peak) and illuminate the eastern Himalayan panorama. Absolutely worth the early wake-up", "time": "Oct-Feb for clearest sunrise"},
        ],
        "culture": [{"name": "Limbu Culture & Traditions", "when": "Year-round", "why": "The eastern hills are the heartland of the Limbu people — one of Nepal's most culturally rich indigenous groups. Their ancient oral traditions (Mundhum), traditional dances, fermented foods, and warm hospitality make Ilam a cultural as well as scenic destination"}],
        "tips": "Ilam is in far-eastern Nepal, best reached from Birtamod (1.5 hrs drive) which connects to Kathmandu by bus or Bhadrapur by air. Carry warm clothes — it gets chilly above 1500m. Limited ATMs; bring cash. Buy authentic Ilam tea directly from the gardens — it's much cheaper and fresher than what you'll find in Kathmandu. Best combined with Panchthar or Taplejung for a complete eastern Nepal experience.",
    },
    "jhapa": {
        "foods": [
            {"name": "Machha Bhaat (Fish Rice)", "where": "Local restaurants in Birtamod, Damak", "why": "Freshwater fish with rice — Terai specialty from local ponds and rivers", "season": "All year"},
            {"name": "Sukuti (Dried Meat)", "where": "Local eateries", "why": "Sun-dried buffalo/goat meat, popular snack across eastern Terai", "season": "Winter best"},
        ],
        "places": [
            {"name": "Birtamod", "type": "Town/Transit", "why": "Major transit hub connecting eastern Nepal, Kakarbhitta border crossing to India", "time": "Oct-Mar"},
            {"name": "Satashi Dhaam", "type": "Religious", "why": "Famous temple complex at the confluence of multiple rivers", "time": "All year"},
            {"name": "Domukha Dham", "type": "Religious/Nature", "why": "Sacred confluence of Kankai and Mechi rivers, picnic spot", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Rajbanshi Culture", "when": "Year-round", "why": "Indigenous Rajbanshi community with unique dialect, music, and Bhawaiya songs"}],
        "tips": "Hot and humid in summer. Gateway to Ilam and eastern hills. Good road connectivity.",
    },
    "morang": {
        "foods": [
            {"name": "Bara & Chatamari", "where": "Newari restaurants in Biratnagar", "why": "Newari communities settled here bring their signature snacks", "season": "All year"},
            {"name": "Fish Curry (Machha Jhol)", "where": "Local restaurants", "why": "Freshwater fish from Koshi river system, Terai-style curry", "season": "All year"},
        ],
        "places": [
            {"name": "Biratnagar", "type": "City", "why": "Nepal's 2nd largest city, industrial hub, Koshi Tappu access point", "time": "Oct-Mar"},
            {"name": "Koshi Tappu Wildlife Reserve", "type": "Wildlife/Nature", "why": "Wild water buffalo, 500+ bird species, Sapta Koshi river, birding paradise", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Chhath Parva", "when": "Oct-Nov", "why": "Maithili/Terai community's grand sun worship festival at ponds and rivers"}],
        "tips": "Biratnagar has domestic airport. Very hot in summer. Koshi Tappu best for birdwatching Nov-Feb.",
    },
    "sunsari": {
        "foods": [
            {"name": "Sel Roti & Achar", "where": "Street vendors in Dharan, Itahari", "why": "Ring-shaped fried rice bread with spicy tomato pickle — street food staple", "season": "All year, festivals"},
            {"name": "Thakali Thali", "where": "Dharan restaurants", "why": "Dharan is famous for diverse food scene — Thakali, Newari, Rai cuisines", "season": "All year"},
        ],
        "places": [
            {"name": "Dharan", "type": "Hill Town", "why": "Beautiful foothill city, gateway to Koshi hills, vibrant food scene", "time": "Oct-Apr"},
            {"name": "Pindeshwor Temple", "type": "Religious", "why": "Ancient Shiva temple, one of the oldest in eastern Nepal", "time": "All year"},
            {"name": "Bhedetar", "type": "Viewpoint", "why": "Hill station above Dharan with views of Terai plains and mountains", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Udhauli/Ubhauli", "when": "Dec/Jun", "why": "Kirat Rai festivals celebrating seasonal migration — traditional dances and Tongba"}],
        "tips": "Dharan is well-connected by bus. Pleasant hill climate. Good base for eastern treks.",
    },
    "dhankuta": {
        "foods": [
            {"name": "Dhankuta Ko Topi (Nepali Cap)", "where": "Local market", "why": "Famous for Dhaka topi weaving — while not food, the local Thali is authentic", "season": "All year"},
            {"name": "Local Rai/Limbu cuisine", "where": "Local eateries", "why": "Kinema curry, Dhido, and authentic indigenous flavors", "season": "All year"},
        ],
        "places": [
            {"name": "Hile Bazaar", "type": "Town/Market", "why": "Charming hilltop bazaar with Himalayan views, gateway to Arun Valley", "time": "Oct-Mar"},
            {"name": "Dhankuta Bazaar", "type": "Heritage Town", "why": "Famous for Dhaka fabric weaving, narrow alleys, panoramic hill views", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Dhaka Weaving", "when": "Year-round", "why": "Traditional hand-woven Dhaka fabric used for topi and shawls — UNESCO intangible heritage candidate"}],
        "tips": "Bus from Dharan (2 hrs). Cool climate. Buy authentic Dhaka products directly from weavers.",
    },
    "terhathum": {
        "foods": [
            {"name": "Tongba & Kinema", "where": "Local Limbu homes and eateries", "why": "Authentic Limbu/Rai fermented millet drink and soybean preparation", "season": "All year"},
        ],
        "places": [
            {"name": "Terhathum Bazaar", "type": "Heritage Town", "why": "Quaint hilltop bazaar with traditional houses and stunning views", "time": "Oct-Mar"},
            {"name": "Milke Danda", "type": "Viewpoint/Trek", "why": "Rhododendron trail with views of Makalu, Everest, and Kanchenjunga", "time": "Mar-Apr (rhododendron bloom)"},
        ],
        "culture": [{"name": "Rai Cultural Traditions", "when": "Year-round", "why": "Rich Rai ceremony traditions, Sakela dance, and nature worship"}],
        "tips": "Off the beaten path. Bus from Dharan via Dhankuta. Good for trekkers seeking solitude.",
    },
    "sankhuwasabha": {
        "foods": [
            {"name": "Dhido & Gundruk", "where": "Teahouses on Makalu trek", "why": "Traditional high-altitude comfort food, buckwheat dhido in upper areas", "season": "All year"},
        ],
        "places": [
            {"name": "Makalu Base Camp", "type": "Trekking", "why": "Trek to world's 5th highest peak (8485m), remote and spectacular", "time": "Oct-Nov, Mar-May"},
            {"name": "Arun Valley", "type": "Nature", "why": "Dramatic river valley with diverse flora, waterfalls, and ethnic villages", "time": "Oct-Apr"},
            {"name": "Khandbari", "type": "Town", "why": "District HQ, gateway to Makalu, traditional Rai/Limbu town", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Rai & Sherpa Culture", "when": "Year-round", "why": "Mix of Rai, Limbu, and Sherpa communities with distinct traditions"}],
        "tips": "Makalu trek is very remote — carry supplies. Fly to Tumlingtar. Special permits needed.",
    },
    "bhojpur": {
        "foods": [
            {"name": "Bhojpuri Khukuri Dal Bhat", "where": "Local eateries", "why": "Traditional Rai/Brahmin meal with local lentils and seasonal vegetables", "season": "All year"},
        ],
        "places": [
            {"name": "Bhojpur Bazaar", "type": "Heritage Town", "why": "Famous for khukuri (Gurkha knife) craftsmanship, classic hilltop town", "time": "Oct-Mar"},
            {"name": "Taksar", "type": "Village", "why": "Historic blacksmith village where authentic khukuris are handcrafted", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Rai Culture & Khukuri Craft", "when": "Year-round", "why": "Bhojpur is the origin of the famous Gurkha khukuri — watch master blacksmiths at work"}],
        "tips": "Remote hill district. Bus from Hile (5-6 hrs rough road). Buy authentic khukuri from local artisans.",
    },
    "solukhumbu": {
        "foods": [
            {"name": "Sherpa Stew (Shyakpa)", "where": "Teahouses on the Everest Base Camp trek, especially Namche and Tengboche", "why": "A hearty high-altitude stew of potatoes, vegetables, and sometimes yak meat in a rich broth. Sherpa comfort food that warms you to the bone after a cold day of trekking", "season": "Oct-Nov, Mar-May (trekking seasons)"},
            {"name": "Dal Bhat Power", "where": "Every teahouse on the EBC trek", "why": "'Dal bhat power, 24 hour!' — the famous trekker's motto. Unlimited refills of rice, lentil soup, and curried vegetables keep you fueled for days of walking. It's the most economical and energy-packed meal on the trail", "season": "All year"},
            {"name": "Yak Cheese & Butter Tea", "where": "Namche Bazaar, Kyanjin-style cheese factory, upper lodges", "why": "At these altitudes, yak products are essential — try the local yak cheese (similar to a firm cheddar) and warm salty butter tea. The Khumbu Cheese Factory in the area produces excellent cheese", "season": "Oct-Nov, Mar-May"},
        ],
        "places": [
            {"name": "Everest Base Camp Trek", "type": "Trekking/Iconic", "why": "The world's most iconic trek — 12-14 days through Sherpa villages, across suspension bridges draped with prayer flags, past glacial rivers to the foot of Sagarmatha (8849m). Standing at Base Camp (5364m) with the Khumbu Icefall towering above is a life-changing moment", "time": "Oct-Nov (clearest skies), Mar-May (spring, rhododendrons)"},
            {"name": "Namche Bazaar", "type": "Town/Market", "why": "The Sherpa capital clinging to a horseshoe-shaped hillside at 3440m — colorful Saturday market (where Tibetan traders still come), cozy bakeries, gear shops, and stunning Kongde and Thamserku views. The essential acclimatization stop", "time": "Oct-Nov main season"},
            {"name": "Tengboche Monastery", "type": "Religious/Cultural", "why": "Nepal's most famous monastery, perched on a ridge with Everest, Ama Dablam, and Nuptse rising behind it. Attend the evening prayer ceremony for a deeply spiritual experience. The Mani Rimdu festival here in Oct-Nov features sacred masked dances", "time": "Oct-Nov, especially Mani Rimdu"},
            {"name": "Gokyo Lakes", "type": "Lake/Trek", "why": "A chain of stunning turquoise glacial lakes at 4700-5000m, with views of four 8000m peaks from Gokyo Ri. A spectacular alternative (or addition) to the EBC trek, with fewer crowds", "time": "Oct-Nov, Mar-May"},
        ],
        "culture": [{"name": "Mani Rimdu Festival", "when": "Oct-Nov at Tengboche Monastery", "why": "A sacred Sherpa Buddhist festival spanning three days of masked dances, religious ceremonies, and blessings. Monks perform elaborate dances representing the triumph of Buddhism over the ancient Bon religion. Having this as a backdrop to your trek is extraordinary"}],
        "tips": "Fly Kathmandu→Lukla (NPR 15000-20000, 25 min) — book early in peak season. Alternatively, fly to Ramechhap Airport for more reliable departures. Carry altitude sickness medication (Diamox). Acclimatize properly — never ascend more than 300-500m sleeping altitude per day above 3000m. Permits: Sagarmatha NP entry NPR 3000 + TIMS card. If you don't have time for the full trek, scenic mountain flights from Kathmandu (NPR 12000-18000) offer incredible Everest views.",
    },
    "okhaldhunga": {
        "foods": [
            {"name": "Local Dal Bhat with Gundruk", "where": "Local eateries", "why": "Authentic rural Nepali meal with fermented leafy greens", "season": "All year"},
        ],
        "places": [
            {"name": "Okhaldhunga Bazaar", "type": "Town", "why": "Clean hilltop town with stunning Himalayan panorama", "time": "Oct-Mar"},
            {"name": "Pike Peak (Pikey Peak)", "type": "Trek/Viewpoint", "why": "Recommended by Edmund Hillary as the best Everest viewpoint (4065m)", "time": "Oct-Nov, Mar-Apr"},
        ],
        "culture": [{"name": "Rai & Sherpa Traditions", "when": "Year-round", "why": "Mix of hill communities with traditional festivals and ancient customs"}],
        "tips": "Pikey Peak trek is a less crowded alternative to EBC. Bus from Kathmandu (12-14 hrs).",
    },
    "khotang": {
        "foods": [
            {"name": "Dhido & Local Chicken", "where": "Local homes and eateries", "why": "Traditional buckwheat/maize dhido with free-range chicken curry", "season": "All year"},
        ],
        "places": [
            {"name": "Diktel Bazaar", "type": "Town", "why": "Peaceful district HQ with valley views and traditional Rai villages", "time": "Oct-Mar"},
            {"name": "Halesi Mahadev Cave", "type": "Religious/Nature", "why": "Sacred cave temple important to Hindus, Buddhists, and Kirat followers", "time": "All year"},
        ],
        "culture": [{"name": "Kirat Traditions", "when": "Year-round", "why": "Rai community's unique nature-worship traditions and Sakela dance"}],
        "tips": "Remote district. Roads improving but still rough. Best explored on foot.",
    },
    "udayapur": {
        "foods": [
            {"name": "Maithili Fish Curry", "where": "Local restaurants in Gaighat/Triyuga", "why": "Freshwater fish from rivers, Terai-style spicy curry", "season": "All year"},
        ],
        "places": [
            {"name": "Triyuga Municipality", "type": "Town", "why": "Largest municipality, mix of Terai plains and Chure hills", "time": "Oct-Mar"},
            {"name": "Udaypur Cement & Limestone Caves", "type": "Nature", "why": "Interesting cave systems in the limestone hills of Chure range", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Tharu & Chhetri Mix", "when": "Year-round", "why": "Diverse community with Terai and hill traditions blending together"}],
        "tips": "On the Mahendra Highway — good transit point. Warm Terai climate.",
    },

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  MADHESH PROVINCE (Province 2) — 8 districts                       ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    "saptari": {
        "foods": [
            {"name": "Litti Chokha", "where": "Local vendors in Rajbiraj", "why": "Roasted wheat ball stuffed with sattu, served with mashed potato/brinjal", "season": "All year, best winter"},
            {"name": "Dahi Chura", "where": "Homes and eateries", "why": "Beaten rice with yogurt — traditional Maithili breakfast, especially festivals", "season": "All year"},
        ],
        "places": [
            {"name": "Rajbiraj", "type": "Town", "why": "District HQ with bustling Maithili culture, close to Indian border", "time": "Oct-Feb"},
            {"name": "Koshi Barrage", "type": "Infrastructure/Nature", "why": "Massive barrage on Sapta Koshi river, important for irrigation and flood control", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Chhath Parva", "when": "Oct-Nov", "why": "Grand Maithili sun worship festival — elaborate rituals at rivers and ponds"}],
        "tips": "Very hot summers (40°C+). Visit Oct-Feb. Maithili is the main language.",
    },
    "siraha": {
        "foods": [
            {"name": "Thekua", "where": "Local homes, especially during Chhath", "why": "Sweet wheat-based fried snack, signature Maithili festival food", "season": "Chhath (Oct-Nov), all year"},
        ],
        "places": [
            {"name": "Lahan", "type": "Town", "why": "Commercial hub of Siraha, bustling market town", "time": "Oct-Feb"},
            {"name": "Gadhi Mai Temple", "type": "Religious", "why": "Famous (and controversial) temple with massive festival every 5 years", "time": "Nov-Dec (festival years)"},
        ],
        "culture": [{"name": "Maithili Traditions", "when": "Year-round", "why": "Rich Maithili art — Mithila paintings, folk songs, and elaborate marriage ceremonies"}],
        "tips": "Very hot region. Excellent Mithila art available. Basic tourist infrastructure.",
    },
    "dhanusha": {
        "foods": [
            {"name": "Mithila Thali", "where": "Local restaurants in Janakpur", "why": "Maithili cuisine — dal, bhat, tarkari with distinct Terai spices", "season": "All year"},
            {"name": "Dahi Jalebi", "where": "Sweet shops in Janakpur", "why": "Crispy jalebi with thick yogurt — popular Maithili sweet", "season": "All year"},
        ],
        "places": [
            {"name": "Janaki Temple (Janakpur)", "type": "Religious/Heritage", "why": "Magnificent Mughal-Rajput style temple dedicated to Goddess Sita, major Hindu pilgrimage", "time": "All year, festivals"},
            {"name": "Ram Janaki Vivah Mandap", "type": "Religious", "why": "Believed to be the marriage site of Ram and Sita from the Ramayana", "time": "Nov-Dec (Vivah Panchami)"},
        ],
        "culture": [{"name": "Vivah Panchami", "when": "Nov-Dec", "why": "Re-enactment of Ram-Sita wedding with grand procession — Janakpur's biggest festival"}],
        "tips": "Janakpur has a domestic airport. Best in winter. Mithila art paintings make great souvenirs. Railway to Jaynagar (India).",
    },
    "mahottari": {
        "foods": [
            {"name": "Sattu Paratha", "where": "Local eateries in Jaleshwar", "why": "Roasted gram flour stuffed flatbread — protein-rich Terai staple", "season": "All year"},
        ],
        "places": [
            {"name": "Jaleshwar", "type": "Town/Religious", "why": "District HQ with ancient temples, important border trade town", "time": "Oct-Feb"},
            {"name": "Jaleshwar Mahadev Temple", "type": "Religious", "why": "Ancient Shiva temple, the town is named after it", "time": "All year, Shivaratri"},
        ],
        "culture": [{"name": "Maithili Folk Art", "when": "Year-round", "why": "Mithila paintings, folk dances, and traditional marriage customs"}],
        "tips": "Border area with India. Hot summers. Maithili culture dominant.",
    },
    "sarlahi": {
        "foods": [
            {"name": "Litti Chokha", "where": "Street vendors in Malangwa", "why": "Classic Madheshi roasted wheat ball, filling and affordable", "season": "All year"},
        ],
        "places": [
            {"name": "Malangwa", "type": "Town", "why": "District HQ, growing commercial center on the East-West Highway", "time": "Oct-Mar"},
            {"name": "Bagmati River area", "type": "Nature", "why": "Northern part has forested Chure hills with varied wildlife", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Jitiya Festival", "when": "Aug-Sep", "why": "Madheshi women's fasting festival for children's wellbeing"}],
        "tips": "Transit district on East-West Highway. Hot climate. Basic facilities.",
    },
    "rautahat": {
        "foods": [
            {"name": "Chuira & Dahi (Beaten Rice & Yogurt)", "where": "Local shops", "why": "Quick traditional meal, popular in Terai communities", "season": "All year"},
        ],
        "places": [
            {"name": "Gaur", "type": "Heritage Town", "why": "Historical garrison town with ruins of old fort, Maithili-Bhojpuri culture", "time": "Oct-Feb"},
            {"name": "Gaur Fort Ruins", "type": "Historical", "why": "Remains of medieval fortification with historical significance", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Madheshi Cultural Mix", "when": "Year-round", "why": "Blend of Maithili, Bhojpuri, and Tharu communities with distinct traditions"}],
        "tips": "Very hot summers. Close to Indian border (Birgunj road). Limited tourist infrastructure.",
    },
    "bara": {
        "foods": [
            {"name": "Samosa & Jalebi", "where": "Street vendors in Kalaiya", "why": "Classic Terai street food — crispy samosa with sweet jalebi", "season": "All year"},
        ],
        "places": [
            {"name": "Kalaiya", "type": "Town", "why": "District HQ, bustling Terai market town", "time": "Oct-Mar"},
            {"name": "Parsa National Park (northern edge)", "type": "Wildlife", "why": "Southern buffer zone touches Bara — Bengal tiger habitat", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Tharu Culture", "when": "Year-round", "why": "Indigenous Tharu community with unique dance, music, and customs"}],
        "tips": "Hot Terai district. Near Birgunj. Basic tourist facilities.",
    },
    "parsa": {
        "foods": [
            {"name": "Biryani & Kabab", "where": "Birgunj restaurants", "why": "Birgunj's diverse food scene reflects its Indo-Nepali border culture", "season": "All year"},
        ],
        "places": [
            {"name": "Birgunj", "type": "City/Border", "why": "Nepal's busiest border crossing with India (Raxaul), major trade hub", "time": "Oct-Mar"},
            {"name": "Parsa National Park", "type": "Wildlife/National Park", "why": "Largest national park in Terai — Bengal tiger, wild elephant, hornbills", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Border Town Culture Mix", "when": "Year-round", "why": "Unique Indo-Nepali blend — Diwali, Holi, and Chhath celebrated with equal fervor"}],
        "tips": "Birgunj is industrial — Parsa NP is the real draw. Very hot May-Aug. Direct bus from Kathmandu (6 hrs).",
    },

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  BAGMATI PROVINCE (Province 3) — 13 districts                      ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    "sindhuli": {
        "foods": [
            {"name": "Local Dal Bhat with Chicken", "where": "Sindhuli Madhi eateries", "why": "Hill-style dal bhat with free-range chicken and seasonal greens", "season": "All year"},
        ],
        "places": [
            {"name": "Sindhuli Gadhi", "type": "Historical", "why": "Historic fort where Nepal defeated a British invasion in 1767", "time": "Oct-Mar"},
            {"name": "Kamalamai Temple", "type": "Religious", "why": "Famous Bhagwati temple, important pilgrimage site", "time": "All year, Dashain"},
        ],
        "culture": [{"name": "Tamang & Magar Culture", "when": "Year-round", "why": "Diverse hill communities with distinct traditions, Tamang Selo music"}],
        "tips": "On the BP Highway (Kathmandu-Janakpur route). Hilly terrain with improving roads.",
    },
    "ramechhap": {
        "foods": [
            {"name": "Dhido & Gundruk", "where": "Local eateries", "why": "Traditional hill food — maize dhido with fermented greens", "season": "All year"},
        ],
        "places": [
            {"name": "Manthali", "type": "Town/Airport", "why": "District HQ, home to Ramechhap Airport (alternative Lukla flights)", "time": "All year"},
            {"name": "Those & Dolakha Border Area", "type": "Nature", "why": "Beautiful river valleys and terraced hillsides", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Tamang & Newar Culture", "when": "Year-round", "why": "Mix of Tamang Buddhist and Newar Hindu traditions"}],
        "tips": "Ramechhap airport used for Lukla flights (fewer delays than Kathmandu). Bus from Kathmandu (5-6 hrs).",
    },
    "dolakha": {
        "foods": [
            {"name": "Newari Cuisine", "where": "Charikot area", "why": "Newar community brings chatamari, bara, and local yomari", "season": "All year"},
        ],
        "places": [
            {"name": "Kalinchowk", "type": "Religious/Trek", "why": "Hilltop Bhagwati temple at 3842m with panoramic Himalayan views and cable car", "time": "Oct-Mar, Jan-Feb for snow"},
            {"name": "Gaurishankar (7134m)", "type": "Mountain", "why": "Sacred peak, Gaurishankar Conservation Area with trekking", "time": "Oct-Nov, Mar-May"},
        ],
        "culture": [{"name": "Dolakha Bhimsen Worship", "when": "Year-round, Dashain", "why": "Famous Bhimsen temple with bleeding idol — unique religious phenomenon"}],
        "tips": "Kalinchowk cable car: NPR 500-1000. Snow in Jan-Feb attracts winter tourists. Bus from Kathmandu (5 hrs).",
    },
    "sindhupalchok": {
        "foods": [
            {"name": "Tamang Sel Roti & Dhido", "where": "Local eateries, Chautara area", "why": "Traditional Tamang cuisine, wholesome hill food", "season": "All year"},
        ],
        "places": [
            {"name": "Helambu Trek", "type": "Trekking", "why": "Sherpa villages, rhododendron forests, accessible trek from Kathmandu", "time": "Oct-Nov, Mar-Apr"},
            {"name": "Tatopani Hot Springs (Sindhupalchok)", "type": "Nature", "why": "Natural hot springs near Kodari, rejuvenating after treks", "time": "Oct-Apr"},
            {"name": "Bhotekoshi River", "type": "Adventure", "why": "World-class white-water rafting and bungee jumping at Last Resort", "time": "Oct-Nov, Mar-May"},
        ],
        "culture": [{"name": "Tamang & Sherpa Heritage", "when": "Lhosar (Feb)", "why": "Tamang New Year celebrations with feasting, music, and masked dances"}],
        "tips": "Close to Kathmandu (3-4 hrs). Bungee jump: NPR 8000-11000. Earthquake recovery areas — support local businesses.",
    },
    "kavrepalanchok": {
        "foods": [
            {"name": "Newari Khaja Set", "where": "Dhulikhel, Banepa restaurants", "why": "Valley Newar cuisine — bara, chatamari, choila", "season": "All year"},
        ],
        "places": [
            {"name": "Dhulikhel", "type": "Viewpoint/Heritage", "why": "Panoramic Himalayan views from Langtang to Everest, Newari architecture", "time": "Oct-Mar"},
            {"name": "Namobuddha", "type": "Religious", "why": "Sacred Buddhist site where Prince Mahasattva offered himself to a starving tigress", "time": "All year"},
            {"name": "Panauti", "type": "Heritage Town", "why": "Medieval Newari town at the confluence of two rivers, untouched architecture", "time": "All year"},
        ],
        "culture": [{"name": "Newari Heritage", "when": "Year-round", "why": "Well-preserved Newari towns (Panauti, Banepa) with ancient temples and festivals"}],
        "tips": "Just 30 km from Kathmandu. Dhulikhel is great for day trips. Mountain bike trails to Namobuddha.",
    },
    "lalitpur": {
        "foods": [
            {"name": "Newari Khaja Set", "where": "Swotha Square, Honacha, Newa Lahana", "why": "Patan serves what many consider the most refined Newari platter — beaten rice with silky buffalo curry, marinated choila, crispy bara, nine varieties of pickle, and smooth yogurt. Some restaurants in Swotha serve it on traditional brass plates", "season": "All year"},
            {"name": "Chatamari", "where": "Local Newari eateries near Mangal Bazaar and Swotha", "why": "A thin rice-flour crepe topped with spiced minced meat and egg — Patan's Newari restaurants nail this dish. Often called 'Newari pizza' but it's entirely its own thing", "season": "All year"},
            {"name": "Yomari & Wo (Bara)", "where": "Street vendors, Newari festivals", "why": "Wo is a savory lentil patty fried golden-brown — the perfect teatime snack. Pair with local chiya (spiced milk tea) from any corner stall", "season": "All year"},
        ],
        "places": [
            {"name": "Patan Durbar Square", "type": "Heritage/UNESCO", "why": "Home to the finest collection of Newari architecture in Nepal — the stone Krishna Mandir, the Sundari Chowk royal bath, and exquisite wood carvings. Designated a UNESCO World Heritage Site, it's more compact and less chaotic than Kathmandu's Durbar Square", "time": "All year"},
            {"name": "Patan Museum", "type": "Museum", "why": "Housed in a beautifully restored wing of the old royal palace, it's considered one of the best museums in South Asia for Hindu and Buddhist bronze art. The courtyard cafe is a peaceful gem", "time": "All year, entry NPR 1000"},
            {"name": "Golden Temple (Hiranya Varna Mahavihar)", "type": "Religious/Heritage", "why": "A stunning 12th-century Buddhist monastery with a gilded facade, hidden just steps from the Durbar Square. The serene inner courtyard is one of Patan's best-kept secrets", "time": "All year"},
        ],
        "culture": [{"name": "Rato Machindranath Jatra", "when": "Apr-May", "why": "A month-long chariot festival where a massive tower-like rath is pulled through the streets of Patan — the most important festival for the Newari community, celebrating the god of rain and harvest"}],
        "tips": "Patan is just across the Bagmati River from Kathmandu — a short taxi ride (NPR 300-500). It's the artistic heart of the valley: perfect for buying thangka paintings, bronze statues, and handmade jewelry directly from artisan workshops. Combine with Bhaktapur for a full heritage day.",
    },
    "bhaktapur": {
        "foods": [
            {"name": "Juju Dhau (King Curd)", "where": "Everywhere in Bhaktapur — Nyatapola Cafe area, Taumadhi Square vendors", "why": "The legendary 'King of Yogurt' — impossibly thick, creamy, and sweet, served in traditional clay pots. Travelers call it the best yogurt they've ever tasted. You simply cannot leave Bhaktapur without trying it", "season": "All year"},
            {"name": "Yomari", "where": "Newari homes and local shops during Yomari Punhi festival", "why": "A sweet rice-flour dumpling filled with chaku (molasses) or khuwa (milk solids), shaped like a fig. This seasonal delicacy is so beloved that there's an entire festival dedicated to it", "season": "Dec (Yomari Punhi), occasionally available year-round"},
            {"name": "Newari Khaja with Local Aila", "where": "Small Newari eateries near Dattatraya Square", "why": "Bhaktapur's Newari cuisine is considered the most authentic — beaten rice with marinated buffalo, black-eyed beans, crispy soybeans, and the local rice spirit (aila)", "season": "All year"},
        ],
        "places": [
            {"name": "Bhaktapur Durbar Square", "type": "Heritage/UNESCO", "why": "The best-preserved medieval city square in Nepal — the five-storey Nyatapola Temple, the 55-Window Palace, and the Golden Gate are architectural masterpieces. Travelers consistently call Bhaktapur 'the jewel of the Kathmandu Valley'", "time": "All year, magical at sunrise"},
            {"name": "Pottery Square", "type": "Cultural/Artisan", "why": "An open-air workshop where potters hand-shape traditional clay pots using techniques unchanged for centuries. The drying racks of thousands of pots make for incredible photographs", "time": "All year, mornings best for activity"},
            {"name": "Dattatraya Square", "type": "Heritage", "why": "The oldest square in Bhaktapur with the Dattatraya Temple and the famous Peacock Window — quieter than the main Durbar Square and equally stunning", "time": "All year"},
        ],
        "culture": [{"name": "Bisket Jatra", "when": "Apr (Nepali New Year)", "why": "Bhaktapur's most spectacular festival — massive wooden chariots are pulled through narrow medieval streets, a towering lingo pole is erected, and traditional tongue-piercing rituals cap off the celebrations"}],
        "tips": "Entry fee: NPR 1500 for foreigners (valid for a week if you register at the ticket office). No motorized vehicles inside the old city — it's blissfully walkable. Stay overnight to experience the peaceful morning atmosphere before day-trippers arrive. Just 16 km from central Kathmandu.",
    },
    "kathmandu": {
        "foods": [
            {"name": "Newari Khaja Set", "where": "Kirtipur, Swotha (Patan), Newa Lahana in Thamel", "why": "A traditional Newari platter of beaten rice, buffalo curry, spiced egg, black soybeans, pickles, and aila (local spirit) — it's the ultimate Kathmandu foodie experience travelers rave about", "season": "All year"},
            {"name": "Momo", "where": "Bota Momo (New Road), Gilingche (Boudha), or any local street cart", "why": "Nepal's beloved dumpling — try buff (buffalo) steam momo with spicy tomato achar, or jhol momo swimming in sesame-chilli soup. Around NPR 150-250 at local spots, NPR 300-450 in tourist areas", "season": "All year"},
            {"name": "Thakali Thali", "where": "Thamel area, Thakali Kitchen near Durbar Marg", "why": "A complete balanced Nepali meal — steaming rice, dal, seasonal tarkari, gundruk (fermented greens), spicy timur achar, and papad. Unlimited refills are standard — 'Dal bhat power, 24 hour!'", "season": "All year"},
            {"name": "Chatamari", "where": "Patan, Kirtipur, Newari restaurants", "why": "Often called 'Newari pizza' — a thin rice-flour crepe topped with minced buff, egg, and spices, cooked on a clay plate. Unique to the Newar community and nothing like it elsewhere", "season": "All year"},
            {"name": "Sel Roti with Aloo Tarkari", "where": "Street vendors, festival stalls", "why": "Crispy ring-shaped rice bread, slightly sweet, paired with spicy potato curry — a festival favorite during Dashain and Tihar that locals queue up for", "season": "Oct-Nov festivals, available year-round"},
        ],
        "places": [
            {"name": "Pashupatinath Temple", "type": "Religious/UNESCO", "why": "One of the holiest Hindu temples in the world, set along the sacred Bagmati River. Witness evening aarti ceremonies and open-air cremation ghats — deeply moving and culturally significant", "time": "All year, early mornings or evening aarti"},
            {"name": "Swayambhunath (Monkey Temple)", "type": "Buddhist/UNESCO", "why": "An ancient stupa perched on a hilltop with the iconic all-seeing Buddha eyes. Climb 365 steps for stunning panoramic city views at sunrise — one of the most photographed spots in Nepal", "time": "All year, sunrise recommended"},
            {"name": "Boudhanath Stupa", "type": "Buddhist/UNESCO", "why": "One of the largest spherical stupas in the world and the heart of Tibetan Buddhism in Nepal. Walk clockwise around it at dusk when butter lamps flicker and monks chant — magical atmosphere", "time": "All year, best at dusk"},
            {"name": "Kathmandu Durbar Square", "type": "Heritage/UNESCO", "why": "Ancient royal palace complex with intricate wood carvings, the living Kumari goddess temple, and centuries of Malla dynasty history. Still recovering beautifully from the 2015 earthquake", "time": "All year"},
            {"name": "Garden of Dreams", "type": "Park/Heritage", "why": "A hidden neo-classical European garden from the 1920s — a peaceful oasis right next to the chaos of Thamel. Perfect for a quiet afternoon with a book", "time": "All year, entry NPR 200"},
        ],
        "culture": [
            {"name": "Indra Jatra", "when": "Sep", "why": "Kathmandu's most spectacular festival — the living Kumari goddess rides through the streets on a towering chariot, masked dancers perform, and the whole old city comes alive for eight days"},
            {"name": "Dashain & Tihar", "when": "Oct-Nov", "why": "Nepal's biggest festivals — Dashain celebrates the victory of good over evil with family gatherings and tika blessings, while Tihar (Festival of Lights) features beautiful rangoli, oil lamps, and the beloved tradition of worshipping dogs and crows"},
        ],
        "tips": "Negotiate taxi fares before riding or use the Pathao/inDrive app. Kathmandu sits at 1400m so altitude is not an issue. Air quality can be poor — carry a mask. Budget meals NPR 200-500 locally, NPR 600-1200 in tourist areas. Currency exchange is best at NIC Asia or Nabil Bank ATMs.",
    },
    "nuwakot": {
        "foods": [
            {"name": "Local Tamang Cuisine", "where": "Farmhouses and local eateries", "why": "Organic farm-to-table meals — dhido, gundruk, seasonal curries", "season": "All year"},
        ],
        "places": [
            {"name": "Nuwakot Durbar (Seven-Storey Palace)", "type": "Heritage", "why": "Historic fortress palace of Prithvi Narayan Shah, birthplace of unified Nepal", "time": "All year"},
            {"name": "Trisuli River", "type": "Adventure", "why": "Popular rafting and kayaking destination, easy access from Kathmandu", "time": "Oct-Nov, Mar-May"},
        ],
        "culture": [{"name": "Tamang Heritage Trail", "when": "Year-round", "why": "Community homestay trek through traditional Tamang villages with authentic cultural immersion"}],
        "tips": "Just 2 hrs from Kathmandu. Rafting: NPR 1500-3000/day. Nuwakot Durbar being restored.",
    },
    "rasuwa": {
        "foods": [
            {"name": "Tamang Thali & Butter Tea", "where": "Teahouses along Langtang trek", "why": "Tibetan-influenced Tamang food — butter tea, thukpa, momos", "season": "Oct-Nov, Mar-May"},
        ],
        "places": [
            {"name": "Langtang Valley Trek", "type": "Trekking", "why": "Beautiful glacial valley with Tamang/Tibetan villages, close to Kathmandu", "time": "Oct-Nov, Mar-May"},
            {"name": "Gosaikunda Lake", "type": "Lake/Religious", "why": "Sacred alpine lake at 4380m, major Janai Purnima pilgrimage", "time": "Jul-Aug (pilgrimage), Oct-Nov (trekking)"},
            {"name": "Kyanjin Gompa", "type": "Religious/Trek", "why": "Buddhist monastery in Langtang Valley with cheese factory and mountain views", "time": "Oct-Nov"},
        ],
        "culture": [{"name": "Tamang Culture", "when": "Lhosar (Feb)", "why": "Tamang New Year celebrations, monastery visit, traditional dances"}],
        "tips": "Langtang is accessible (bus to Syabrubesi, 7-8 hrs from KTM). TIMS + Langtang NP permit needed.",
    },
    "dhading": {
        "foods": [
            {"name": "Dhido & Gundruk", "where": "Local eateries", "why": "Classic hill cuisine — maize/millet dhido with fermented greens and local pickle", "season": "All year"},
        ],
        "places": [
            {"name": "Dhading Besi", "type": "Town", "why": "District HQ in a valley, gateway to Ruby Valley trek", "time": "Oct-Apr"},
            {"name": "Ruby Valley Trek", "type": "Trekking", "why": "Off-the-beaten-path trek through Tamang and Gurung villages, lesser-known", "time": "Oct-Nov, Mar-Apr"},
        ],
        "culture": [{"name": "Tamang & Gurung Heritage", "when": "Year-round", "why": "Diverse ethnic communities with traditional music, dance, and shamanic practices"}],
        "tips": "Close to Kathmandu. Ruby Valley trek being developed — limited teahouses. Carry supplies.",
    },
    "makwanpur": {
        "foods": [
            {"name": "Newari Cuisine & Sel Roti", "where": "Hetauda restaurants", "why": "Hetauda has a diverse food scene — Newari, Tamang, and Terai cuisines", "season": "All year"},
        ],
        "places": [
            {"name": "Hetauda", "type": "City", "why": "Industrial city at the base of Mahabharat hills, gateway to Chitwan", "time": "Oct-Mar"},
            {"name": "Daman", "type": "Viewpoint", "why": "Legendary viewpoint — 8 of the world's 14 highest peaks visible in a single panorama", "time": "Oct-Mar, mornings"},
        ],
        "culture": [{"name": "Diverse Hill-Terai Culture", "when": "Year-round", "why": "Meeting point of hill and Terai communities — Tamang, Newar, Chhetri, Tharu"}],
        "tips": "Daman is a must-visit for mountain views (2322m). On the old Tribhuvan Highway. Bus from KTM (3 hrs).",
    },
    "chitwan": {
        "foods": [
            {"name": "Tharu Cuisine (Ghonghi, Dhikri)", "where": "Tharu homestays, Sauraha village restaurants", "why": "Authentic indigenous Tharu food you won't find on tourist menus — ghonghi (spiced river snails), dhikri (steamed rice cakes), and fresh-caught fish curry. Eating at a Tharu homestay is one of Chitwan's best experiences", "season": "All year"},
            {"name": "Fresh River Fish Curry", "where": "Local restaurants in Sauraha, riverside eateries", "why": "Freshwater fish caught from the Rapti and Narayani rivers, cooked in traditional Tharu style with mustard oil, turmeric, and local spices. Simple but incredibly flavorful", "season": "All year"},
            {"name": "Dal Bhat with Jungle Greens", "where": "Safari lodges, local eateries", "why": "The Terai version of dal bhat features local greens harvested from the forest edge, giving it a distinctive flavor. Safari lodges often include cultural dinner with Tharu dance performances", "season": "All year"},
        ],
        "places": [
            {"name": "Chitwan National Park", "type": "Wildlife/UNESCO", "why": "Nepal's premier wildlife destination — home to over 600 one-horned rhinoceros (population recovering!), Royal Bengal tigers, gharial and mugger crocodiles, wild elephants, and 500+ bird species. Go on a jeep safari or walk through the jungle with an experienced guide for an unforgettable close encounter with wildlife", "time": "Oct-Mar (grass is cleared Jan-Feb making wildlife more visible)"},
            {"name": "Rapti River Canoe Safari", "type": "Adventure/Nature", "why": "Glide silently down the Rapti River in a dugout canoe at sunrise or sunset — spot mugger crocodiles basking on the banks, gharials with their needle-thin snouts, and colorful kingfishers. An incredibly peaceful way to experience the jungle", "time": "Oct-Mar"},
            {"name": "Tharu Village Walk", "type": "Cultural", "why": "Walk through traditional Tharu villages to learn about the indigenous community's unique longhouse architecture, their ancient coexistence with the jungle, and their vibrant culture. Often includes a Tharu stick dance performance in the evening", "time": "All year"},
        ],
        "culture": [{"name": "Tharu Stick Dance & Culture", "when": "Evenings (cultural programs), Maghi festival (Jan)", "why": "The energetic Tharu stick dance is mesmerizing — dancers circle with rhythmic clacking sticks in firelit evenings. During Maghi (Tharu New Year in January), the whole community celebrates with traditional sports, feasts, and rituals"}],
        "tips": "Jungle safari packages: NPR 2000-5000/day. The best time to visit is Oct-Feb when wildlife is most active and the weather is pleasant. Bring insect repellent (essential!). Chitwan is easily accessible — 5-6 hrs by tourist bus from Kathmandu or Pokhara, or take a Greenline deluxe bus. Sauraha village has ATMs, cafes, and lodges for all budgets.",
    },

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  GANDAKI PROVINCE (Province 4) — 11 districts                      ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    "gorkha": {
        "foods": [
            {"name": "Gurung Cuisine", "where": "Gorkha Bazaar, Manakamana area eateries", "why": "Authentic Gurung and Magar hill food — dhido with free-range chicken, gundruk ko jhol (fermented greens soup), and fresh millet roti. The birthplace of the Gurkha warriors, the food here is as robust as the people", "season": "All year"},
            {"name": "Local Honey & Ghee", "where": "Gorkha market, roadside stalls", "why": "Wild cliff honey from the surrounding hills and pure buffalo ghee — prized local products that make excellent souvenirs", "season": "All year"},
        ],
        "places": [
            {"name": "Gorkha Durbar", "type": "Heritage/Historical", "why": "The hilltop fortress-palace of Prithvi Narayan Shah, the founder of modern Nepal. This is where the unification of Nepal began in 1743. The steep climb is rewarded with panoramic Himalayan views and a tangible sense of history", "time": "All year"},
            {"name": "Manakamana Temple", "type": "Religious", "why": "One of Nepal's most popular wish-fulfilling temples, sitting on a ridge at 1302m. Accessible by cable car from Kurintar on the Kathmandu-Pokhara highway — the ride itself offers stunning views of the river valley and terraced hills", "time": "All year, cable car NPR 500-2000"},
            {"name": "Manaslu Circuit Trek", "type": "Trekking", "why": "The spectacular circuit around Manaslu (8163m), the world's 8th highest peak. Less crowded than the Annapurna Circuit with more authentic village experiences, crossing the Larkya La pass at 5160m", "time": "Sep-Nov, Mar-May"},
        ],
        "culture": [{"name": "Gurkha Warrior Heritage", "when": "Year-round", "why": "Gorkha is the ancestral home of the legendary Gurkha warriors — famous worldwide for their bravery and the iconic khukuri knife. The Gurung and Magar people here maintain strong martial and cultural traditions"}],
        "tips": "Manakamana cable car: NPR 500-2000 depending on cabin type. Gorkha Durbar has a steep 30-min climb — rewarding but bring water. Manaslu trek requires special permit (USD 100/week, minimum 2 trekkers with a guide). Gorkha town is a pleasant stop on the Kathmandu-Pokhara highway.",
    },
    "lamjung": {
        "foods": [
            {"name": "Gurung Cuisine — Dhido & Wild Honey", "where": "Besisahar eateries, Ghalegaun homestays, Gurung villages", "why": "Authentic organic Gurung food — buckwheat dhido with free-range chicken, wild cliff honey harvested by traditional honey hunters, and home-brewed raksi. The Ghalegaun homestay experience includes cooking with the family", "season": "All year"},
        ],
        "places": [
            {"name": "Besisahar", "type": "Town/Trek Gateway", "why": "The starting point of the legendary Annapurna Circuit trek. A bustling trail town where you finalize permits, hire guides/porters, and take your last comfortable meal before heading into the mountains", "time": "Oct-Nov, Mar-May"},
            {"name": "Ghalegaun", "type": "Homestay Village", "why": "An award-winning Gurung homestay village perched on a scenic ridge with incredible mountain views of Annapurna II and Lamjung Himal. Stay with a Gurung family, watch traditional dances, eat incredible home-cooked meals, and wake up to Himalayan sunrise. One of the most genuine cultural experiences in Nepal", "time": "Oct-Mar for clear mountain views"},
        ],
        "culture": [{"name": "Gurung Homestay & Cultural Experience", "when": "Year-round", "why": "Ghalegaun pioneered Nepal's community homestay model and has won national awards. You stay in a real Gurung home, participate in daily life, enjoy traditional Rodhi dance performances, and share meals cooked over woodfire. A truly heartwarming experience"}],
        "tips": "Ghalegaun homestay: NPR 1000-1500/night including meals. Bus from Kathmandu to Besisahar (6-7 hrs). For the Annapurna Circuit, ACAP permit (NPR 3000) and TIMS card are required. Ghalegaun can also be reached as a side trip from the circuit or independently from Besisahar.",
    },
    "tanahun": {
        "foods": [
            {"name": "Fish from Seti River", "where": "Damauli area restaurants, roadside eateries", "why": "Freshwater fish from the crystal-clear Seti and Madi rivers, grilled over charcoal or in rich curry — a local favorite in the hill region", "season": "All year"},
            {"name": "Newari Khaja & Local Thali", "where": "Bandipur restaurants, Damauli eateries", "why": "Bandipur's Newari community serves traditional khaja sets, while Damauli has simple but delicious hill-style dal bhat with local greens", "season": "All year"},
        ],
        "places": [
            {"name": "Bandipur", "type": "Heritage Town", "why": "A beautifully preserved Newari hilltop town with car-free cobblestone streets, traditional shophouses, and jaw-dropping Himalayan panoramas across Dhaulagiri, Manaslu, and the Annapurna range. Rediscovered by travelers in recent years, Bandipur is the perfect overnight stop between Kathmandu and Pokhara and one of Nepal's most charming hidden gems", "time": "All year, magical at sunrise and sunset"},
            {"name": "Siddha Cave", "type": "Cave/Nature", "why": "One of the largest caves in Nepal at 437 meters long — a dramatic underground chamber with stalactites, stalagmites, and bat colonies. A short hike from Bandipur with a local guide", "time": "Oct-Apr, entry NPR 100"},
            {"name": "Damauli", "type": "Town/Nature", "why": "Pleasant midlands town at the confluence of the Seti and Madi rivers, growing as a transit stop. The riverside area is peaceful for a short walk", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Newari Heritage of Bandipur", "when": "Year-round", "why": "Bandipur's well-preserved Newari architecture and festivals feel like stepping back in time. The hilltop bazaar lined with traditional houses, the ancient Bindabasini temple, and the warm hospitality of the Newar community make this a cultural treasure"}],
        "tips": "Bandipur is a MUST-STOP between Kathmandu and Pokhara — turn off the highway at Dumre. Stay overnight to experience the magical sunrise over the Himalayas and the peaceful evening atmosphere. Siddha Cave: NPR 100 entry, hire a local guide. Few ATMs — carry cash. The bus ride from Dumre to Bandipur hilltop takes 30 minutes.",
    },
    "syangja": {
        "foods": [
            {"name": "Phapar Ko Dhido (Buckwheat)", "where": "Local eateries in Putalibazar", "why": "Healthy buckwheat dhido with wild herbs and local pickle", "season": "All year"},
        ],
        "places": [
            {"name": "Waling", "type": "Town", "why": "One of Nepal's cleanest cities, well-planned municipality in the hills", "time": "All year"},
            {"name": "Putalibazar", "type": "Town", "why": "District HQ with views of Annapurna and Dhaulagiri ranges", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Magar Culture", "when": "Year-round", "why": "Magar community's traditional dances (Sorathi, Maruni) and customs"}],
        "tips": "Between Pokhara and Butwal. Good stopover. Peaceful hill towns with friendly locals.",
    },
    "kaski": {
        "foods": [
            {"name": "Fish from Begnas/Phewa Lake", "where": "Lakeside restaurants, Begnas Tal area", "why": "Freshwater fish caught from the lakes, served fried whole or in a light curry — a Pokhara specialty you won't find this fresh elsewhere. Try it at the small local joints near Begnas for the authentic experience", "season": "All year"},
            {"name": "Thakali Thali", "where": "Thakali Bhanchha (Lakeside), Pokhara Thakali Kitchen", "why": "Thakali cuisine originates from the Kali Gandaki corridor nearby — the thali here includes dal, rice, seasonal vegetables, gundruk, spicy timur achar, and sometimes buckwheat roti. Widely considered the best regional cuisine in Nepal", "season": "All year"},
            {"name": "Tibetan Bread & Honey", "where": "Lakeside cafes, OR Cafe", "why": "Puffy fried bread drizzled with local wild honey — a popular Pokhara breakfast that travelers love. Simple, sweet, and addictive", "season": "All year"},
            {"name": "Momos & Buff Chhoila", "where": "Street vendors, Busy Bee Cafe", "why": "Pokhara's momo scene rivals Kathmandu's. Also try Newari-style grilled buffalo chhoila with beaten rice at one of the local Newari restaurants off the main Lakeside strip", "season": "All year"},
        ],
        "places": [
            {"name": "Phewa Lake", "type": "Lake/Nature", "why": "Nepal's most iconic lake — rent a colorful rowboat and paddle to the Tal Barahi island temple while the Annapurna range reflects in the still morning water. The Lakeside strip along its shore is the heart of Pokhara's traveler scene", "time": "Oct-Mar for clearest reflections"},
            {"name": "Sarangkot", "type": "Viewpoint/Adventure", "why": "Wake up before dawn and drive up (or hike) to catch one of Nepal's most breathtaking sunrises — the entire Annapurna range, Machhapuchhre (Fishtail), and Dhaulagiri light up in gold and pink. Also the main launch point for paragliding (NPR 7000-12000)", "time": "Oct-Apr, early morning"},
            {"name": "World Peace Pagoda (Shanti Stupa)", "type": "Religious/Viewpoint", "why": "A gleaming white Japanese Buddhist stupa perched on a ridge south of Phewa Lake. The 360-degree views of the lake, city, and mountains are spectacular — reach it by boat + hike for the best experience", "time": "All year"},
            {"name": "Davis Falls & Gupteshwor Cave", "type": "Waterfall/Cave", "why": "A dramatic waterfall that disappears underground into the Seti River gorge, with the Gupteshwor Mahadev cave temple right below. Most impressive during monsoon when the water thunders down", "time": "Jul-Sep (monsoon) for fullest falls, accessible year-round"},
            {"name": "Begnas Lake", "type": "Lake/Nature", "why": "Pokhara's peaceful alternative to Phewa — less crowded, more natural, and surrounded by quiet hills. Great for kayaking and a lakeside picnic away from the tourist bustle", "time": "All year"},
        ],
        "culture": [
            {"name": "Gurung Heritage & Tamu Lhosar", "when": "Dec/Jan", "why": "The indigenous Gurung community celebrates their New Year with traditional dances, feasting, and cultural performances. Pokhara's International Mountain Museum also showcases the rich mountaineering heritage of the Gurung and Sherpa peoples"},
        ],
        "tips": "Pokhara is 200 km west of Kathmandu (25-min flight or 6-7 hr tourist bus). Air quality is much better than Kathmandu. Paragliding from Sarangkot: NPR 7000-12000. Best trekking season is Oct-Nov. Lakeside has ATMs, cafes, gear shops, and everything a traveler needs. Pokhara is the gateway to Annapurna Circuit, ABC, Poon Hill, and Mardi Himal treks.",
    },
    "manang": {
        "foods": [
            {"name": "Buckwheat Pancakes & Dhido", "where": "Teahouses in Manang village, Chame, Pisang", "why": "At 3500m+, buckwheat is king — hearty pancakes served with honey or jam, and buckwheat dhido with yak meat stew. The perfect high-altitude fuel before heading to Tilicho or Thorong La", "season": "Mar-Nov"},
            {"name": "Apple Pie & Hot Lemon Tea", "where": "Teahouses along the Annapurna Circuit", "why": "Trail comfort food at its finest — hot apple pie baked in mountain teahouses and steaming lemon-ginger-honey tea. After a cold day on the trail, nothing beats this combination", "season": "Mar-Nov"},
        ],
        "places": [
            {"name": "Tilicho Lake", "type": "Lake/Trek", "why": "One of the highest lakes in the world at 4919m — a surreal turquoise jewel surrounded by barren Himalayan walls. The side trek from the Annapurna Circuit is challenging but absolutely worth it. Many trekkers call this the highlight of their entire Nepal trip", "time": "Sep-Nov for clearest conditions"},
            {"name": "Ice Lake (Kicho Tal)", "type": "Lake/Day Hike", "why": "A popular acclimatization day hike from Manang village to a stunning alpine lake at 4600m. The panoramic views of the Annapurna range, Gangapurna, and Tilicho Peak from the ridge are extraordinary", "time": "Oct-Nov"},
            {"name": "Manang Village", "type": "Village/Base", "why": "A traditional stone-and-wood Tibetan-influenced village at 3540m, the main rest stop on the Annapurna Circuit. Spend your acclimatization days here exploring the ancient Braga monastery, the ice lake, and the village's unique culture of high-altitude traders", "time": "Oct-Nov, Mar-May"},
            {"name": "Thorong La Pass", "type": "Mountain Pass", "why": "The legendary 5416m pass that marks the high point of the Annapurna Circuit — one of the world's classic trekking achievements. The pre-dawn crossing with headlamps and the descent to Muktinath is unforgettable", "time": "Oct-Nov, Mar-May"},
        ],
        "culture": [{"name": "Mananggi Trading Culture & Buddhism", "when": "Year-round", "why": "The Manangba people have unique government-granted trading privileges dating back centuries, making them Nepal's most commercially savvy mountain community. Ancient Tibetan Buddhist monasteries dot the valley — Braga Gompa with its 500-year-old statues is a must-visit"}],
        "tips": "Part of the Annapurna Circuit. Spend at least 2 acclimatization days in Manang before crossing Thorong La — altitude sickness is the biggest risk. ACAP permit: NPR 3000. Carry Diamox (AMS prevention). Teahouses provide food and lodging. No ATMs past Chame — carry enough cash. Wi-Fi available at most teahouses (NPR 200-500).",
    },
    "mustang": {
        "foods": [
            {"name": "Buckwheat Dhido & Thakali Dal Bhat", "where": "Local lodges in Jomsom, Kagbeni, Lo Manthang", "why": "High-altitude comfort food — nutritious buckwheat porridge (dhido) is the staple here. Thakali dal bhat in the Kali Gandaki corridor is widely considered Nepal's finest regional cuisine, served with flavorful gundruk and timur achar", "season": "Mar-Nov"},
            {"name": "Marpha Apple Products", "where": "Marpha village shops, Jomsom lodges", "why": "Marpha is Nepal's apple capital — try fresh apples, homemade apple cider, apple brandy, dried apple rings, and apple pie. The village's stone-paved streets and apple orchards are picture-perfect, especially during Sep-Oct harvest season", "season": "Sep-Oct (harvest), products available Mar-Nov"},
            {"name": "Tibetan Bread & Butter Tea", "where": "Teahouses throughout Upper Mustang", "why": "Warm, salty yak-butter tea and puffy Tibetan bread are essential in the cold, windswept trans-Himalayan landscape. An acquired taste that grows on you", "season": "Mar-Nov"},
        ],
        "places": [
            {"name": "Lo Manthang (Upper Mustang)", "type": "Heritage/Restricted Area", "why": "A walled medieval kingdom frozen in time on the edge of the Tibetan Plateau — ancient Buddhist monasteries, centuries-old cave paintings, and Tibetan culture virtually unchanged for generations. One of the most unique destinations in all of Asia", "time": "Mar-Nov (permit: USD 500 for 10 days)"},
            {"name": "Muktinath Temple", "type": "Religious/Pilgrimage", "why": "Sacred to both Hindus and Buddhists — 108 stone waterspouts pour holy water from a cliff face, with an eternal natural gas flame burning behind a waterfall. Travelers from both the Annapurna Circuit and direct from Jomsom make pilgrimages here. A truly spiritual place", "time": "Mar-Nov, best Oct-Nov"},
            {"name": "Kagbeni Village", "type": "Heritage Village", "why": "A medieval fortress village at the gateway to Upper Mustang, perched at the confluence of the Kali Gandaki and Jhong rivers. The crumbling red-mud buildings, ancient gompa, and stunning mountain setting make it one of Nepal's most atmospheric places", "time": "Mar-Nov"},
            {"name": "Marpha Village", "type": "Heritage/Agriculture", "why": "Nepal's apple capital with immaculate stone-paved streets, whitewashed houses, and apple orchards beneath towering Himalayan peaks. The neatest, cleanest village on the Annapurna Circuit, beloved by trekkers", "time": "Sep-Oct for apple season, Mar-Nov overall"},
        ],
        "culture": [{"name": "Tiji Festival", "when": "May (3 days)", "why": "Upper Mustang's most spectacular event — three days of elaborate masked dances, ancient Buddhist rituals, and colorful celebrations in the courtyard of Lo Manthang's royal palace. Witnessing Tiji is a once-in-a-lifetime experience"}],
        "tips": "Upper Mustang requires a special permit: USD 500 for 10 days (USD 50/day after). Lower Mustang (Jomsom, Kagbeni, Muktinath, Marpha) is accessible via the Annapurna Circuit or a short flight from Pokhara to Jomsom. Mustang is all but inaccessible during monsoon (Jun-Sep) when roads wash out and flights cancel frequently. The Kali Gandaki Gorge is the deepest gorge in the world.",
    },
    "myagdi": {
        "foods": [
            {"name": "Thakali Thali", "where": "Beni restaurants, Ghorepani teahouses", "why": "Authentic Thakali cuisine from the Kali Gandaki corridor — the dal bhat here is considered among Nepal's best, with distinctive timur (Sichuan pepper) achar and seasonal gundruk", "season": "All year"},
            {"name": "Mountain Tea & Biscuits", "where": "Ghorepani and Poon Hill teahouses", "why": "Hot masala tea and fresh-baked biscuits in the crisp mountain air after sunrise at Poon Hill — simple pleasures that become unforgettable trail memories", "season": "Oct-May"},
        ],
        "places": [
            {"name": "Poon Hill (3210m)", "type": "Viewpoint/Trek", "why": "Nepal's most famous short-trek sunrise viewpoint — wake at 4:30 AM to climb 45 minutes from Ghorepani and watch the sun rise over 8000m giants Dhaulagiri, Annapurna I (the world's 7th and 10th highest peaks), and the entire Annapurna-Dhaulagiri panorama. A life-defining moment for many travelers", "time": "Oct-Nov and Mar-Apr for crystal-clear skies"},
            {"name": "Ghorepani-Poon Hill Trek", "type": "Trekking", "why": "The most popular short trek in Nepal (4-5 days). Passes through beautiful rhododendron forests (spectacular in March-April when they bloom red and pink), Gurung and Magar villages, terraced hillsides, and ends with the unforgettable Poon Hill sunrise", "time": "Oct-Nov, Mar-Apr"},
            {"name": "Dhaulagiri Base Camp Trek", "type": "Trekking", "why": "A remote, challenging trek to the base of the world's 7th highest peak (8167m). Far fewer trekkers than the Annapurna Circuit, offering genuine wilderness and dramatic glacier scenery", "time": "Oct-Nov, Mar-May"},
            {"name": "Beni", "type": "Town/Gateway", "why": "Lively confluence town where the Kali Gandaki and Myagdi rivers meet, gateway to both Poon Hill and Dhaulagiri treks. Good place to stock up on supplies", "time": "All year"},
        ],
        "culture": [{"name": "Magar Heritage & Gurung Villages", "when": "Year-round", "why": "The Poon Hill trek passes through traditional Magar and Gurung villages where you can experience genuine rural Nepal — terraced farming life, traditional stone houses, and warm mountain hospitality"}],
        "tips": "Ghorepani/Poon Hill is Nepal's most popular short trek — perfect for beginners. ACAP permit needed (NPR 3000). Best done from Pokhara (bus to Nayapul trailhead, 1.5 hrs). Teahouses provide meals and beds — no camping needed. Book early in peak season (Oct-Nov). Bring layers — mornings at Poon Hill are cold.",
    },
    "parbat": {
        "foods": [
            {"name": "Dhido & Local Chicken Curry", "where": "Kushma area eateries, roadside dhabas", "why": "Traditional hill meal featuring thick maize porridge served with spicy free-range chicken curry, locally grown vegetables, and homemade pickle. Simple, hearty, and authentic hill Nepal flavor", "season": "All year"},
            {"name": "Myagdi Kodo Roti", "where": "Local homes and teashops", "why": "Millet flatbread from the surrounding hills — nutritious, slightly nutty, paired with fresh yogurt or local honey", "season": "All year"},
        ],
        "places": [
            {"name": "Kushma Bungee Jump", "type": "Adventure", "why": "Nepal's highest bungee jump from a suspension bridge 228 meters above the Modi River gorge — an adrenaline rush with stunning canyon views. Also offers a giant swing for the brave. One of the top adventure activities between Pokhara and Baglung", "time": "All year, NPR 5000-7000"},
            {"name": "Kushma-Gyadi Suspension Bridge", "type": "Infrastructure/Viewpoint", "why": "One of the highest and longest pedestrian suspension bridges in Nepal, offering breathtaking views of the river gorge below and the surrounding green hills. A must-walk even for non-bungee-jumpers", "time": "All year"},
            {"name": "Panchase Hill", "type": "Trek/Viewpoint", "why": "A beautiful day trek from Pokhara to a 2500m hilltop with panoramic views of Annapurna, Machhapuchhre, and Phewa Lake. Covered in rhododendron forests that burst into spectacular bloom in March-April", "time": "Mar-Apr (rhododendrons), Oct-Nov (clear views)"},
        ],
        "culture": [{"name": "Magar Heritage & Hill Traditions", "when": "Year-round", "why": "Parbat is home to a strong Magar community with ancient hill traditions, lively festivals, traditional Panchebaja (five-instrument) wedding music, and warm hospitality"}],
        "tips": "Kushma bungee: NPR 5000-7000, swing also available. Parbat is between Pokhara and Baglung (2 hrs from Pokhara by bus). Combine with a visit to Myagdi for Ghorepani/Poon Hill trek. The area is developing rapidly as an adventure tourism hub.",
    },
    "baglung": {
        "foods": [
            {"name": "Dhido & Gundruk", "where": "Local eateries in Baglung Bazaar", "why": "Classic hill comfort food with fermented greens", "season": "All year"},
        ],
        "places": [
            {"name": "Baglung Kalika Temple", "type": "Religious", "why": "Historical temple on hilltop with panoramic views of Dhaulagiri range", "time": "All year"},
            {"name": "Baglung Bazaar", "type": "Town", "why": "District HQ, gateway to Dhaulagiri and Dolpa treks", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Panchebaja Music", "when": "Weddings, festivals", "why": "Traditional five-instrument musical ensemble — iconic in hill weddings"}],
        "tips": "On the road between Pokhara and Beni. Starting point for western treks.",
    },
    "nawalparasi": {
        "foods": [
            {"name": "Tharu Fish Curry", "where": "Tharu homestays, Narayangadh area", "why": "Traditional Tharu fish preparation from Narayani river", "season": "All year"},
        ],
        "places": [
            {"name": "Kawasoti", "type": "Town", "why": "East Nawalparasi headquarters, gateway to Chitwan from the west", "time": "Oct-Mar"},
            {"name": "Gaindahawa Lake Area", "type": "Nature", "why": "Wetland area near western Nawalparasi with birdwatching opportunities", "time": "Oct-Feb"},
        ],
        "culture": [{"name": "Tharu & Mixed Culture", "when": "Year-round", "why": "Blend of Tharu, Magar, and hill-origin communities"}],
        "tips": "Covers both East (Gandaki) and West (Lumbini) Nawalparasi. Good transit between Pokhara and Chitwan.",
    },

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  LUMBINI PROVINCE (Province 5) — 12 districts                      ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    "gulmi": {
        "foods": [
            {"name": "Dhido & Gundruk", "where": "Tamghas area eateries", "why": "Hearty hill food, especially good with local free-range mutton", "season": "All year"},
        ],
        "places": [
            {"name": "Tamghas", "type": "Town", "why": "Beautiful district HQ with rolling hills and river valley views", "time": "Oct-Mar"},
            {"name": "Resunga Hill", "type": "Nature/Religious", "why": "Sacred hilltop forest with stunning views, meditation cave of sage Resunga", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Magar Culture", "when": "Year-round", "why": "Strong Magar presence with traditional dances and ancient hilltop shrines"}],
        "tips": "Off the beaten path — pristine hills. Bus from Butwal (4-5 hrs). Limited tourist infrastructure.",
    },
    "palpa": {
        "foods": [
            {"name": "Newari Cuisine & Pakuwa", "where": "Tansen restaurants, Hotel White Lake", "why": "Tansen's Newari community serves distinctive hill Newari cuisine different from the Kathmandu Valley. Try the local pakuwa (creamy rice pudding), Newari khaja set, and aila (distilled rice spirit). Simple, authentic, and uniquely Palpa", "season": "All year"},
            {"name": "Dhaka Topi Cafe Treats", "where": "Tansen Bazaar cafes", "why": "Small local cafes in the old bazaar serve excellent masala tea, samosas, and sweets — a perfect way to experience the slow charm of this hilltop town", "season": "All year"},
        ],
        "places": [
            {"name": "Tansen", "type": "Heritage Town", "why": "One of Nepal's most charming and overlooked towns — a hilltop Newari settlement with narrow cobbled lanes, the grand Tansen Durbar (palace), the ornate Amar Narayan Temple, and a thriving traditional marketplace. Slower, quieter, and more authentic than Kathmandu. Travelers who discover Tansen almost always wish they'd stayed longer", "time": "All year"},
            {"name": "Rani Mahal (Queen's Palace)", "type": "Heritage", "why": "Called 'Nepal's Taj Mahal' — a beautiful riverside palace built by Rana general Khadga Shumsher in memory of his beloved queen. The 3-hour downhill hike to reach it through rural villages is part of the adventure. Romantically located on the banks of the Kali Gandaki river", "time": "Oct-Mar"},
            {"name": "Srinagar Hill", "type": "Viewpoint", "why": "A short hike from Tansen to a 360-degree panoramic viewpoint — see from the Dhaulagiri and Annapurna ranges in the north to the vast Terai plains in the south. Spectacular at sunrise", "time": "Oct-Mar, early mornings"},
        ],
        "culture": [{"name": "Tansen Newari & Dhaka Weaving Heritage", "when": "Year-round, Jatra festivals", "why": "Tansen's Newari culture is distinctly different from Kathmandu Valley Newars. The town is famous for Dhaka fabric weaving (the colorful cloth used in the national Dhaka topi cap), traditional metalwork (Palpa khukuri knives), and vibrant Jatra festivals where chariots are pulled through the narrow lanes"}],
        "tips": "Tansen is one of Nepal's most overlooked gems — highly recommended for travelers seeking authentic, uncrowded Nepal. Bus from Butwal (2 hrs, winding hill road) or Pokhara (5 hrs). Rani Mahal: 3-hr downhill hike, arrange guide in Tansen. Buy Dhaka fabric and Palpa khukuri knives as authentic souvenirs. Limited ATMs — carry cash.",
    },
    "rupandehi": {
        "foods": [
            {"name": "Bhojpuri Thali", "where": "Butwal and Bhairahawa restaurants", "why": "Terai-style hearty meal influenced by nearby Indian Bhojpuri cuisine — litti chokha (roasted wheat balls stuffed with sattu), sattu paratha, and seasonal vegetable curries. Filling and flavorful", "season": "All year"},
            {"name": "Pani Puri / Golgappa", "where": "Street vendors in Butwal, Bhairahawa market", "why": "Crispy hollow puri filled with tangy-spicy water, potato, and chickpea mixture — one of Nepal's most popular street snacks. Follow the crowds to find the best vendor", "season": "All year"},
            {"name": "Sweets & Lassi", "where": "Sweet shops in Bhairahawa", "why": "The Terai's sweet-tooth culture means excellent gulab jamun, rasgulla, and thick creamy lassi — perfect refreshment in the heat", "season": "All year"},
        ],
        "places": [
            {"name": "Lumbini (Buddha's Birthplace)", "type": "Religious/UNESCO World Heritage", "why": "The birthplace of Siddhartha Gautam — the historical Buddha. The Maya Devi Temple marks the exact birth spot, surrounded by the ancient Ashoka Pillar (249 BC), a sacred Bodhi tree, and an enormous monastic zone with temples built by Buddhist nations from around the world. For anyone with interest in Buddhism or ancient history, Lumbini is profoundly moving and a site of global significance", "time": "Oct-Feb (pleasant weather), May for Buddha Jayanti"},
            {"name": "Lumbini Monastic Zone", "type": "Cultural/Religious", "why": "A unique collection of international Buddhist temples and monasteries — each built in the architectural style of the country that donated it. The contrast between the Japanese Peace Pagoda, Thai monastery, Chinese temple, and Myanmar pagoda is fascinating", "time": "Oct-Feb"},
            {"name": "Butwal", "type": "City/Transit Hub", "why": "Western Nepal's fastest-growing commercial city, gateway to Lumbini and the hills of Palpa and Gulmi. Modern amenities, good food scene, and growing nightlife", "time": "All year"},
        ],
        "culture": [
            {"name": "Buddha Jayanti", "when": "May (full moon)", "why": "The birthday of the Buddha is celebrated at Lumbini with thousands of pilgrims from around the world — lantern processions, meditation gatherings, and cultural performances. A deeply peaceful and spiritual atmosphere"},
            {"name": "Chhath Parva", "when": "Oct-Nov", "why": "The Terai's grand sun worship festival — devotees stand in rivers and ponds offering prayers to the setting and rising sun. Colorful, intensely devotional, and a beautiful spectacle"},
        ],
        "tips": "Lumbini is 22 km from Bhairahawa (Siddharthanagar), which has a small international airport with daily flights from Kathmandu. Tourist bus from Kathmandu (8-9 hrs) or Pokhara (5-6 hrs). Lumbini entry fee: NPR 200. Rent a bicycle (NPR 300-500/day) to explore the vast monastic zone. Very hot in summer (40°C+) — visit Oct-Feb. Butwal is the main transit hub with ATMs, hotels, and bus connections.",
    },
    "kapilvastu": {
        "foods": [
            {"name": "Tharu Cuisine", "where": "Local Tharu restaurants", "why": "Indigenous Tharu food — dhikri, ghonghi, seasonal vegetables", "season": "All year"},
        ],
        "places": [
            {"name": "Tilaurakot", "type": "Archaeological/Heritage", "why": "Ancient Shakya Kingdom palace ruins — where Prince Siddhartha spent 29 years before becoming Buddha", "time": "Oct-Feb"},
            {"name": "Kapilvastu Museum", "type": "Museum", "why": "Archaeological finds from Tilaurakot excavations", "time": "All year"},
        ],
        "culture": [{"name": "Buddhist Heritage", "when": "Year-round", "why": "Entire district is part of the Buddhist circuit — Niglihawa, Gotihawa Ashoka pillars"}],
        "tips": "Part of the Lumbini Buddhist Circuit. Less visited than Lumbini but historically significant.",
    },
    "arghakhanchi": {
        "foods": [
            {"name": "Dhido & Local Mushroom Curry", "where": "Sandhikharka eateries", "why": "Wild mushrooms from the forests paired with traditional dhido", "season": "Monsoon for mushrooms, all year for dhido"},
        ],
        "places": [
            {"name": "Sandhikharka", "type": "Town", "why": "Pleasant district HQ in the hills, traditional Magar area", "time": "Oct-Mar"},
            {"name": "Arghakhanchi Hills", "type": "Nature", "why": "Rolling green hills with terraced farms and panoramic views", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Magar Traditions", "when": "Year-round", "why": "Magar cultural heartland — traditional dances, rituals, and crafts"}],
        "tips": "Remote hill district. Limited tourist infrastructure but authentic experience. Bus from Butwal (5 hrs).",
    },
    "pyuthan": {
        "foods": [
            {"name": "Dhido & Gundruk", "where": "Local eateries", "why": "Classic hill cuisine with locally grown millet and fermented greens", "season": "All year"},
        ],
        "places": [
            {"name": "Swargadwari", "type": "Religious/Viewpoint", "why": "Sacred hilltop temple (2100m) — 'Gateway to Heaven' — panoramic Himalayan views", "time": "Oct-Mar"},
            {"name": "Pyuthan Bazaar", "type": "Town", "why": "Historic district HQ with traditional hill culture", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Magar & Chhetri Heritage", "when": "Year-round", "why": "Rich mix of Magar and Chhetri traditions, traditional hill festivals"}],
        "tips": "Swargadwari is a major pilgrimage site. Remote but rewarding. Bus from Dang (4-5 hrs).",
    },
    "rolpa": {
        "foods": [
            {"name": "Dhido & Wild Herbs", "where": "Local homes and eateries", "why": "Remote hill cuisine with wild Himalayan herbs and free-range meat", "season": "All year"},
        ],
        "places": [
            {"name": "Jaljala Pass", "type": "Viewpoint/Trek", "why": "Sacred meadow at 3600m with 360° views, rhododendron forests", "time": "Mar-May, Oct-Nov"},
            {"name": "Rolpa District", "type": "Nature/Remote", "why": "Untouched remote hill landscapes, traditional Magar villages", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Magar Cultural Heart", "when": "Year-round", "why": "Rolpa is considered the Magar homeland — ancient traditions, traditional governance"}],
        "tips": "Very remote, limited infrastructure. Best for adventurous travelers. Bus from Dang (6+ hrs).",
    },
    "rukum": {
        "foods": [
            {"name": "Dhido & Himalayan Herbs", "where": "Local eateries in Musikot/Khalanga", "why": "Remote hill cuisine with altitude herbs and traditional preparation", "season": "All year"},
        ],
        "places": [
            {"name": "Sisne Himal", "type": "Mountain/Trek", "why": "Beautiful remote peak with challenging trekking opportunities", "time": "Oct-Nov"},
            {"name": "Musikot", "type": "Town", "why": "Rukum East HQ, historic hill town with panoramic views", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Magar & Kham Magar Culture", "when": "Year-round", "why": "Unique Kham Magar sub-group with distinct dialect and ancient traditions"}],
        "tips": "Covers both Rukum East (Lumbini Province) and Rukum West (Karnali Province). Very remote area.",
    },
    "dang": {
        "foods": [
            {"name": "Tharu Cuisine (Dhikri, Bagiya)", "where": "Ghorahi/Tulsipur restaurants, Tharu homestays", "why": "Tharu steamed rice cakes and rice-flour dumplings, indigenous recipes", "season": "All year"},
        ],
        "places": [
            {"name": "Dang Valley", "type": "Nature", "why": "One of the largest inner Terai valleys — lush farmland, Rapti river", "time": "Oct-Mar"},
            {"name": "Ghorahi & Tulsipur", "type": "Cities", "why": "Twin cities of Dang — growing urban centers with Tharu cultural programs", "time": "All year"},
        ],
        "culture": [{"name": "Tharu Culture", "when": "Year-round, Maghi in Jan", "why": "Tharu New Year (Maghi) celebrations with traditional dances, feasts, and rituals"}],
        "tips": "Dang is a major mid-west hub. Good road access. Hot in summer. Tharu cultural programs available.",
    },
    "banke": {
        "foods": [
            {"name": "Samosa Chaat & Street Food", "where": "Nepalgunj bazaar", "why": "Nepalgunj's bustling street food scene — samosa, pani puri, lassi", "season": "All year"},
        ],
        "places": [
            {"name": "Nepalgunj", "type": "City", "why": "Gateway to western Nepal, Bardiya NP, and flights to remote Karnali/Dolpa", "time": "Oct-Mar"},
            {"name": "Bageshwori Temple", "type": "Religious", "why": "Important Hindu temple in the heart of Nepalgunj", "time": "All year"},
        ],
        "culture": [{"name": "Muslim & Hindu Harmony", "when": "Year-round", "why": "One of Nepal's most culturally diverse cities — mosques and temples side by side"}],
        "tips": "Nepalgunj has airport for Jumla/Dolpa/Humla flights. Very hot in summer (45°C+). Best Oct-Feb.",
    },
    "bardiya": {
        "foods": [
            {"name": "Tharu Cuisine", "where": "Tharu homestays near Bardiya NP", "why": "Authentic Tharu meals — fish curry, dhikri, wild greens from the forest edge", "season": "All year"},
        ],
        "places": [
            {"name": "Bardiya National Park", "type": "Wildlife/National Park", "why": "Best place to see wild Bengal tigers in Nepal, less crowded than Chitwan", "time": "Oct-Mar"},
            {"name": "Karnali River", "type": "Nature/Adventure", "why": "Nepal's longest river, excellent for rafting and dolphin spotting", "time": "Oct-Nov"},
        ],
        "culture": [{"name": "Tharu Culture", "when": "Year-round", "why": "Pristine Tharu villages around the park — authentic cultural experience"}],
        "tips": "Bardiya is wilder and less touristy than Chitwan. Tiger sighting probability higher. Bus from Nepalgunj (4 hrs).",
    },

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  KARNALI PROVINCE (Province 6) — 10 districts                      ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    "salyan": {
        "foods": [
            {"name": "Dhido & Gundruk", "where": "Local eateries in Khalanga", "why": "Traditional hill food — millet dhido with fermented greens", "season": "All year"},
        ],
        "places": [
            {"name": "Khalanga (Salyan)", "type": "Town", "why": "Historic district HQ with fortress ruins and hill panorama", "time": "Oct-Mar"},
            {"name": "Sharada River Valley", "type": "Nature", "why": "Scenic valley with traditional villages and terraced farmland", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Mid-Western Hill Culture", "when": "Year-round", "why": "Mix of Magar, Chhetri, and Thakuri traditions with unique western hill customs"}],
        "tips": "Remote mid-western district. Bus from Dang (5-6 hrs). Limited facilities — carry cash.",
    },
    "surkhet": {
        "foods": [
            {"name": "Sel Roti & Local Thali", "where": "Birendranagar restaurants", "why": "Standard Nepali thali with western hill flavors", "season": "All year"},
        ],
        "places": [
            {"name": "Birendranagar", "type": "City", "why": "Karnali Province capital, pleasant valley town, growing infrastructure", "time": "All year"},
            {"name": "Bulbule Taal", "type": "Lake/Nature", "why": "Small scenic lake near Birendranagar, popular picnic spot", "time": "Oct-Mar"},
            {"name": "Deuti Bajai Temple", "type": "Religious", "why": "Historic Bhagwati temple with local significance", "time": "All year"},
        ],
        "culture": [{"name": "Western Hill Culture", "when": "Year-round", "why": "Mix of Chhetri, Thakuri, Magar communities with distinct western customs"}],
        "tips": "Surkhet has airport. Gateway to Rara Lake and Karnali region. Pleasant climate year-round.",
    },
    "dailekh": {
        "foods": [
            {"name": "Dhido & Chukauni", "where": "Local eateries", "why": "Traditional dhido with chukauni (yogurt-potato dish) — western specialty", "season": "All year"},
        ],
        "places": [
            {"name": "Dailekh Bazaar", "type": "Town", "why": "Historic market town, administrative center of the district", "time": "Oct-Mar"},
            {"name": "Dwari Area", "type": "Nature/Heritage", "why": "Ancient ruins and scenic hilltop views", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Deuda Folk Music", "when": "Year-round, festivals", "why": "Dailekh is heartland of Deuda — call-and-response folk song tradition of far/mid-west Nepal"}],
        "tips": "Remote district. Deuda music is a must-experience. Limited tourist services.",
    },
    "jajarkot": {
        "foods": [
            {"name": "Dhido & Wild Nettle Soup (Sisnu)", "where": "Local homes", "why": "Nutritious wild nettle soup paired with millet/buckwheat dhido — mountain diet", "season": "All year"},
        ],
        "places": [
            {"name": "Jajarkot Fort (Khalanga Gadhi)", "type": "Heritage", "why": "Ancient fortress ruins of the Jajarkot Kingdom, one of the 22 historical kingdoms", "time": "Oct-Mar"},
            {"name": "Bheri River", "type": "Nature", "why": "Scenic river valley with remote fishing and rafting potential", "time": "Oct-Nov"},
        ],
        "culture": [{"name": "Jajarkot Kingdom Heritage", "when": "Year-round", "why": "One of Nepal's former 22 kingdoms with rich feudal history and Magar/Chhetri culture"}],
        "tips": "Very remote — no airport nearby. Bus from Surkhet (8+ hrs rough road). For serious explorers only.",
    },
    "dolpa": {
        "foods": [
            {"name": "Buckwheat Dhido & Yak Butter Tea", "where": "Local homes in Dunai, Phoksundo area", "why": "High-altitude Tibetan-influenced cuisine, essential for cold climate survival", "season": "Jun-Oct (accessible season)"},
        ],
        "places": [
            {"name": "Shey Phoksundo Lake", "type": "Lake/National Park", "why": "Nepal's deepest lake (145m) — stunning turquoise, no outlet, sacred Bon Po site", "time": "Jun-Oct"},
            {"name": "Shey Gompa", "type": "Religious", "why": "Ancient Bon Po monastery, setting of Peter Matthiessen's 'The Snow Leopard'", "time": "Aug-Oct"},
            {"name": "Crystal Mountain", "type": "Mountain/Sacred", "why": "Sacred Bon Po mountain, snow leopard habitat, extremely remote", "time": "Aug-Oct"},
        ],
        "culture": [{"name": "Bon Po / Tibetan Buddhist Culture", "when": "Year-round", "why": "One of the last practicing Bon Po communities, pre-Buddhist Tibetan religion"}],
        "tips": "Upper Dolpa permit: USD 500/10 days. Lower Dolpa: USD 20/week. Fly Nepalgunj→Juphal. Extremely remote — carry everything.",
    },
    "jumla": {
        "foods": [
            {"name": "Jumli Marshi (Red Rice)", "where": "Local restaurants and homes", "why": "World's highest-altitude rice — nutty, organic, unique to Jumla (2370m)", "season": "Oct-Nov harvest"},
            {"name": "Apple & Walnut Products", "where": "Local farms", "why": "Jumla apples and walnuts are prized — organic high-altitude produce", "season": "Sep-Oct"},
        ],
        "places": [
            {"name": "Rara Lake", "type": "Lake/National Park", "why": "Nepal's largest lake (10.8 sq km) at 2990m — pristine, remote, breathtaking", "time": "Sep-Nov, Mar-May"},
            {"name": "Jumla Bazaar", "type": "Town", "why": "Remote district HQ, one of the highest rice-growing areas on Earth", "time": "May-Nov"},
        ],
        "culture": [{"name": "Malla Kingdom Heritage", "when": "Year-round", "why": "Ancient western Malla kingdom ruins, unique Karnali cultural traditions"}],
        "tips": "Fly Nepalgunj→Jumla (45 min). Rara Lake is 2-3 day trek from Jumla. Altitude: 2370m — acclimatize.",
    },
    "kalikot": {
        "foods": [
            {"name": "Dhido & Wild Herbs", "where": "Local eateries in Manma", "why": "Traditional mountain cuisine with wild Himalayan herbs and spices", "season": "All year"},
        ],
        "places": [
            {"name": "Manma", "type": "Town", "why": "Dramatic hilltop district HQ perched above Karnali river gorge", "time": "Oct-Mar"},
            {"name": "Karnali River Corrgidor", "type": "Nature", "why": "Deep river gorge, potential for extreme whitewater rafting", "time": "Oct-Nov"},
        ],
        "culture": [{"name": "Karnali Culture", "when": "Year-round", "why": "Ancient Khas Arya traditions, Deuda folk songs, and remote mountain lifestyle"}],
        "tips": "Extremely remote. Road from Surkhet (12-14 hrs). For adventure travelers only. Carry cash and supplies.",
    },
    "mugu": {
        "foods": [
            {"name": "Buckwheat Dhido & Yak Products", "where": "Local homes in Gamgadhi", "why": "High-altitude diet — buckwheat, barley, yak butter, dried meat", "season": "All year"},
        ],
        "places": [
            {"name": "Rara Lake (Mugu side)", "type": "Lake/National Park", "why": "Western shore of Rara Lake — Nepal's largest and most pristine lake", "time": "Sep-Nov, Mar-May"},
            {"name": "Gamgadhi", "type": "Town", "why": "Remote district HQ, one of Nepal's most isolated towns, near Rara Lake", "time": "May-Nov"},
        ],
        "culture": [{"name": "Khas & Tibetan-influenced Culture", "when": "Year-round", "why": "Remote communities with ancient Khas Arya and Tibetan cultural practices"}],
        "tips": "One of Nepal's most remote districts. Fly Nepalgunj→Talcha or trek from Jumla. No road access to much of the district.",
    },
    "humla": {
        "foods": [
            {"name": "Tibetan-style Thukpa & Tsampa", "where": "Local homes and lodges", "why": "Tibetan-influenced diet — roasted barley flour, butter tea, noodle soup", "season": "Jun-Oct"},
        ],
        "places": [
            {"name": "Simikot", "type": "Town/Trek Start", "why": "Remote district HQ, gateway to Kailash Mansarovar via Hilsa border", "time": "Jun-Sep"},
            {"name": "Limi Valley", "type": "Valley/Heritage", "why": "Isolated valley with Tibetan culture, ancient gompas, incredible remoteness", "time": "Jul-Sep"},
            {"name": "Mt. Kailash Access (via Hilsa)", "type": "Religious/Border", "why": "Nepal route to sacred Mt. Kailash in Tibet, used by Hindu/Buddhist pilgrims", "time": "Jun-Sep"},
        ],
        "culture": [{"name": "Tibetan Buddhist Culture", "when": "Year-round", "why": "Humla's northern villages are essentially Tibetan — monasteries, prayer flags, yak herders"}],
        "tips": "Most remote district in Nepal. Fly Nepalgunj→Simikot. No road network. Mt. Kailash pilgrimage requires special permits.",
    },

    # ╔═══════════════════════════════════════════════════════════════════════╗
    # ║  SUDURPASHCHIM PROVINCE (Province 7) — 9 districts                 ║
    # ╚═══════════════════════════════════════════════════════════════════════╝

    "bajura": {
        "foods": [
            {"name": "Dhido & Kodo (Millet) Preparations", "where": "Local homes", "why": "Millet-based traditional food, essential in this food-scarce region", "season": "All year"},
        ],
        "places": [
            {"name": "Badimalika Temple", "type": "Religious", "why": "Famous Bhagwati temple at 4200m — major pilgrimage site of far-western Nepal", "time": "Jul-Aug (Janai Purnima)"},
            {"name": "Kolti", "type": "Historical", "why": "Ancient capital of the Doti Kingdom with historical ruins and inscriptions", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Far-Western Hill Culture & Deuda", "when": "Year-round", "why": "Heartland of Deuda folk tradition — singing, dancing, and call-and-response poetry"}],
        "tips": "Extremely remote. Badimalika pilgrimage in monsoon is challenging but rewarding. Very limited infrastructure.",
    },
    "bajhang": {
        "foods": [
            {"name": "Dhido & Sisnu (Nettle)", "where": "Local homes and eateries", "why": "Wild nettle soup with millet dhido — nutritious mountain staple", "season": "All year"},
        ],
        "places": [
            {"name": "Chainpur", "type": "Town", "why": "District HQ, historic bazaar town in far-western hills", "time": "Oct-Mar"},
            {"name": "Saipal Himal", "type": "Mountain", "why": "Majestic 7031m peak — one of the most remote and rarely climbed major peaks", "time": "Oct-Nov (expedition)"},
        ],
        "culture": [{"name": "Deuda & Khas Traditions", "when": "Year-round", "why": "Rich Deuda folk music, far-western Khas cultural traditions"}],
        "tips": "Very remote. Limited road access. Fly Dhangadhi→Chainpur or long bus journey. Carry all supplies.",
    },
    "achham": {
        "foods": [
            {"name": "Dhido & Local Lentils", "where": "Local eateries in Mangalsen", "why": "Traditional hill cuisine with locally grown lentils and greens", "season": "All year"},
        ],
        "places": [
            {"name": "Mangalsen", "type": "Town", "why": "District HQ, historic administrative center with temple ruins", "time": "Oct-Mar"},
            {"name": "Sanfebagar", "type": "Town/Airport", "why": "Far-western town with a small airport, gateway to Achham", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Deuda & Bhagwati Worship", "when": "Year-round, Dashain", "why": "Far-western hill traditions — elaborate Dashain celebrations, Deuda poetry"}],
        "tips": "Remote district. Air service to Sanfebagar from Dhangadhi/Nepalgunj. Limited tourist facilities.",
    },
    "doti": {
        "foods": [
            {"name": "Dhido & Bhatt (Soybean) Curry", "where": "Local eateries in Dipayal", "why": "Traditional far-western meal with soybean preparations", "season": "All year"},
        ],
        "places": [
            {"name": "Dipayal-Silgadhi", "type": "Town", "why": "District HQ, growing town in far-western hills", "time": "Oct-Mar"},
            {"name": "Khaptad National Park (access from Doti)", "type": "Nature/National Park", "why": "Pristine highland meadows, medicinal herbs, created by saint Khaptad Baba", "time": "Mar-May, Sep-Nov"},
        ],
        "culture": [{"name": "Far-Western Traditions & Khaptad Baba Legacy", "when": "Year-round", "why": "Spiritual legacy of Khaptad Baba (Nepal's famous sage), Deuda culture"}],
        "tips": "Khaptad NP is a hidden gem — rhododendrons and meadows. Bus from Dhangadhi (8-10 hrs). Remote but magical.",
    },
    "kailali": {
        "foods": [
            {"name": "Tharu Cuisine & Street Food", "where": "Dhangadhi restaurants and street vendors", "why": "Tharu fish curry, dhikri, plus diverse street food scene in growing city", "season": "All year"},
        ],
        "places": [
            {"name": "Dhangadhi", "type": "City", "why": "Largest city of far-western Nepal, airport, gateway to Khaptad and Api peaks", "time": "Oct-Mar"},
            {"name": "Ghodaghodi Lake", "type": "Lake/Wetland", "why": "Ramsar-listed oxbow lake complex — excellent birdwatching, crocodiles", "time": "Oct-Feb"},
            {"name": "Tikapur", "type": "Town/Nature", "why": "Tharu cultural center with nearby forests and wetlands", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Tharu & Rana Tharu Culture", "when": "Year-round, Maghi in Jan", "why": "Rana Tharu community with unique customs, colorful traditional dress, Maghi festivals"}],
        "tips": "Dhangadhi has airport. Gateway to far-western attractions. Hot summers but pleasant winters.",
    },
    "kanchanpur": {
        "foods": [
            {"name": "Tharu Fish Curry & Ghonghi", "where": "Local Tharu restaurants, Mahendranagar area", "why": "Tharu-style river snail and fish preparations", "season": "All year"},
        ],
        "places": [
            {"name": "Shuklaphanta National Park", "type": "Wildlife/National Park", "why": "Vast grasslands with swamp deer herds, Bengal tiger, wild elephant — less visited", "time": "Oct-Mar"},
            {"name": "Mahendranagar", "type": "City/Border", "why": "Nepal's far-western border town, gateway to Shuklaphanta", "time": "Oct-Mar"},
        ],
        "culture": [{"name": "Rana Tharu Culture", "when": "Year-round", "why": "Unique Rana Tharu community with elaborate customs, traditional architecture, and tattoo traditions"}],
        "tips": "Shuklaphanta is Nepal's best-kept wildlife secret — far fewer tourists than Chitwan. Mahendranagar has India border crossing.",
    },
    "dadeldhura": {
        "foods": [
            {"name": "Dhido & Local Preparations", "where": "Local eateries in Amargadhi", "why": "Far-western hill cuisine, simple and wholesome", "season": "All year"},
        ],
        "places": [
            {"name": "Amargadhi Fort", "type": "Heritage", "why": "Ruins of the capital of the old Doti Kingdom, hilltop panoramic views", "time": "Oct-Mar"},
            {"name": "Ugratara Temple", "type": "Religious", "why": "Important goddess temple, pilgrimage site for far-western devotees", "time": "All year"},
        ],
        "culture": [{"name": "Doteli Culture", "when": "Year-round", "why": "Unique Doteli language and customs, far-western hill identity, Deuda traditions"}],
        "tips": "On the Mahakali Highway. Bus from Dhangadhi (4-5 hrs). Limited tourist facilities.",
    },
    "baitadi": {
        "foods": [
            {"name": "Dhido & Bhatt preparations", "where": "Local eateries in Dasharathchand", "why": "Traditional far-western hill food with soybean curries", "season": "All year"},
        ],
        "places": [
            {"name": "Dasharathchand (Patan)", "type": "Town/Heritage", "why": "District HQ, once capital of far-western kingdoms, temple heritage", "time": "Oct-Mar"},
            {"name": "Tripura Sundari Temple", "type": "Religious", "why": "Important Shakti peeth, major far-western pilgrimage site", "time": "All year, Navaratri"},
        ],
        "culture": [{"name": "Tripura Sundari Worship", "when": "Year-round, Navaratri", "why": "Major goddess worship tradition — elaborate rituals during Dashain and Navaratri"}],
        "tips": "Historic far-western district. Bus from Dhangadhi (7-8 hrs). Remote but culturally rich.",
    },
    "darchula": {
        "foods": [
            {"name": "Tibetan-influenced Cuisine", "where": "Local eateries in Khalanga (Darchula)", "why": "Mix of far-western hill and Tibetan-influenced food near the border", "season": "All year"},
        ],
        "places": [
            {"name": "Api Himal (7132m)", "type": "Mountain", "why": "Nepal's far-western sentinel peak, stunning and rarely visited", "time": "Oct-Nov (expedition)"},
            {"name": "Khalanga (Darchula)", "type": "Town", "why": "District HQ on Mahakali river, border town with India's Pithoragarh", "time": "Oct-Mar"},
            {"name": "Api Nampa Conservation Area", "type": "Nature", "why": "Pristine conservation area with snow leopard, red panda, diverse flora", "time": "Oct-Apr"},
        ],
        "culture": [{"name": "Bhotia/Shauka Trading Culture", "when": "Year-round", "why": "Ancient trans-Himalayan traders with Tibetan and Indo-Aryan cultural mix"}],
        "tips": "Nepal's far-western tip. Very remote. Bus from Dhangadhi (10-12 hrs). Near Om Parvat (visible from India side).",
    },

    # ── Special entry: Lumbini (UNESCO site, spans Rupandehi) ────────────
    "lumbini": {
        "foods": [
            {"name": "Tharu Cuisine", "where": "Local Tharu restaurants in Lumbini area", "why": "Indigenous Tharu fish curry, dhikri, and seasonal vegetables", "season": "All year"},
        ],
        "places": [
            {"name": "Maya Devi Temple", "type": "Religious/UNESCO", "why": "Birthplace of Lord Buddha, exact location marked with Nativity Sculpture", "time": "All year"},
            {"name": "Ashoka Pillar", "type": "Historical", "why": "Emperor Ashoka's pillar marking Buddha's birthplace (249 BC)", "time": "All year"},
            {"name": "World Peace Flame & Monastery Zone", "type": "Monument", "why": "Eternal peace flame and monasteries from 25+ countries in East/West monastic zones", "time": "All year"},
        ],
        "culture": [{"name": "Buddha Jayanti", "when": "May (full moon)", "why": "Grand celebration of Buddha's birthday with pilgrims from around the world"}],
        "tips": "Very hot in summer (Apr-Jun) — visit Oct-Feb. Cycle rickshaws available. Free entry to sacred garden area.",
    },
}


# ══════════════════════════════════════════════════════════════════════════════
#  SEARCH & RETRIEVAL
# ══════════════════════════════════════════════════════════════════════════════

def _is_travel_related(query: str) -> bool:
    """Check if the query is plausibly related to Nepal travel."""
    q = query.lower().strip()
    # Very short or gibberish — not travel related
    words = re.findall(r'\b[a-z]{2,}\b', q)
    if len(words) == 0:
        return False

    # Strong travel signals — any ONE of these is enough
    strong_signals = {
        "travel", "trip", "visit", "tour", "explore", "sightseeing",
        "food", "eat", "cuisine", "restaurant", "dish", "momo", "thali", "dal",
        "place", "places", "destination", "spot",
        "trek", "trekking", "treks", "hike", "hiking", "trail", "mountain", "climb",
        "temple", "monastery", "stupa", "heritage", "culture", "festival",
        "hotel", "stay", "accommodation", "lodge", "hostel", "homestay",
        "bus", "flight", "transport", "permit", "visa",
        "nepal", "nepali", "kathmandu", "pokhara",
        "tip", "tips", "advice", "recommend", "suggestion",
        "itinerary", "plan", "guide", "safari",
        "things", "activities", "adventure", "view", "lake", "river",
        "jungle", "wildlife", "park", "national",
        "district", "province", "region", "city", "town", "village",
    }
    word_set = set(words)
    if word_set & strong_signals:
        return True

    # If query contains a known district name or alias → travel
    all_known = set(POPULAR_DATA.keys()) | set(_BY_DISTRICT.keys()) | set(_DISTRICT_ALIASES.keys())
    for name in all_known:
        if re.search(r'\b' + re.escape(name) + r'\b', q):
            return True

    # Fuzzy check: see if any word is close to a district name
    all_district_names = list(POPULAR_DATA.keys()) + list(_DISTRICT_ALIASES.keys())
    for w in words:
        if len(w) >= 4:
            matches = get_close_matches(w, all_district_names, n=1, cutoff=0.75)
            if matches:
                return True

    return False


def _fuzzy_match_district(word: str) -> Optional[str]:
    """Try to fuzzy-match a word to a known district name or alias."""
    if len(word) < 4:
        return None
    all_names = list(POPULAR_DATA.keys()) + list(_DISTRICT_ALIASES.keys())
    matches = get_close_matches(word, all_names, n=1, cutoff=0.75)
    if matches:
        match = matches[0]
        # If it's an alias, resolve it
        return _DISTRICT_ALIASES.get(match, match)
    return None


def _extract_districts_from_query(query: str) -> List[str]:
    """Extract district names from query using exact + fuzzy matching."""
    q = query.lower()
    found = set()

    # 1. Exact word-boundary match against known districts
    for d in list(POPULAR_DATA.keys()) + list(_BY_DISTRICT.keys()):
        if re.search(r'\b' + re.escape(d) + r'\b', q):
            found.add(d)
    # 2. Exact match against aliases
    for alias, canonical in _DISTRICT_ALIASES.items():
        if re.search(r'\b' + re.escape(alias) + r'\b', q):
            found.add(canonical)

    # 3. If no exact match, try fuzzy matching on individual words
    if not found:
        words = re.findall(r'\b[a-z]{4,}\b', q)
        for w in words:
            # Skip common English words that aren't place names
            if w in {"what", "where", "when", "which", "that", "this", "with",
                     "from", "about", "best", "good", "tell", "show", "some",
                     "visit", "food", "place", "places", "trek", "things",
                     "should", "travel", "trip", "recommend", "like", "want",
                     "know", "nepal", "nepali", "special", "famous", "popular",
                     "help", "guide", "need", "your", "have", "been", "going"}:
                continue
            match = _fuzzy_match_district(w)
            if match:
                found.add(match)

    return list(found)


def _format_csv_row(row: Dict, idx: int) -> str:
    """Format a single CSV row into clean text for LLM context (no ugly labels)."""
    lines = []
    district = row.get(COL["district"], "").strip()
    rating = row.get(COL["rating"], "").strip()

    food = row.get(COL["food"], "").strip()
    if food:
        where = row.get(COL["food_where"], "").strip()
        why = row.get(COL["food_why"], "").strip()
        season = row.get(COL["food_season"], "").strip()
        lines.append(f"  🍽️ Food: {food}")
        if where: lines.append(f"    Where: {where}")
        if _is_quality_text(why): lines.append(f"    Note: {why[:150]}")
        if season: lines.append(f"    Season: {season}")

    place = row.get(COL["place"], "").strip()
    if place:
        ptype = row.get(COL["place_type"], "").strip()
        pwhy = row.get(COL["place_why"], "").strip()
        time = row.get(COL["visit_time"], "").strip()
        acts = row.get(COL["activities"], "").strip()
        lines.append(f"  📍 Place: {place}" + (f" ({ptype})" if ptype else ""))
        if _is_quality_text(pwhy): lines.append(f"    Special: {pwhy[:150]}")
        if time: lines.append(f"    Best time: {time}")
        if acts: lines.append(f"    Activities: {acts}")

    culture = row.get(COL["culture"], "").strip()
    if culture:
        cwhen = row.get(COL["culture_when"], "").strip()
        cwhy = row.get(COL["culture_why"], "").strip()
        lines.append(f"  🎭 Culture: {culture}")
        if cwhen: lines.append(f"    When: {cwhen}")
        if _is_quality_text(cwhy): lines.append(f"    Why: {cwhy[:150]}")

    tips = row.get(COL["tips"], "").strip()
    suit = row.get(COL["suitability"], "").strip()
    pitch = row.get(COL["pitch"], "").strip()
    if _is_quality_text(tips): lines.append(f"  ⚠️ Tips: {tips[:150]}")
    if suit: lines.append(f"  Suitability: {suit}")
    if _is_quality_text(pitch, 25): lines.append(f"  Highlight: {pitch[:150]}")

    if not lines:
        return ""

    header = f"--- {district.title()}"
    if rating:
        try:
            if int(rating) >= 3: header += f" (Rating: {rating}/5)"
        except ValueError:
            pass
    header += " ---"
    return header + "\n" + "\n".join(lines)


def _format_popular_entry(district: str, data: Dict) -> str:
    """Format popular data for a district (clean LLM context, no labels)."""
    lines = [f"--- {district.title()} (Curated Guide) ---"]

    if "foods" in data:
        for f in data["foods"]:
            lines.append(f"  🍽️ {f['name']} — {f['why']}")
            lines.append(f"    Where: {f['where']} | Season: {f['season']}")

    if "places" in data:
        for p in data["places"]:
            lines.append(f"  📍 {p['name']} ({p['type']}) — {p['why']}")
            lines.append(f"    Best time: {p['time']}")

    if "culture" in data:
        for c in data["culture"]:
            lines.append(f"  🎭 {c['name']} ({c['when']}) — {c['why']}")

    if "tips" in data:
        lines.append(f"  ⚠️ Tips: {data['tips']}")

    return "\n".join(lines)


def search(query: str, top_k: int = 5) -> str:
    """
    Search the knowledge base. Returns formatted context string for LLM.
    Priority: curated popular data → quality CSV data → keyword fallback.
    """
    parts = []

    # 1. Extract districts from query
    districts = _extract_districts_from_query(query)

    # 2. For matched districts, get curated POPULAR data first (highest quality)
    for d in districts:
        if d in POPULAR_DATA:
            parts.append(_format_popular_entry(d, POPULAR_DATA[d]))

    # 3. Supplement with quality-filtered CSV data
    csv_shown = 0
    for d in districts:
        rows = _BY_DISTRICT.get(d, [])
        # Sort by rating (higher first)
        rated = []
        for r in rows:
            try: score = float(r.get(COL["rating"], "0"))
            except: score = 0
            rated.append((score, r))
        rated.sort(key=lambda x: x[0], reverse=True)
        for _, row in rated[:3]:
            fmt = _format_csv_row(row, csv_shown + 1)
            if fmt:
                parts.append(fmt)
                csv_shown += 1

    # 4. If no district match, do keyword search on CSV
    if not parts:
        q_lower = query.lower()
        tokens = re.findall(r"\b\w{3,}\b", q_lower)
        scored = []
        for row in _DATA:
            text = " ".join(v.lower() for v in row.values() if v.strip())
            score = sum(1 for t in tokens if t in text)
            # Boost by rating
            try: score += float(row.get(COL["rating"], "0")) * 0.3
            except: pass
            if score > 0:
                scored.append((score, row))
        scored.sort(key=lambda x: x[0], reverse=True)
        for i, (_, row) in enumerate(scored[:top_k]):
            fmt = _format_csv_row(row, i + 1)
            if fmt:
                parts.append(fmt)

    # 5. If still nothing, add general popular data hints
    if not parts:
        # Add Kathmandu and Pokhara as defaults (most popular destinations)
        for d in ["kathmandu", "kaski"]:
            parts.append(_format_popular_entry(d, POPULAR_DATA[d]))

    return "\n\n".join(parts) if parts else "No data found for this query."


# ══════════════════════════════════════════════════════════════════════════════
#  PRETTY RESPONSE BUILDER — for direct user display (template fallback)
# ══════════════════════════════════════════════════════════════════════════════

def build_travel_response(query: str) -> str:
    """
    Build a beautifully formatted travel guide response for direct display.
    Used by the template fallback when the LLM is unavailable.
    Groups by category, deduplicates, and filters junk data.
    Returns empty string if the query is not travel-related or too vague.
    """
    # ── Gate: reject non-travel queries early ──
    if not _is_travel_related(query):
        return ""

    districts = _extract_districts_from_query(query)
    category = _detect_category(query)

    # If no district found, try smart topic-based matching
    if not districts:
        q_lower = query.lower()
        q_words = set(re.findall(r"\b\w{3,}\b", q_lower))

        # Topic-based defaults for common generic queries
        trek_words = {"trek", "trekking", "treks", "hike", "hiking", "trail", "trails",
                      "mountain", "mountains", "climb", "climbing", "summit", "pass",
                      "basecamp", "base", "camp", "circuit", "annapurna", "everest",
                      "langtang", "manaslu"}
        food_words = {"food", "foods", "eat", "eating", "cuisine", "restaurant",
                      "dish", "dishes", "taste", "momo", "momos", "dal", "bhat",
                      "thali", "drink", "tea", "coffee"}
        culture_words = {"culture", "festival", "festivals", "heritage", "temple",
                         "temples", "tradition", "traditions", "monastery", "dashain",
                         "tihar", "holi", "jatra"}

        if trek_words & q_words:
            districts = ["solukhumbu", "myagdi", "manang", "mustang", "lamjung"]
        elif food_words & q_words:
            districts = ["kathmandu", "kaski", "bhaktapur"]
        elif culture_words & q_words:
            districts = ["kathmandu", "bhaktapur", "lalitpur"]
        else:
            # Only fall back to CSV if we have genuine content words (not just "nepal")
            # and require a meaningful score match
            tokens = [t for t in re.findall(r"\b\w{3,}\b", q_lower)
                      if t not in {"nepal", "nepali", "best", "good", "tell",
                                   "about", "what", "the", "and", "for", "how"}]
            if not tokens:
                return ""  # Too vague — nothing specific to search for

            best_district = None
            best_score = 0
            for row in _DATA:
                text = " ".join(v.lower() for v in row.values() if v.strip())
                score = sum(1 for t in tokens if t in text)
                try:
                    score += float(row.get(COL["rating"], "0")) * 0.3
                except:
                    pass
                if score > best_score and row["_district"]:
                    best_score = score
                    best_district = row["_district"]

            # Require minimum score of 2 to avoid random matches
            if best_district and best_score >= 2:
                districts = [best_district]
            else:
                return ""  # Not enough confidence to show results

    # ── Collect all data, deduplicated ──
    all_foods = []
    all_places = []
    all_culture = []
    all_tips = []
    seen_food = set()
    seen_place = set()
    seen_culture = set()

    for d in districts:
        # Curated data (highest quality, always included)
        if d in POPULAR_DATA:
            pop = POPULAR_DATA[d]
            if "foods" in pop:
                for f in pop["foods"]:
                    key = f["name"].lower()
                    if key not in seen_food:
                        seen_food.add(key)
                        all_foods.append({
                            "name": f["name"], "where": f["where"],
                            "why": f["why"], "season": f["season"],
                        })
            if "places" in pop:
                for p in pop["places"]:
                    key = p["name"].lower()
                    if key not in seen_place:
                        seen_place.add(key)
                        all_places.append({
                            "name": p["name"], "type": p["type"],
                            "why": p["why"], "time": p["time"],
                        })
            if "culture" in pop:
                for c in pop["culture"]:
                    key = c["name"].lower()
                    if key not in seen_culture:
                        seen_culture.add(key)
                        all_culture.append({
                            "name": c["name"], "when": c["when"],
                            "why": c["why"],
                        })
            if "tips" in pop:
                all_tips.append(pop["tips"])

        # Supplement with quality-filtered CSV data ONLY if no curated POPULAR_DATA
        # (POPULAR_DATA covers all 77 districts — CSV is noisy and only used as fallback)
        if d not in POPULAR_DATA:
            rows = _BY_DISTRICT.get(d, [])
            rated = []
            for r in rows:
                try:
                    sc = float(r.get(COL["rating"], "0"))
                except:
                    sc = 0
                rated.append((sc, r))
            rated.sort(key=lambda x: x[0], reverse=True)

            csv_food_added = 0
            csv_place_added = 0
            csv_culture_added = 0
            for _, row in rated[:4]:
                food = row.get(COL["food"], "").strip()
                if food and food.lower() not in seen_food and _is_valid_name(food) and csv_food_added < 2:
                    why = row.get(COL["food_why"], "").strip()
                    if _is_quality_text(why, 30):
                        seen_food.add(food.lower())
                        csv_food_added += 1
                        all_foods.append({
                            "name": food,
                            "where": row.get(COL["food_where"], "").strip() or "Local eateries",
                            "why": why[:150],
                            "season": row.get(COL["food_season"], "").strip() or "All year",
                        })

                place = row.get(COL["place"], "").strip()
                if place and place.lower() not in seen_place and _is_valid_name(place) and csv_place_added < 2:
                    pwhy = row.get(COL["place_why"], "").strip()
                    if _is_quality_text(pwhy, 30):
                        seen_place.add(place.lower())
                        csv_place_added += 1
                        all_places.append({
                            "name": place,
                            "type": row.get(COL["place_type"], "").strip() or "Place",
                            "why": pwhy[:150],
                            "time": row.get(COL["visit_time"], "").strip() or "Oct-Mar",
                        })

                culture = row.get(COL["culture"], "").strip()
                if culture and culture.lower() not in seen_culture and _is_valid_name(culture, 80) and csv_culture_added < 2:
                    cwhy = row.get(COL["culture_why"], "").strip()
                    if _is_quality_text(cwhy, 30):
                        seen_culture.add(culture.lower())
                        csv_culture_added += 1
                        all_culture.append({
                            "name": culture,
                            "when": row.get(COL["culture_when"], "").strip() or "Various",
                            "why": cwhy[:150],
                        })

                tips = row.get(COL["tips"], "").strip()
                if _is_quality_text(tips, 30):
                    all_tips.append(tips[:150])

    # ── Build professional, friendly response ──
    district_names = [d.replace("_", " ").title() for d in districts]
    display_name = district_names[0] if len(districts) == 1 else ", ".join(district_names)

    # Determine max items per category based on query focus
    food_limit = 5 if category == "food" else 3
    place_limit = 5 if category == "place" else 3
    culture_limit = 4 if category == "culture" else 2

    lines = []

    # Friendly, context-aware introduction
    if len(districts) == 1:
        dn = district_names[0]
        if category == "food":
            lines.append(f"## 🍽️ What to Eat in {dn}\n")
            lines.append(f"Great choice! {dn} has some wonderful food worth trying. Here's what I'd recommend:\n")
        elif category == "place":
            lines.append(f"## 🏔️ Top Places in {dn}\n")
            lines.append(f"There's so much to explore in {dn}! Here are the highlights:\n")
        elif category == "culture":
            lines.append(f"## 🎭 Culture & Heritage of {dn}\n")
            lines.append(f"{dn} has a rich cultural heritage. Here's what makes it special:\n")
        else:
            lines.append(f"## 🏔️ Your Guide to {dn}\n")
            lines.append(f"Here's everything you need to know for a great trip to {dn}:\n")
    else:
        lines.append(f"## 🏔️ Travel Guide: {display_name}\n")
        lines.append(f"Here's what you need to know about these destinations:\n")

    # Build sections in order based on category focus
    sections = []
    if category == "food":
        sections = ["food", "place", "culture"]
    elif category == "place":
        sections = ["place", "food", "culture"]
    elif category == "culture":
        sections = ["culture", "food", "place"]
    else:
        sections = ["food", "place", "culture"]

    has_content = False
    for sec in sections:
        if sec == "food" and all_foods:
            has_content = True
            lines.append("### 🍽️ Must-Try Foods\n")
            for f in all_foods[:food_limit]:
                lines.append(f"- **{f['name']}**: {f['why']}  ")
                lines.append(f"  📍 {f['where']} | 🕐 {f['season']}")
                lines.append("")

        elif sec == "place" and all_places:
            has_content = True
            lines.append("### 📍 Must-Visit Places\n")
            for p in all_places[:place_limit]:
                lines.append(f"- **{p['name']}** *({p['type']})*: {p['why']}  ")
                lines.append(f"  🕐 Best time: {p['time']}")
                lines.append("")

        elif sec == "culture" and all_culture:
            has_content = True
            lines.append("### 🎭 Culture & Festivals\n")
            for c in all_culture[:culture_limit]:
                lines.append(f"- **{c['name']}** *({c['when']})*: {c['why']}")
                lines.append("")

    if all_tips:
        has_content = True
        lines.append("### 💡 Practical Tips\n")
        unique_tips = list(dict.fromkeys(all_tips))
        for t in unique_tips[:3]:
            lines.append(f"- {t}")
        lines.append("")

    if not has_content:
        return ""

    lines.append("---")
    lines.append("Feel free to ask me about any specific district, food, trek, or activity in Nepal. I'm happy to help you plan your trip! 🙏")

    result = "\n".join(lines)
    # Strip em dashes from all output
    result = result.replace(" — ", " - ").replace("— ", "- ").replace(" —", " -")
    return result


def get_stats() -> str:
    unique_districts = len(set(r["_district"] for r in _DATA if r["_district"]))
    return f"{len(_DATA)} survey entries across {unique_districts} districts + {len(POPULAR_DATA)} popular district guides"


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys; sys.stdout.reconfigure(encoding="utf-8")
    print(f"Loaded: {get_stats()}")
    print("\n--- Search: 'Pokhara food' ---")
    print(search("Pokhara food"))
    print("\n--- Search: 'Kathmandu temples' ---")
    print(search("Kathmandu temples"))
    print("\n--- Search: 'Parbat' ---")
    print(search("Parbat"))
