## Local Development

Serve the folder over HTTP so the browser can fetch the language JSON files:

```bash
cd /home/tarik/projs/cv
python3 -m http.server 8000
```

Open `http://localhost:8000/?lang=en` for English or `http://localhost:8000/?lang=de` for German.

## Language Consistency Check

Run the JSON validator before merging changes to the localized content:

```bash
python3 scripts/check_language_json.py data
```
