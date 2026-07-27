#!/usr/bin/env python3
"""GIS processing script: updates courses.json fields from GIS data."""

import subprocess, sys

# Auto-install required packages
for pkg in ['geopandas', 'rasterio', 'shapely', 'polyline']:
    try:
        __import__(pkg.replace('-', '_'))
    except ImportError:
        print(f"Installing {pkg}...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg, '-q'])

import json, os, warnings
from collections import Counter

import numpy as np
import polyline as pl
import geopandas as gpd
import rasterio
from rasterio.transform import rowcol
from shapely.geometry import LineString, Point
from shapely.ops import transform as shp_transform
import pyproj

warnings.filterwarnings('ignore')

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GIS_BASE      = os.path.join(BASE, 'gis_data')
COURSES_JSON  = os.path.join(BASE, 'data', 'courses.json')

DEM_PATH      = os.path.join(GIS_BASE, '항공LiDAR/용인시_DEM.tif')
CHM_PATH      = os.path.join(GIS_BASE, '항공LiDAR/용인시_CHM(식생높이).tif')
BDSM_PATH     = os.path.join(GIS_BASE, '항공LiDAR/용인시_BDSM(지면_건물높이).tif')
BIOTOPE_PATH  = os.path.join(GIS_BASE, '도시생태현황지도/용인시_도시생태현황지도.shp')
VEG_PATH      = os.path.join(GIS_BASE, '도시생태현황지도/용인시_현존식생도.shp')
PARK_ENT_PATH    = os.path.join(GIS_BASE, '공원DB/용인시_근린공원_공원입구.shp')
SHELTER_PATH     = os.path.join(GIS_BASE, '공원DB/용인시_무더위심터현황.shp')
PARK_BOUNDS_PATH = os.path.join(GIS_BASE, '공원DB/용인시_근린공원_경계.shp')
SMALL_PARK_PATH  = os.path.join(GIS_BASE, '공원DB/용인시_소공원_어린이공원_경계.shp')

CRS_WGS84 = 'EPSG:4326'
CRS_KR    = 'EPSG:5186'

# Pre-built transformers
_to_kr  = pyproj.Transformer.from_crs(CRS_WGS84, CRS_KR,  always_xy=True)
_to_wgs = pyproj.Transformer.from_crs(CRS_KR,  CRS_WGS84, always_xy=True)


# ── Geometry helpers ───────────────────────────────────────────────────────────

def decode_polyline(encoded: str):
    """Google Maps encoded polyline → list of (lat, lng)."""
    return pl.decode(encoded)


def make_line_4326(coords) -> LineString:
    """(lat, lng) list → shapely LineString in EPSG:4326 (x=lng, y=lat)."""
    return LineString([(lng, lat) for lat, lng in coords])


def line_to_kr(line_4326: LineString) -> LineString:
    return shp_transform(_to_kr.transform, line_4326)


def geom_to_wgs(geom):
    return shp_transform(_to_wgs.transform, geom)


def buffer_wgs84(line_4326: LineString, meters: float):
    """Return buffer polygon in EPSG:4326 after buffering in EPSG:5186."""
    buf_kr = line_to_kr(line_4326).buffer(meters)
    return geom_to_wgs(buf_kr)


def sample_points_wgs84(line_4326: LineString, interval_m: float = 50):
    """Sample points along the line at ~interval_m spacing, returned in WGS84."""
    line_kr = line_to_kr(line_4326)
    total   = line_kr.length
    n       = max(2, int(total / interval_m) + 1)
    pts_kr  = [line_kr.interpolate(i * total / (n - 1)) for i in range(n)]
    return [geom_to_wgs(p) for p in pts_kr]


# ── Raster sampling ────────────────────────────────────────────────────────────

def _pt_to_raster_crs(pt_wgs84: Point, raster_crs) -> tuple:
    """Transform WGS84 point to raster CRS, return (x, y)."""
    rstr = str(raster_crs).upper()
    if 'EPSG:4326' in rstr:
        return pt_wgs84.x, pt_wgs84.y
    t = pyproj.Transformer.from_crs(CRS_WGS84, raster_crs, always_xy=True)
    return t.transform(pt_wgs84.x, pt_wgs84.y)


def sample_raster(path: str, points_wgs84: list) -> list:
    """Sample raster values at WGS84 points. None = outside bounds / nodata."""
    values = []
    with rasterio.open(path) as src:
        band   = src.read(1)
        nodata = src.nodata
        for pt in points_wgs84:
            try:
                x, y = _pt_to_raster_crs(pt, src.crs)
                r, c = rowcol(src.transform, x, y)
                if 0 <= r < src.height and 0 <= c < src.width:
                    v = float(band[r, c])
                    values.append(None if (nodata is not None and v == nodata) else v)
                else:
                    values.append(None)
            except Exception:
                values.append(None)
    return values


# ── Field processors ───────────────────────────────────────────────────────────

def process_slope_grade(line_4326: LineString) -> float | None:
    """Average slope angle (degrees) sampled every 50 m along the DEM."""
    pts   = sample_points_wgs84(line_4326, 50)
    elevs = sample_raster(DEM_PATH, pts)

    valid = [(i, e) for i, e in enumerate(elevs) if e is not None]
    if len(valid) < 2:
        return None

    slopes = []
    for (i1, e1), (i2, e2) in zip(valid, valid[1:]):
        p1, p2 = pts[i1], pts[i2]
        x1, y1 = _to_kr.transform(p1.x, p1.y)
        x2, y2 = _to_kr.transform(p2.x, p2.y)
        dist = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
        if dist > 0:
            slopes.append(abs(np.degrees(np.arctan((e2 - e1) / dist))))

    return round(float(np.mean(slopes)), 2) if slopes else None


def process_shade_ratio(line_4326: LineString) -> float | None:
    """Fraction of sampled points with CHM (vegetation height) >= 2 m."""
    pts  = sample_points_wgs84(line_4326, 50)
    chms = sample_raster(CHM_PATH, pts)

    total = above = 0
    for chm in chms:
        if chm is None:
            continue
        total += 1
        if chm >= 2.0:
            above += 1

    return round(above / total, 3) if total > 0 else None


def _label_to_grade(label) -> int:
    if not label or not isinstance(label, str):
        return 5
    c = label.strip()[:1].upper()
    return {'A': 1, 'N': 2, 'B': 3, 'R': 4}.get(c, 5)


def process_biotope_grade(line_4326: LineString, biotope_gdf: gpd.GeoDataFrame) -> int:
    """Most frequent biotope grade within 50 m buffer."""
    buf = buffer_wgs84(line_4326, 50)
    hits = biotope_gdf[biotope_gdf.geometry.intersects(buf)]
    if hits.empty:
        return 5
    grades = [_label_to_grade(v) for v in hits.get('LABEL', [])]
    return Counter(grades).most_common(1)[0][0] if grades else 5


def process_eco_axis(line_4326: LineString, biotope_gdf: gpd.GeoDataFrame) -> bool:
    """True if ecological axis polygons intersect within 100 m buffer."""
    eco_classes = {'자연산림', '산지습지', '하천습지'}
    if 'MAJ_CL' not in biotope_gdf.columns:
        return False
    eco = biotope_gdf[biotope_gdf['MAJ_CL'].isin(eco_classes)]
    if eco.empty:
        return False
    buf = buffer_wgs84(line_4326, 100)
    return bool(eco.geometry.intersects(buf).any())


POLLEN_MAP = {
    # pine
    '소나무': 'pine', '리기다소나무': 'pine', '잣나무': 'pine',
    '전나무': 'pine', '일본잎갈나무': 'pine', '낙엽송': 'pine',
    # oak
    '굴참나무': 'oak', '상수리나무': 'oak', '신갈나무': 'oak',
    '졸참나무': 'oak', '참나무류': 'oak', '참나무': 'oak', '밤나무': 'oak',
    # grass
    '아까시나무': 'grass', '버드나무': 'grass',
    # birch
    '자작나무': 'birch',
    # meta
    '메타세콰이어': 'meta',
    # bamboo
    '대나무': 'bamboo',
}

def process_vegetation(line_4326: LineString, veg_gdf: gpd.GeoDataFrame) -> dict:
    """Vegetation tags & species within 50 m buffer."""
    buf  = buffer_wgs84(line_4326, 50)
    hits = veg_gdf[veg_gdf.geometry.intersects(buf)]

    tags, species = set(), []
    for veg_cl in hits.get('VEG_CL', []):
        if not veg_cl or not isinstance(veg_cl, str):
            continue
        veg_cl = veg_cl.strip()
        species.append(veg_cl)
        for kw, tag in POLLEN_MAP.items():
            if kw in veg_cl:
                tags.add(tag)

    # Deduplicate species while preserving order
    seen, unique_sp = set(), []
    for s in species:
        if s not in seen:
            seen.add(s)
            unique_sp.append(s)

    return {
        'tags': sorted(tags),
        'description': ', '.join(unique_sp),
        'species': [{'name': s, 'pollen_period': '', 'bloom_period': ''} for s in unique_sp],
    }


def process_park_entrances(line_4326: LineString, park_ent_gdf: gpd.GeoDataFrame) -> list:
    """Park entrance points within 300 m buffer."""
    buf  = buffer_wgs84(line_4326, 300)
    hits = park_ent_gdf[park_ent_gdf.geometry.within(buf)]

    entrances = []
    name_cols = ['ENT_NM', 'name', 'NAME', 'PK_NM']
    for _, row in hits.iterrows():
        geom = row.geometry
        if geom is None:
            continue
        name = '공원 입구'
        for col in name_cols:
            if col in row.index and row[col] and str(row[col]).strip():
                name = str(row[col]).strip()
                break
        # Handle both Point and MultiPoint geometries
        geom_type = geom.geom_type
        if geom_type == 'Point':
            pts = [geom]
        elif geom_type == 'MultiPoint':
            pts = list(geom.geoms)
        else:
            pts = [geom.centroid]
        for pt in pts:
            entrances.append({'lat': round(pt.y, 7), 'lng': round(pt.x, 7), 'name': name})
    return entrances


def process_shelter_nearby(line_4326: LineString, shelter_gdf: gpd.GeoDataFrame) -> bool:
    """True if any 무더위쉼터 is within 500 m."""
    buf  = buffer_wgs84(line_4326, 500)
    hits = shelter_gdf[shelter_gdf.geometry.within(buf)]
    return not hits.empty


def process_difficulty(slope_grade) -> str | None:
    """flat ≤3.0°, moderate ≤7.0°, steep >7.0°. None = keep existing."""
    if slope_grade is None:
        return None
    if slope_grade <= 3.0:
        return 'flat'
    if slope_grade <= 7.0:
        return 'moderate'
    return 'steep'


_STREAM_KEYWORDS = {'하천', '하천림', '강기슭', '하천습지'}

def process_has_stream(line_4326: LineString, veg_gdf: gpd.GeoDataFrame) -> bool:
    """True if any VEG_CL within 50 m buffer contains stream keywords."""
    buf  = buffer_wgs84(line_4326, 50)
    hits = veg_gdf[veg_gdf.geometry.intersects(buf)]
    for veg_cl in hits.get('VEG_CL', []):
        if not veg_cl or not isinstance(veg_cl, str):
            continue
        if any(kw in veg_cl for kw in _STREAM_KEYWORDS):
            return True
    return False


def process_themes(
    line_4326: LineString,
    veg_gdf: gpd.GeoDataFrame,
    biotope_gdf: gpd.GeoDataFrame,
    park_bounds_gdf: gpd.GeoDataFrame,
    small_park_gdf: gpd.GeoDataFrame,
) -> list:
    """Derive themes from GIS data. Returns sorted, deduplicated list."""
    themes = set()

    # lake / stream from 현존식생도 50 m buffer
    buf_50  = buffer_wgs84(line_4326, 50)
    veg_hits = veg_gdf[veg_gdf.geometry.intersects(buf_50)]
    for veg_cl in veg_hits.get('VEG_CL', []):
        if not veg_cl or not isinstance(veg_cl, str):
            continue
        if '호소' in veg_cl:
            themes.add('lake')
        if any(kw in veg_cl for kw in {'하천', '하천림', '강기슭'}):
            themes.add('stream')

    # forest from 도시생태현황지도 50 m buffer
    if 'MAJ_CL' in biotope_gdf.columns:
        bio_hits = biotope_gdf[biotope_gdf.geometry.intersects(buf_50)]
        forest_cls = {'자연산림', '식재산림'}
        if bio_hits['MAJ_CL'].isin(forest_cls).any():
            themes.add('forest')

    # park from 근린공원 경계 OR 소공원·어린이공원 경계 300 m buffer intersection
    buf_300 = buffer_wgs84(line_4326, 300)
    if (
        (not park_bounds_gdf.empty and park_bounds_gdf.geometry.intersects(buf_300).any())
        or (not small_park_gdf.empty and small_park_gdf.geometry.intersects(buf_300).any())
    ):
        themes.add('park')

    # default fallback
    if not themes:
        themes.add('park')

    return sorted(themes)


# ── SHP loader ─────────────────────────────────────────────────────────────────

def load_shp(path: str) -> gpd.GeoDataFrame:
    """Load SHP → EPSG:4326, trying multiple encodings."""
    for enc in ('utf-8', 'cp949', 'euc-kr'):
        try:
            gdf = gpd.read_file(path, encoding=enc)
            if gdf is not None and len(gdf) > 0:
                break
        except Exception:
            continue
    else:
        gdf = gpd.read_file(path)

    if gdf.crs is None:
        gdf = gdf.set_crs(CRS_KR)
    if str(gdf.crs).upper() != CRS_WGS84:
        gdf = gdf.to_crs(CRS_WGS84)
    return gdf


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("=== GIS Processing Script ===\n")

    with open(COURSES_JSON, 'r', encoding='utf-8') as f:
        courses = json.load(f)

    # ── 전처리: 'city' 테마 → 'park' 으로 교체 ────────────────────────────────
    for course in courses:
        themes = course.get('themes', [])
        course['themes'] = ['park' if t == 'city' else t for t in themes]

    print("Loading SHP files...")
    biotope_gdf     = load_shp(BIOTOPE_PATH)
    veg_gdf         = load_shp(VEG_PATH)
    park_ent_gdf    = load_shp(PARK_ENT_PATH)
    shelter_gdf     = load_shp(SHELTER_PATH)
    park_bounds_gdf = load_shp(PARK_BOUNDS_PATH)
    small_park_gdf  = load_shp(SMALL_PARK_PATH)
    print(f"  도시생태현황지도   : {len(biotope_gdf)} features")
    print(f"  현존식생도         : {len(veg_gdf)} features")
    print(f"  공원입구           : {len(park_ent_gdf)} features")
    print(f"  무더위쉼터         : {len(shelter_gdf)} features")
    print(f"  근린공원경계       : {len(park_bounds_gdf)} features")
    print(f"  소공원·어린이공원  : {len(small_park_gdf)} features\n")

    changed = []
    for idx, course in enumerate(courses):
        cid  = course.get('id', f'course-{idx}')
        enc  = course.get('polyline', '')

        if not enc:
            continue

        old_themes = list(course.get('themes', []))
        coords    = decode_polyline(enc)
        line_4326 = make_line_4326(coords)
        new_themes = process_themes(line_4326, veg_gdf, biotope_gdf, park_bounds_gdf, small_park_gdf)
        course['themes'] = new_themes

        if sorted(old_themes) != sorted(new_themes):
            changed.append((cid, course.get('name', ''), old_themes, new_themes))

    # ── course-2-02 수동 하드코딩 ─────────────────────────────────────────────
    for course in courses:
        if course.get('id') == 'course-2-02':
            prev = list(course.get('themes', []))
            course['themes'] = ['forest']
            if sorted(prev) != ['forest']:
                changed.append(('course-2-02', course.get('name', ''), prev, ['forest']))
            print("course-2-02 수동 값 적용: themes=['forest']\n")
            break

    if changed:
        print("=== 변경된 코스 ===")
        for cid, name, old, new in changed:
            print(f"  {cid} ({name}): {old} → {new}")
    else:
        print("변경된 코스 없음")

    with open(COURSES_JSON, 'w', encoding='utf-8') as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

    print(f"완료! 저장: {COURSES_JSON}")


if __name__ == '__main__':
    main()
