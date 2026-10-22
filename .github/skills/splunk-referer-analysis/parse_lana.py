#!/usr/bin/env python3
"""Parse a Splunk LANA export (one referer URL) into an aggregated JSON summary.

LANA rows carry the client event in `_raw` -> JSON -> `log_message`, a string of
`key=value` pairs separated by `¦`, with `¶` before `page=` and `facts=`. `facts`
is a JSON array of per-fragment telemetry (aem-fragment:*). This script buckets
the error messages and the fragment fetch health so the caller can classify the
report as an authoring vs a code issue.

Usage: python3 parse_lana.py <export.csv>
"""
import csv, json, re, html, sys
from collections import Counter, defaultdict

UUID = r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'


def field(lm, key):
    m = re.search(re.escape(key) + r'=(.*?)(?:¦|¶|$)', lm)
    return m.group(1) if m else None


def main(path):
    csv.field_size_limit(10_000_000)
    rows = list(csv.DictReader(open(path, encoding='utf-8')))

    messages = Counter()          # id-normalized message -> count
    card_ids = Counter()          # merch-card[<id>] -> count
    culprit_ids = Counter()       # <id> named inside the error text -> count
    referers = Counter()
    referer_query_keys = Counter()   # campaign / MEP markers on the landing URL
    locales = Counter()
    severity = Counter()
    times = []
    # per fetched fragment (from facts aem-fragment:url id)
    frag = defaultdict(lambda: {'count': 0, 'status': Counter(), 'cdn': Counter(),
                                'stale': Counter(), 'retry': Counter(), 'etags': set()})

    for r in rows:
        try:
            j = json.loads(r.get('_raw', ''))
        except Exception:
            continue
        lm = html.unescape(j.get('log_message', ''))
        if j.get('log_timestamp'):
            times.append(j['log_timestamp'])
        severity[field(lm, 'severity')] += 1

        ref = field(lm, 'referer')
        if ref:
            base, _, query = ref.partition('?')
            referers[base] += 1
            for pair in query.split('&'):
                k = pair.split('=')[0]
                if k:
                    referer_query_keys[k] += 1

        # error message: everything after message= up to the ¶ / ¦tags boundary
        mm = re.search(r'message=(.*?)(?:¶|¦tags=|$)', lm)
        if mm:
            text = mm.group(1)
            cm = re.search(r'merch-card\[(' + UUID + r')\]', text)
            if cm:
                card_ids[cm.group(1)] += 1
            # ids named after the human-readable error (the fragment to fix)
            after = re.sub(r'^merch-card\[' + UUID + r'\]:\s*', '', text)
            for cid in re.findall(UUID, after):
                culprit_ids[cid] += 1
            messages[re.sub(UUID, '<id>', text)] += 1

        # facts telemetry
        fm = re.search(r'facts=(\[.*?\])(?:¦tags=|¶|$)', lm)
        if fm:
            try:
                for fact in json.loads(fm.group(1)):
                    url = fact.get('aem-fragment:url', '')
                    idm = re.search(r'[?&]id=(' + UUID + r')', url)
                    fid = idm.group(1) if idm else 'unknown'
                    lc = re.search(r'locale=([A-Za-z_]+)', url)
                    if lc:
                        locales[lc.group(1)] += 1
                    e = frag[fid]
                    e['count'] += 1
                    e['status'][fact.get('aem-fragment:status')] += 1
                    e['stale'][fact.get('aem-fragment:stale')] += 1
                    e['retry'][fact.get('aem-fragment:retryCount')] += 1
                    et = fact.get('aem-fragment:etag')
                    if et:
                        e['etags'].add(et[:12])
                    st = fact.get('aem-fragment:serverTiming', '')
                    cdn = re.search(r'cdn-cache\|desc=(\w+)', st)
                    if cdn:
                        e['cdn'][cdn.group(1)] += 1
            except Exception:
                pass

    out = {
        'total_events': len(rows),
        'time_range': [min(times), max(times)] if times else None,
        'referers': referers.most_common(),
        'referer_query_keys': referer_query_keys.most_common(),
        'locales': locales.most_common(),
        'severity': severity.most_common(),
        'messages': [{'message': m, 'count': c} for m, c in messages.most_common(15)],
        'card_ids': card_ids.most_common(10),
        'culprit_fragment_ids': culprit_ids.most_common(10),
        'fetched_fragments': [
            {'id': fid, 'count': e['count'],
             'status': e['status'].most_common(),
             'cdn_cache': e['cdn'].most_common(),
             'stale': e['stale'].most_common(),
             'retryCount': e['retry'].most_common(),
             'distinct_etags': sorted(e['etags'])}
            for fid, e in sorted(frag.items(), key=lambda kv: -kv[1]['count'])
        ],
    }
    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Usage: python3 parse_lana.py <export.csv>')
    main(sys.argv[1])
