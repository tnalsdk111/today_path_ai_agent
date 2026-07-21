import json
import math
import xml.etree.ElementTree as ET
import polyline

KML_NS = "http://www.opengis.net/kml/2.2"

NAME_MAP = {
    # courses_1.kml
    "광교호수공원 순환 - 원천저수지": "광교호수공원 순환 코스",
    "광교호수공원 반 바퀴 - 원천저수지": "광교호수공원 반바퀴 코스 (동측)",
    "광교호수공원 반 바퀴 - 원천저수지 2": "광교호수공원 반바퀴 코스 (서측)",
    "신대저수지 둘레길": "신대저수지 둘레길",
    "성복천 수변길": "성복천 수변길",
    # courses_2.kml
    "신봉동 산책로": "신봉동 산책로",
    "광교산 자락길": "광교산 자락길 (초입)",
    "탄천 수변길": "탄천 수변길 (죽전 구간)",
    "동천 숲 산책로": "동천 숲 산책로",
    # courses_3.kml
    "산책로1": "죽전역-수지구청 산책로",
    "산책로2": "수지구청-수지생태공원 산책로",
    "산책로3": "죽전 전내천 산책로",
    "산책로4": "죽전 대지천 산책로",
    "산책로5": "수지 신촌천 산책로",
    "산책로6": "동천 자연길",
    "산책로7": "죽전 폭포공원 산책로",
    "산책로8": "성복-수지구청역 산책로",
    "산책로9": "광교산 법륜사 산책로",
    "산책로10": "성복동 근린 산책로",
}

DONG_MAP = {
    "광교호수공원 순환 코스": "상현1동",
    "광교호수공원 반바퀴 코스 (동측)": "상현1동",
    "광교호수공원 반바퀴 코스 (서측)": "상현1동",
    "신대저수지 둘레길": "풍덕천2동",
    "성복천 수변길": "죽전1동",
    "신봉동 산책로": "신봉동",
    "광교산 자락길 (초입)": "상현1동",
    "탄천 수변길 (죽전 구간)": "죽전2동",
    "동천 숲 산책로": "동천동",
    "죽전역-수지구청 산책로": "죽전1동",
    "수지구청-수지생태공원 산책로": "풍덕천1동",
    "죽전 전내천 산책로": "죽전2동",
    "죽전 대지천 산책로": "죽전2동",
    "수지 신촌천 산책로": "풍덕천1동",
    "동천 자연길": "동천동",
    "죽전 폭포공원 산책로": "죽전1동",
    "성복-수지구청역 산책로": "성복동",
    "광교산 법륜사 산책로": "신봉동",
    "성복동 근린 산책로": "성복동",
}

TEMP_VALUES = {
    "difficulty": "flat",
    "night_safe": False,
    "has_stream": False,
    "themes": ["park"],
    "facilities": {"toilets": [], "park_entrances": []},
    "toilet_count": 0,
    "vegetation": {"tags": [], "description": "", "species": []},
    "slope_grade": 3.0,
    "utci_score": 5.0,
    "shade_ratio": 0.5,
    "biotope_grade": 3,
    "eco_axis": False,
    "flood_risk": False,
    "shelter_nearby": False,
    "park_grade": 3,
}

# Folders in courses_1.kml that are NOT walking courses (no LineString, or polygon-only)
SKIP_NAMES = {
    "동천동 근린공원", "죽전 중앙공원", "수지 체육공원",
    "용인 아르피아 체육공원", "상현공원",
}


def haversine(lat1, lng1, lat2, lng2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def parse_coordinates(coords_text):
    """Parse KML coordinates string into list of (lat, lng) tuples."""
    points = []
    for token in coords_text.strip().split():
        parts = token.split(",")
        if len(parts) >= 2:
            lng, lat = float(parts[0]), float(parts[1])
            points.append((lat, lng))
    return points


def parse_kml(filepath) -> list[tuple[str, list[tuple[float, float]]]]:
    """Return list of (folder_name, [(lat, lng), ...]) for folders with LineStrings."""
    tree = ET.parse(filepath)
    root = tree.getroot()

    ns = KML_NS
    tag = lambda name: f"{{{ns}}}{name}"

    courses: list[tuple[str, list[tuple[float, float]]]] = []
    document = root.find(tag("Document"))
    if document is None:
        document = root

    for folder in document.findall(tag("Folder")):
        name_el = folder.find(tag("name"))
        if name_el is None:
            continue
        folder_name = (name_el.text or "").strip()
        if not folder_name:
            continue

        if folder_name in SKIP_NAMES:
            continue

        all_coords = []
        for placemark in folder.findall(tag("Placemark")):
            linestring = placemark.find(tag("LineString"))
            if linestring is None:
                continue
            coords_el = linestring.find(tag("coordinates"))
            if coords_el is None or not coords_el.text:
                continue
            all_coords.extend(parse_coordinates(coords_el.text))

        if all_coords:
            courses.append((folder_name, all_coords))

    return courses


def calc_distance(coords):
    total = 0.0
    for i in range(1, len(coords)):
        total += haversine(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1])
    return total


def build_course(course_id, raw_name, coords):
    raw_name = raw_name or ""
    name = NAME_MAP.get(raw_name, raw_name)
    dong = DONG_MAP.get(name, "")

    distance_km = round(calc_distance(coords), 1)
    duration_min = round(distance_km / 4 * 60)

    first, last = coords[0], coords[-1]
    is_loop = haversine(first[0], first[1], last[0], last[1]) <= 0.1

    encoded = polyline.encode(coords, 5)

    course = {
        "id": course_id,
        "name": name,
        "dong": dong,
        "distance_km": distance_km,
        "duration_min": duration_min,
        "is_loop": is_loop,
        **TEMP_VALUES,
        "polyline": encoded,
        "start_point": {"lat": round(first[0], 6), "lng": round(first[1], 6)},
    }
    return course


def main():
    files = [
        ("scripts/input/courses_1.kml", 1),
        ("scripts/input/courses_2.kml", 2),
        ("scripts/input/courses_3.kml", 3),
    ]

    all_courses = []

    for filepath, file_num in files:
        courses_raw = parse_kml(filepath)
        for folder_idx, (raw_name, coords) in enumerate(courses_raw, start=1):
            course_id = f"course-{file_num}-{folder_idx:02d}"
            course = build_course(course_id, raw_name, coords)
            all_courses.append(course)

            loop_str = str(course["is_loop"])
            print(
                f"[{course_id}] {course['name']} | {course['dong']} | "
                f"{course['distance_km']}km | {course['duration_min']}분 | loop: {loop_str}"
            )

    with open("data/courses.json", "w", encoding="utf-8") as f:
        json.dump(all_courses, f, ensure_ascii=False, indent=2)

    print(f"\n총 {len(all_courses)}개 코스 → data/courses.json 저장 완료")


if __name__ == "__main__":
    main()
