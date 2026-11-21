"""Verify release checksums and recompute the descriptive counts used in the paper."""
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
expected = json.loads((ROOT / 'docs/v08-checksums.json').read_text())
for name, digest in expected.items():
    if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != digest:
        raise ValueError('Files differ from the public release: ' + name)
data = json.loads((ROOT / 'dist/app-data.json').read_text())
people = {p['id']: p for p in data['people']}
edges = [(e['source'], e['target']) for e in data['edges']]
events = [(person_id, event) for person_id, person in people.items() for event in person['abroadEvents']]
confirmed = [(person_id, event) for person_id, event in events if event['status'] == 'confirmed']
with_city = {person_id for person_id, event in confirmed if event['city']}
with_city_all_statuses = {person_id for person_id, event in events if event['city']}
confirmed_abroad = {person_id for person_id, event in confirmed if event['study_context'] != 'pre_migration_education'}
origins = Counter(p['origin'] for p in people.values())
unknown = {k for k, p in people.items() if p['origin'] == 'unknown'}
results = dict(people=len(people), directed_edges=len(edges), fields=sum(len(p['fields']) for p in people.values()),
               education_events=sum(len(p['education']) for p in people.values()),
               teacher_records=sum(len(p['teacherLinks']) for p in people.values()),
               all_abroad_records=sum(len(p['abroadEvents']) for p in people.values()),
               confirmed_with_city=len(with_city), confirmed_abroad=len(confirmed_abroad),
               common_to_both=len(with_city & confirmed_abroad), city_with_any_status=len(with_city_all_statuses),
               city_only={k:people[k]['name'] for k in sorted(with_city - confirmed_abroad)},
               event_only={k:people[k]['name'] for k in sorted(confirmed_abroad - with_city)},
               within_confirmed_abroad=sum(a in confirmed_abroad and b in confirmed_abroad for a, b in edges), origin_groups=origins,
               edges_touching_unclassified=sum(a in unknown or b in unknown for a, b in edges))
print(json.dumps(results, ensure_ascii=False, indent=2))
