"""Rebuild the 104-person web snapshot from the public editorial and graph inputs."""
import csv
import gzip
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'source_data'


def load_rows(name, delimiter):
    with (SOURCES / name).open(encoding='utf-8-sig', newline='') as handle:
        return list(csv.DictReader(handle, delimiter=delimiter))


def build():
    with gzip.open(SOURCES / 'reviewed-v05.json.gz', mode='rt', encoding='utf-8') as handle:
        data = json.load(handle)
    people = data['people']
    person_ids = {p['name']: p['id'] for p in people}
    csv_rows = load_rows('Persons_EDGES.csv', ',')
    tsv_rows = load_rows('Persons_links.tsv', '\t')
    full = {(r['Source'], r['Target']) for r in csv_rows}
    concordance = {(r['source_name'], r['target_name_normal']) for r in tsv_rows}
    if full != concordance or len(full) != len(csv_rows):
        raise ValueError('Graph sources disagree or CSV contains duplicate directed pairs')
    if any(r['Type'] != 'directed' or r['Weight'] != '1' for r in csv_rows):
        raise ValueError('Unexpected relation type or weight')
    degree = Counter(name for pair in full for name in pair)
    cutoff = sorted(degree.values(), reverse=True)[99]
    if set(person_ids) != {name for name, count in degree.items() if count >= cutoff}:
        raise ValueError('Editorial roster differs from the top-100-with-ties rule')
    pairs = sorted((a, b) for a, b in full if a in person_ids and b in person_ids and a != b)
    inside = Counter(name for pair in pairs for name in pair)
    for person in people:
        name = person['name']
        if person['internalDegree'] != inside[name] or person['fullDegree'] != degree[name]:
            raise ValueError('Stored and recalculated degrees differ for ' + person['id'])
    data['edges'] = [{'id': f'ref-{i:04d}', 'source': person_ids[a], 'target': person_ids[b]}
                     for i, (a, b) in enumerate(pairs, start=1)]
    output = ROOT / 'dist' / 'app-data.json'
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    return len(people), len(pairs)


if __name__ == '__main__':
    persons, edges = build()
    print(f'Prepared {persons} persons and {edges} internal directed references.')
