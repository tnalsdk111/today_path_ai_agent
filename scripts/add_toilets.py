import csv
import json
import math
import polyline as polyline_lib


def haversine(lat1, lng1, lat2, lng2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def int_col(row, key):
    try:
        return int(row.get(key, 0) or 0)
    except ValueError:
        return 0


def load_toilets(filepath):
    toilets = []
    with open(filepath, encoding="euc-kr") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                lat = float(row["위도"]) if row["위도"].strip() else 0
                lng = float(row["경도"]) if row["경도"].strip() else 0
            except ValueError:
                continue

            if lat == 0 or lng == 0:
                continue
            if not (35.0 <= lat <= 38.5):
                continue
            if not (126.0 <= lng <= 129.5):
                continue

            name = row["화장실명"].strip() or "화장실"

            accessible = (
                int_col(row, "남성용-장애인용대변기수") >= 1
                or int_col(row, "여성용-장애인용대변기수") >= 1
            )
            children = (
                int_col(row, "남성용-어린이용대변기수") >= 1
                or int_col(row, "여성용-어린이용대변기수") >= 1
            )
            emergency_bell = row["비상벨설치여부"].strip().upper() == "Y"

            toilets.append({
                "lat": lat,
                "lng": lng,
                "name": name,
                "accessible": accessible,
                "children": children,
                "emergency_bell": emergency_bell,
            })

    return toilets


def find_nearby_toilets(route_coords, toilets, radius_km=0.5):
    nearby = []
    for toilet in toilets:
        min_dist = min(
            haversine(lat, lng, toilet["lat"], toilet["lng"])
            for lat, lng in route_coords
        )
        if min_dist <= radius_km:
            nearby.append({
                "lat": round(toilet["lat"], 6),
                "lng": round(toilet["lng"], 6),
                "name": toilet["name"],
                "accessible": toilet["accessible"],
                "children": toilet["children"],
                "emergency_bell": toilet["emergency_bell"],
            })
    return nearby


def main():
    toilets = load_toilets("scripts/input/toilets.csv")
    print(f"화장실 데이터 로드: {len(toilets)}개 (유효 좌표)\n")

    with open("data/courses.json", encoding="utf-8") as f:
        courses = json.load(f)

    mapped_count = 0

    for course in courses:
        route_coords = polyline_lib.decode(course["polyline"], 5)
        nearby = find_nearby_toilets(route_coords, toilets)

        course["facilities"]["toilets"] = nearby
        course["toilet_count"] = len(nearby)

        if nearby:
            mapped_count += 1

        print(f"[{course['id']}] {course['name']} | 화장실 {len(nearby)}개")

    with open("data/courses.json", "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

    print(f"\n총 {len(courses)}개 코스 처리 완료")
    print(f"화장실 매핑된 코스: {mapped_count}개 / {len(courses)}개")


if __name__ == "__main__":
    main()
