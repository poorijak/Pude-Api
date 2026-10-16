# Question data audit

Audited on 2026-10-16 before creating the first question seed.

## JSON inputs

- 350 questions across 9 supplied JSON files.
- 350 unique question IDs.
- No duplicate `(mode, level, stage, order)` positions.
- No exact duplicate target words, phrases, clues, questions, or image prompts.
- Every ID matches its `mode`, `level`, `stage`, and `order` fields.
- Every picture-naming and word-clue target is included in its accepted answers.
- Every phrase keyword occurs in its phrase.

## Level 1 picture-naming R2 audit

Bucket folder: `picture_naming_level1_colorful/`

- JSON rows: 50
- Matching R2 objects: 25
- Missing R2 objects: 25
- Seed behavior: rows with an audited object are active; rows without one are
  inserted as inactive with null image fields.

Available objects are orders 1-5 in each of stages 1-5. Orders 6-10 in every
stage are missing from the R2 folder.

## Seed activation policy

All 350 supplied questions are validated before writing to the database.
Picture-naming and phrase questions are seeded only when they have an audited R2
image key:

- Level 1 picture naming: 25 seeded, 25 excluded because their R2 images are
  missing.
- Level 2 picture naming: 50 excluded until its R2 folder is mapped and audited.
- Level 3 picture naming: 50 excluded until its R2 folder is mapped and audited.
- Level 1-3 phrases: 75 excluded until their illustration folders are mapped and
  audited.
- Level 2-3 word clues: 100 seeded; this mode does not require an image.
- Level 3 conversation: 25 seeded; this mode does not require an image.

Expected total after seeding: 150 active questions and 8 active pretest
questions. The other 200 image-dependent questions are absent from the table.
`R2_PUBLIC_BASE_URL` can override the current public R2 origin without changing
object keys.

## Pretest selection

The pretest contains 15 questions across all practice modes:

- `pn-l1-s2-04` — จาน (Picture Naming L1)
- `pn-l1-s3-03` — รองเท้า (Picture Naming L1)
- `pn-l1-s4-08` — กุญแจ (Picture Naming L1)
- `pn-l2-s1-10` — เข็มขัด (Picture Naming L2)
- `pn-l2-s2-07` — ตำรวจ (Picture Naming L2)
- `ph-l1-s2-04` — ไม่เอา (Phrase L1)
- `ph-l1-s3-05` — เปิดพัดลมหน่อย (Phrase L1)
- `ph-l2-s5-01` — ห้องน้ำอยู่ตรงไหนคะ (Phrase L2)
- `ph-l3-s2-03` — ขอนั่งตรงนี้ได้ไหมครับ (Phrase L3)
- `wc-l2-s1-09` — ไม้ถูพื้น (Word Clue L2)
- `wc-l2-s3-03` — โรงพยาบาล (Word Clue L2)
- `wc-l2-s3-08` — ไปรษณีย์ (Word Clue L2)
- `cv-l3-s1-05` — เมื่อคืนนอนหลับดีไหมคะ (Conversation L3)
- `cv-l3-s2-02` — บ้านเกิดอยู่จังหวัดไหนคะ (Conversation L3)
- `cv-l3-s5-04` — ถ้ามีเวลาว่าง อยากทำอะไรคะ (Conversation L3)
