#!/usr/bin/env python3
"""Reprocess vegetation field only for all courses, using updated POLLEN_MAP."""

import subprocess, sys
for pkg in ['geopandas', 'shapely', 'polyline']:
    try:
        __import__(pkg.replace('-', '_'))
    except ImportError:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg, '-q'])

import json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gis_process import (
    COURSES_JSON, VEG_PATH,
    decode_polyline, make_line_4326, process_vegetation, load_shp,
)

MANUAL_VEG = {
    'course-1-01': {
        'tags': ['pine'],
        'description': '느티나무, 메타세콰이어, 소나무',
        'species': [
            {'name': '느티나무',     'pollen_period': '', 'bloom_period': ''},
            {'name': '메타세콰이어', 'pollen_period': '', 'bloom_period': ''},
            {'name': '소나무',       'pollen_period': '', 'bloom_period': ''},
        ],
    },
    'course-1-02': {
        'tags': ['pine'],
        'description': '느티나무, 메타세콰이어, 소나무',
        'species': [
            {'name': '느티나무',     'pollen_period': '', 'bloom_period': ''},
            {'name': '메타세콰이어', 'pollen_period': '', 'bloom_period': ''},
            {'name': '소나무',       'pollen_period': '', 'bloom_period': ''},
        ],
    },
    'course-1-03': {
        'tags': ['pine'],
        'description': '느티나무, 메타세콰이어, 소나무',
        'species': [
            {'name': '느티나무',     'pollen_period': '', 'bloom_period': ''},
            {'name': '메타세콰이어', 'pollen_period': '', 'bloom_period': ''},
            {'name': '소나무',       'pollen_period': '', 'bloom_period': ''},
        ],
    },
}

NAME_CORRECTIONS = {
    'course-1-02': '광교호수공원 반바퀴 코스 (서측)',
    'course-1-03': '광교호수공원 반바퀴 코스 (동측)',
}


def main():
    print("=== Vegetation Reprocessing ===\n")

    with open(COURSES_JSON, 'r', encoding='utf-8') as f:
        courses = json.load(f)

    print(f"Loading {VEG_PATH} ...")
    veg_gdf = load_shp(VEG_PATH)
    print(f"  현존식생도: {len(veg_gdf)} features\n")

    for course in courses:
        cid  = course.get('id', '')
        enc  = course.get('polyline', '')
        name = course.get('name', '')

        # 이름 수정 먼저
        if cid in NAME_CORRECTIONS:
            course['name'] = NAME_CORRECTIONS[cid]
            name = course['name']

        if not enc:
            continue

        # 수동 입력값 적용
        if cid in MANUAL_VEG:
            course['vegetation'] = MANUAL_VEG[cid]
            print(f"[{cid}] {name} | tags: {MANUAL_VEG[cid]['tags']} (manual)")
            continue

        coords    = decode_polyline(enc)
        line_4326 = make_line_4326(coords)
        veg       = process_vegetation(line_4326, veg_gdf)
        course['vegetation'] = veg
        print(f"[{cid}] {name} | tags: {veg['tags']}")

    with open(COURSES_JSON, 'w', encoding='utf-8') as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

    print(f"\n완료! 저장: {COURSES_JSON}")


if __name__ == '__main__':
    main()
