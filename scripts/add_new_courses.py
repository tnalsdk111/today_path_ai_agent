#!/usr/bin/env python3
"""Add 5 new courses from courses_4.kml to courses.json with GIS enrichment."""

import csv, json, math, os, sys
import xml.etree.ElementTree as ET
import polyline as pl

# Allow 'from scripts.gis_process import ...' from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.gis_process import (
    load_shp, buffer_wgs84, make_line_4326,
    process_slope_grade, process_shade_ratio, process_biotope_grade,
    process_eco_axis, process_vegetation, process_park_entrances, process_shelter_nearby,
)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GIS_BASE = os.path.join(BASE, 'gis_data')

BIOTOPE_PATH     = os.path.join(GIS_BASE, '도시생태현황지도/용인시_도시생태현황지도.shp')
VEG_PATH         = os.path.join(GIS_BASE, '도시생태현황지도/용인시_현존식생도.shp')
PARK_ENT_PATH    = os.path.join(GIS_BASE, '공원DB/용인시_근린공원_공원입구.shp')
SHELTER_PATH     = os.path.join(GIS_BASE, '공원DB/용인시_무더위심터현황.shp')
PARK_BOUNDS_PATH = os.path.join(GIS_BASE, '공원DB/용인시_근린공원_경계.shp')
COURSES_JSON     = os.path.join(BASE, 'data', 'courses.json')
KML_PATH         = os.path.join(BASE, 'scripts', 'input', 'courses_4.kml')
TOILET_CSV       = os.path.join(BASE, 'scripts', 'input', 'toilets.csv')

# ── Course metadata ────────────────────────────────────────────────────────────
FOLDER_META = {
    '동천동 근린공원':       {'id': 'course-4-01', 'name': '동천동 근린공원',       'dong': '동천동'},
    '죽전 중앙공원':         {'id': 'course-4-02', 'name': '죽전 중앙공원',         'dong': '죽전1동'},
    '수지 체육공원':         {'id': 'course-4-03', 'name': '수지 체육공원',         'dong': '풍덕천1동'},
    '용인 아르피아 체육공원': {'id': 'course-4-04', 'name': '용인 아르피아 체육공원', 'dong': '죽전2동'},
    '상현공원':              {'id': 'course-4-05', 'name': '상현공원',              'dong': '상현2동'},
}
FOLDER_ORDER = ['동천동 근린공원', '죽전 중앙공원', '수지 체육공원', '용인 아르피아 체육공원', '상현공원']


# ── Geometry / distance ────────────────────────────────────────────────────────
def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def compute_distance_km(coords) -> float:
    total = sum(haversine(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
                for i in range(len(coords) - 1))
    return round(total, 1)


# ── KML parsing ────────────────────────────────────────────────────────────────
def extract_kml_courses(kml_path: str) -> dict:
    """Return {folder_name: [(lat, lng), ...]} for target folders."""
    NS = 'http://www.opengis.net/kml/2.2'
    tree = ET.parse(kml_path)
    results = {}
    for folder in tree.getroot().iter(f'{{{NS}}}Folder'):
        fname_el = folder.find(f'{{{NS}}}name')
        fname = fname_el.text.strip() if fname_el is not None else ''
        if fname not in FOLDER_META:
            continue
        for pm in folder.iter(f'{{{NS}}}Placemark'):
            ls = pm.find(f'.//{{{NS}}}LineString')
            if ls is None:
                continue
            coords_el = ls.find(f'{{{NS}}}coordinates')
            if coords_el is None or not coords_el.text:
                continue
            coords = []
            for token in coords_el.text.strip().split():
                parts = token.split(',')
                if len(parts) >= 2:
                    coords.append((float(parts[1]), float(parts[0])))  # lat, lng
            if coords:
                results[fname] = coords
                break  # first LineString per folder
    return results


# ── Toilet data ────────────────────────────────────────────────────────────────
def _int_col(row, key):
    try:
        return int(row.get(key, 0) or 0)
    except ValueError:
        return 0


def load_toilets(csv_path: str) -> list:
    for enc in ('cp949', 'utf-8', 'euc-kr'):
        try:
            toilets = []
            with open(csv_path, encoding=enc, newline='') as f:
                for row in csv.DictReader(f):
                    try:
                        lat = float(row['위도'].strip())
                        lng = float(row['경도'].strip())
                    except (ValueError, KeyError):
                        continue
                    if not (35.0 <= lat <= 38.5 and 126.0 <= lng <= 129.5):
                        continue
                    toilets.append({
                        'lat': lat,
                        'lng': lng,
                        'name': row.get('화장실명', '').strip() or '화장실',
                        'accessible':     (_int_col(row, '남성용-장애인용대변기수') >= 1
                                           or _int_col(row, '여성용-장애인용대변기수') >= 1),
                        'children':       (_int_col(row, '남성용-어린이용대변기수') >= 1
                                           or _int_col(row, '여성용-어린이용대변기수') >= 1),
                        'emergency_bell': row.get('비상벨설치여부', '').strip().upper() == 'Y',
                    })
            print(f"화장실 CSV 로드 ({enc}): {len(toilets)}개")
            return toilets
        except (UnicodeDecodeError, LookupError):
            continue
    return []


def find_nearby_toilets(coords, all_toilets, radius_km=0.5) -> list:
    seen, result = set(), []
    for t in all_toilets:
        if min(haversine(lat, lng, t['lat'], t['lng']) for lat, lng in coords) <= radius_km:
            key = (t['name'], round(t['lat'], 5), round(t['lng'], 5))
            if key not in seen:
                seen.add(key)
                result.append({
                    'lat': round(t['lat'], 6), 'lng': round(t['lng'], 6),
                    'name': t['name'],
                    'accessible': t['accessible'],
                    'children': t['children'],
                    'emergency_bell': t['emergency_bell'],
                })
    return result


# ── Derived fields ─────────────────────────────────────────────────────────────
_STREAM_KW = {'하천', '하천림', '강기슭', '하천습지'}


def derive_has_stream(description: str) -> bool:
    return any(kw in description for kw in _STREAM_KW)


def derive_difficulty(slope_grade: float) -> str:
    if slope_grade <= 3.0:
        return 'flat'
    if slope_grade <= 7.0:
        return 'moderate'
    return 'steep'


def derive_themes(description, has_stream, line_4326, biotope_gdf, park_bounds_gdf) -> list:
    themes = set()
    if '호소' in description:
        themes.add('lake')
    if has_stream:
        themes.add('stream')
    if 'MAJ_CL' in biotope_gdf.columns:
        buf_50   = buffer_wgs84(line_4326, 50)
        bio_hits = biotope_gdf[biotope_gdf.geometry.intersects(buf_50)]
        if bio_hits['MAJ_CL'].isin({'자연산림', '식재산림'}).any():
            themes.add('forest')
    if not park_bounds_gdf.empty:
        buf_300 = buffer_wgs84(line_4326, 300)
        if park_bounds_gdf.geometry.intersects(buf_300).any():
            themes.add('park')
    if not themes:
        themes.add('park')
    return sorted(themes)


# ── Course builder ─────────────────────────────────────────────────────────────
def build_base_course(meta, coords, encoded, distance_km, duration_min) -> dict:
    return {
        'id':           meta['id'],
        'name':         meta['name'],
        'dong':         meta['dong'],
        'distance_km':  distance_km,
        'duration_min': duration_min,
        'is_loop':      True,
        'difficulty':   'flat',
        'night_safe':   False,
        'has_stream':   False,
        'themes':       ['park'],
        'facilities':   {'toilets': [], 'park_entrances': []},
        'toilet_count': 0,
        'vegetation':   {'tags': [], 'description': '', 'species': []},
        'slope_grade':  0.0,
        'utci_score':   5.0,
        'shade_ratio':  0.0,
        'biotope_grade': 5,
        'eco_axis':     False,
        'flood_risk':   False,
        'shelter_nearby': False,
        'park_grade':   3,
        'polyline':     encoded,
        'start_point':  {'lat': coords[0][0], 'lng': coords[0][1]},
    }


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("=== Add New Courses Script ===\n")

    # 1. KML 추출
    print("KML 추출 중...")
    kml_coords = extract_kml_courses(KML_PATH)
    for fname, coords in kml_coords.items():
        print(f"  {fname}: {len(coords)}개 좌표")
    print()

    # 2. 화장실 데이터 로드
    all_toilets = load_toilets(TOILET_CSV)
    print()

    # 3. SHP 로드
    print("GIS SHP 로드 중...")
    biotope_gdf     = load_shp(BIOTOPE_PATH)
    veg_gdf         = load_shp(VEG_PATH)
    park_ent_gdf    = load_shp(PARK_ENT_PATH)
    shelter_gdf     = load_shp(SHELTER_PATH)
    park_bounds_gdf = load_shp(PARK_BOUNDS_PATH)
    print(f"  도시생태현황지도 : {len(biotope_gdf)} features")
    print(f"  현존식생도       : {len(veg_gdf)} features")
    print(f"  공원경계         : {len(park_bounds_gdf)} features\n")

    # 4. 코스별 처리
    new_courses = []
    for fname in FOLDER_ORDER:
        coords = kml_coords.get(fname)
        if not coords:
            print(f"WARNING: '{fname}' LineString 없음, 건너뜀\n")
            continue

        meta         = FOLDER_META[fname]
        cid, cname   = meta['id'], meta['name']
        encoded      = pl.encode(coords)
        distance_km  = compute_distance_km(coords)
        duration_min = round(distance_km / 4.0 * 60)

        course    = build_base_course(meta, coords, encoded, distance_km, duration_min)
        line_4326 = make_line_4326(coords)

        print(f"[{cid}] {cname}")

        # GIS 처리
        slope = process_slope_grade(line_4326)
        if slope is not None:
            course['slope_grade'] = slope

        shade = process_shade_ratio(line_4326)
        if shade is not None:
            course['shade_ratio'] = shade

        course['biotope_grade'] = process_biotope_grade(line_4326, biotope_gdf)
        course['eco_axis']      = process_eco_axis(line_4326, biotope_gdf)

        veg = process_vegetation(line_4326, veg_gdf)
        course['vegetation'] = veg

        entrances = process_park_entrances(line_4326, park_ent_gdf)
        course['facilities']['park_entrances'] = entrances

        course['shelter_nearby'] = process_shelter_nearby(line_4326, shelter_gdf)

        # difficulty / has_stream / themes
        course['difficulty'] = derive_difficulty(course['slope_grade'])
        desc = veg.get('description', '')
        course['has_stream'] = derive_has_stream(desc)
        course['themes']     = derive_themes(desc, course['has_stream'], line_4326,
                                             biotope_gdf, park_bounds_gdf)

        # 화장실
        nearby = find_nearby_toilets(coords, all_toilets)
        course['facilities']['toilets'] = nearby
        course['toilet_count'] = len(nearby)

        # 출력
        print(f"  distance_km   : {distance_km} km")
        print(f"  duration_min  : {duration_min} min")
        print(f"  slope_grade   : {course['slope_grade']}")
        print(f"  shade_ratio   : {course['shade_ratio']}")
        print(f"  biotope_grade : {course['biotope_grade']}")
        print(f"  eco_axis      : {course['eco_axis']}")
        print(f"  shelter_nearby: {course['shelter_nearby']}")
        print(f"  has_stream    : {course['has_stream']}")
        print(f"  themes        : {course['themes']}")
        print(f"  화장실         : {len(nearby)}개\n")

        new_courses.append(course)

    # 5. courses.json에 append
    with open(COURSES_JSON, 'r', encoding='utf-8') as f:
        courses = json.load(f)

    existing_ids = {c['id'] for c in courses}
    added = 0
    for c in new_courses:
        if c['id'] not in existing_ids:
            courses.append(c)
            added += 1
        else:
            print(f"SKIP: {c['id']} already exists")

    with open(COURSES_JSON, 'w', encoding='utf-8') as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

    print(f"완료! {added}개 코스 추가됨. 총 {len(courses)}개 코스.")
    print(f"저장: {COURSES_JSON}")


if __name__ == '__main__':
    main()
