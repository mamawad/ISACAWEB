# Remove duplicate program on Join Us page

## Change

In `src/lib/signups.schema.ts`, the `COLLEGES.Engineering` program list currently contains both `"Architecture"` and `"Architectural"`. Remove the `"Architecture"` entry and keep `"Architectural"`.

Resulting Engineering list:

```
Engineering: [
  "Architectural",
  "Artificial Intelligence",
  "Biomedical",
  "Cybersecurity",
  "Data Science",
  "Electrical",
  "Industrial",
  "Mechanical",
  "Software",
  OTHER,
]
```

No other files reference these program strings as literals, so no other changes are needed.
