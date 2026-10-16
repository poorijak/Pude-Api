import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, QuestionMode } from '@prisma/client';
import { Pool } from 'pg';

type SourceMode = 'picture_naming' | 'word_clue' | 'phrase' | 'conversation';

interface BaseSeedRow {
  id: string;
  level: number;
  stage: number;
  mode: SourceMode;
  order: number;
  is_pretest?: boolean;
}

interface PictureNamingSeedRow extends BaseSeedRow {
  mode: 'picture_naming';
  target_word: string;
  accepted_answers: string[];
  hint_meaning: string;
  hint_syllable: string;
  image_prompt: string;
}

interface WordClueSeedRow extends BaseSeedRow {
  mode: 'word_clue';
  clue: string;
  target_word: string;
  accepted_answers: string[];
  hint_meaning: string;
  hint_syllable: string;
}

interface PhraseSeedRow extends BaseSeedRow {
  mode: 'phrase';
  phrase: string;
  situation: string;
  key_words: string[];
  image_prompt: string;
}

interface ConversationSeedRow extends BaseSeedRow {
  mode: 'conversation';
  question: string;
  example_answers: string[];
  expected_topic: string;
}

type SeedRow =
  PictureNamingSeedRow | WordClueSeedRow | PhraseSeedRow | ConversationSeedRow;

const DATA_FILES = [
  'level1_pictureNaming.json',
  'level1_phrase.json',
  'level2_pictureNaming.json',
  'level2_wordClue.json',
  'level2_phrase.json',
  'level3_pictureNaming.json',
  'level3_wordClue.json',
  'level3_phrase.json',
  'level3_conversation.json',
] as const;

const modeMap: Record<SourceMode, QuestionMode> = {
  picture_naming: QuestionMode.PICTURE_NAMING,
  word_clue: QuestionMode.WORD_CLUE,
  phrase: QuestionMode.PHRASE,
  conversation: QuestionMode.CONVERSATION,
};

const modePrefix: Record<SourceMode, string> = {
  picture_naming: 'pn',
  word_clue: 'wc',
  phrase: 'ph',
  conversation: 'cv',
};

const R2_PUBLIC_BASE_URL =
  process.env.R2_PUBLIC_BASE_URL ??
  'https://pub-55c54a64a4904de38ffb99bcd80e714b.r2.dev';
const LEVEL_1_PICTURE_FOLDER = 'picture_naming_level1_colorful';

const availableImageCodes = new Set([
  'pn-l1-s1-01',
  'pn-l1-s1-02',
  'pn-l1-s1-03',
  'pn-l1-s1-04',
  'pn-l1-s1-05',
  'pn-l1-s2-01',
  'pn-l1-s2-02',
  'pn-l1-s2-03',
  'pn-l1-s2-04',
  'pn-l1-s2-05',
  'pn-l1-s3-01',
  'pn-l1-s3-02',
  'pn-l1-s3-03',
  'pn-l1-s3-04',
  'pn-l1-s3-05',
  'pn-l1-s4-01',
  'pn-l1-s4-02',
  'pn-l1-s4-03',
  'pn-l1-s4-04',
  'pn-l1-s4-05',
  'pn-l1-s5-01',
  'pn-l1-s5-02',
  'pn-l1-s5-03',
  'pn-l1-s5-04',
  'pn-l1-s5-05',
]);

const pretestCodes = new Set([
  'pn-l1-s2-04',
  'pn-l1-s3-03',
  'pn-l2-s2-07',
  'pn-l2-s1-10',
  'pn-l1-s4-08',
  'ph-l1-s2-04',
  'ph-l1-s3-05',
  'ph-l2-s5-01',
  'ph-l3-s2-03',
  'wc-l2-s1-09',
  'wc-l2-s3-03',
  'wc-l2-s3-08',
  'cv-l3-s5-04',
  'cv-l3-s2-02',
  'cv-l3-s1-05',
]);

function isPretest(row: SeedRow): boolean {
  return Boolean(row.is_pretest) || pretestCodes.has(row.id);
}

function loadRows(): SeedRow[] {
  return DATA_FILES.flatMap((fileName) => {
    const path = join(process.cwd(), 'prisma', 'data', fileName);
    return JSON.parse(readFileSync(path, 'utf8')) as SeedRow[];
  });
}

function validateRows(rows: SeedRow[]) {
  const ids = new Set<string>();
  const positions = new Set<string>();

  for (const row of rows) {
    if (ids.has(row.id)) throw new Error(`Duplicate question id: ${row.id}`);
    ids.add(row.id);

    const position = `${row.mode}:${row.level}:${row.stage}:${row.order}`;
    if (positions.has(position)) {
      throw new Error(`Duplicate question position: ${position}`);
    }
    positions.add(position);

    const expectedId = `${modePrefix[row.mode]}-l${row.level}-s${row.stage}-${String(row.order).padStart(2, '0')}`;
    if (row.id !== expectedId) {
      throw new Error(`Question id ${row.id} does not match ${expectedId}`);
    }

    if (
      (row.mode === 'picture_naming' || row.mode === 'word_clue') &&
      !row.accepted_answers.includes(row.target_word)
    ) {
      throw new Error(`${row.id} does not accept its target word`);
    }

    if (
      row.mode === 'phrase' &&
      !row.key_words.every((word) => row.phrase.includes(word))
    ) {
      throw new Error(`${row.id} contains a keyword outside its phrase`);
    }
  }

  if (rows.length !== 350) {
    throw new Error(`Expected 350 questions, received ${rows.length}`);
  }
}

function getImageData(row: SeedRow) {
  if (!availableImageCodes.has(row.id) || row.mode !== 'picture_naming') {
    return { imageKey: null, imageUrl: null, imageAlt: null };
  }

  const fileName = `${row.id}_${row.target_word}.png`;
  const imageKey = `${LEVEL_1_PICTURE_FOLDER}/${fileName}`;

  return {
    imageKey,
    imageUrl: `${R2_PUBLIC_BASE_URL}/${LEVEL_1_PICTURE_FOLDER}/${encodeURIComponent(fileName)}`,
    imageAlt: `ภาพ${row.target_word}สำหรับฝึกพูด`,
  };
}

function requiresImage(row: SeedRow) {
  return row.mode === 'picture_naming' || row.mode === 'phrase';
}

function canSeed(row: SeedRow) {
  return (
    isPretest(row) || !requiresImage(row) || getImageData(row).imageKey !== null
  );
}

function mapQuestion(row: SeedRow) {
  const image = getImageData(row);

  const common = {
    level: row.level,
    stage: row.stage,
    mode: modeMap[row.mode],
    sortOrder: row.order,
    imageUrl: image.imageUrl,
    imageKey: image.imageKey,
    imageAlt: image.imageAlt,
    isPretest: isPretest(row),
    isActive: true,
  };

  switch (row.mode) {
    case 'picture_naming':
      return {
        ...common,
        promptText: 'ดูรูปแล้วพูดชื่อสิ่งนี้',
        targetText: row.target_word,
        acceptedAnswers: row.accepted_answers,
        hintMeaning: row.hint_meaning,
        hintSyllable: row.hint_syllable,
        situation: null,
        keyWords: [],
        exampleAnswers: [],
        expectedTopic: null,
        imagePrompt: row.image_prompt,
      };
    case 'word_clue':
      return {
        ...common,
        promptText: row.clue,
        targetText: row.target_word,
        acceptedAnswers: row.accepted_answers,
        hintMeaning: row.hint_meaning,
        hintSyllable: row.hint_syllable,
        situation: null,
        keyWords: [],
        exampleAnswers: [],
        expectedTopic: null,
        imagePrompt: null,
      };
    case 'phrase':
      return {
        ...common,
        promptText: row.phrase,
        targetText: row.phrase,
        acceptedAnswers: [row.phrase],
        hintMeaning: null,
        hintSyllable: null,
        situation: row.situation,
        keyWords: row.key_words,
        exampleAnswers: [],
        expectedTopic: null,
        imagePrompt: row.image_prompt,
      };
    case 'conversation':
      return {
        ...common,
        promptText: row.question,
        targetText: null,
        acceptedAnswers: [],
        hintMeaning: null,
        hintSyllable: null,
        situation: null,
        keyWords: [],
        exampleAnswers: row.example_answers,
        expectedTopic: row.expected_topic,
        imagePrompt: null,
      };
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  const rows = loadRows();
  validateRows(rows);
  const seedableRows = rows.filter(canSeed);
  const excludedCodes = rows
    .filter((row) => !canSeed(row))
    .map((row) => row.id);

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.$transaction([
      prisma.question.deleteMany({
        where: { code: { in: excludedCodes } },
      }),
      ...seedableRows.map((row) => {
        const data = mapQuestion(row);
        return prisma.question.upsert({
          where: { code: row.id },
          create: { code: row.id, ...data },
          update: data,
        });
      }),
    ]);

    console.log(
      `Seeded ${seedableRows.length} questions and excluded ${excludedCodes.length} image-dependent questions without an R2 image key. ${pretestCodes.size} questions are pretest.`,
    );

    const mockUsers = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'สมชาย',
        surname: 'ใจดี',
        email: 'somchai.pretest@example.com',
        is_pretest_passed: false,
        current_level: 1,
        current_stage: 1,
        current_streak: 0,
        longest_streak: 0,
        last_practice_date: null,
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'สมหญิง',
        surname: 'รักเรียน',
        email: 'somying.passed@example.com',
        is_pretest_passed: true,
        current_level: 2,
        current_stage: 3,
        current_streak: 5,
        longest_streak: 10,
        last_practice_date: new Date(),
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'มานะ',
        surname: 'อดทน',
        email: 'mana.advanced@example.com',
        is_pretest_passed: true,
        current_level: 3,
        current_stage: 5,
        current_streak: 21,
        longest_streak: 30,
        last_practice_date: new Date(),
      },
    ];

    for (const mock of mockUsers) {
      await prisma.user.upsert({
        where: { id: mock.id },
        create: {
          id: mock.id,
          name: mock.name,
          surname: mock.surname,
          is_pretest_passed: mock.is_pretest_passed,
          current_level: mock.current_level,
          current_stage: mock.current_stage,
          current_streak: mock.current_streak,
          longest_streak: mock.longest_streak,
          last_practice_date: mock.last_practice_date,
        },
        update: {
          name: mock.name,
          surname: mock.surname,
          is_pretest_passed: mock.is_pretest_passed,
          current_level: mock.current_level,
          current_stage: mock.current_stage,
          current_streak: mock.current_streak,
          longest_streak: mock.longest_streak,
          last_practice_date: mock.last_practice_date,
        },
      });

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'mock',
            providerAccountId: `mock-${mock.id}`,
          },
        },
        create: {
          userId: mock.id,
          provider: 'mock',
          providerAccountId: `mock-${mock.id}`,
          email: mock.email,
        },
        update: {
          userId: mock.id,
          email: mock.email,
        },
      });
    }

    console.log(`Seeded ${mockUsers.length} mock users.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
