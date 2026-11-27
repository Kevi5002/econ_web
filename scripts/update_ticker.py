import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://api.api-ninjas.com"
OUT = Path(__file__).resolve().parent.parent / "data" / "ticker.json"
KEY = os.environ.get("API_NINJAS_KEY_GDP")


BLS_CPI_URL = "https://api.bls.gov/publicAPI/v1/timeseries/data/CUUR0000SA0"  # CPI-U, no key needed
UA = "econ-club-ticker/1.0"


def fetch_json(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def get(path, **params):
    return fetch_json(f"{BASE}{path}?{urllib.parse.urlencode(params)}", {"X-Api-Key": KEY})


def latest_year(rows, field, max_year):
    """Newest row at or before max_year that has a numeric value for `field`."""
    good = [r for r in rows if isinstance(r.get(field), (int, float)) and r.get("year", 0) <= max_year]
    return max(good, key=lambda r: r["year"]) if good else None


def fetch_gdp_growth(this_year):
    row = latest_year(get("/v1/gdp", country="US"), "gdp_growth", this_year)
    return {"value": row["gdp_growth"], "year": row["year"]}


def fetch_unemployment(this_year):
    row = latest_year(get("/v1/unemployment", country="US"), "unemployment_rate", this_year)
    return {"value": row["unemployment_rate"], "year": row["year"]}


def fetch_cpi(_):
    """Year-over-year CPI-U change for the latest month, from the free BLS API."""
    body = fetch_json(BLS_CPI_URL)
    if body.get("status") != "REQUEST_SUCCEEDED":
        raise RuntimeError(f"BLS: {body.get('message')}")
    rows = {}
    for r in body["Results"]["series"][0]["data"]:
        if not r["period"].startswith("M") or r["period"] == "M13":  # M13 = annual average
            continue
        try:
            rows[(int(r["year"]), r["period"])] = float(r["value"])
        except ValueError:  # BLS uses "-" for months it did not publish
            continue
    # Newest month that also has a value 12 months earlier
    for year, period in sorted(rows, reverse=True):
        prev = rows.get((year - 1, period))
        if prev:
            pct = (rows[(year, period)] / prev - 1) * 100
            return {"value": round(pct, 1), "period": f"{year}-{period[1:]}"}
    raise RuntimeError("BLS: no month with a year-earlier value")


def fetch_fed_funds(_):
    row = get("/v2/interestrate", rate="central_bank_us")
    return {"value": row["rate_pct"], "last_updated": row["last_updated"]}


METRICS = {
    "gdp_growth": fetch_gdp_growth,
    "unemployment": fetch_unemployment,
    "cpi": fetch_cpi,
    "fed_funds": fetch_fed_funds,
}


def main():
    if not KEY:
        sys.exit("API_NINJAS_KEY_GDP is not set")
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    data = dict(old)
    this_year = datetime.now(timezone.utc).year
    ok = 0
    for name, fn in METRICS.items():
        try:
            data[name] = fn(this_year)
            ok += 1
            print(f"ok    {name}: {data[name]}")
        except Exception as exc:  # keep old value on any failure
            detail = f"HTTP {exc.code}" if isinstance(exc, urllib.error.HTTPError) else repr(exc)
            print(f"FAIL  {name}: {detail} (keeping previous value)")
    if ok == 0:
        sys.exit("No metrics could be fetched; leaving ticker.json untouched")
    if {k: v for k, v in data.items() if k != "updated"} == {k: v for k, v in old.items() if k != "updated"}:
        print("No changes; leaving ticker.json untouched")
        return
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2) + "\n")


if __name__ == "__main__":
    main()
 