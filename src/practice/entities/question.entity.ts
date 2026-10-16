import { ApiProperty } from '@nestjs/swagger';
import { QuestionMode } from '@prisma/client';

export class QuestionEntity {
  @ApiProperty({
    description: 'Question unique UUID',
    example: 'd3b07384-d113-490e-b7d6-3e3c0b11a541',
  })
  id: string;

  @ApiProperty({
    description: 'Question unique business code',
    example: 'pn-l1-s2-04',
  })
  code: string;

  @ApiProperty({
    description: 'Practice level (1-3)',
    example: 1,
  })
  level: number;

  @ApiProperty({
    description: 'Practice stage within the level',
    example: 2,
  })
  stage: number;

  @ApiProperty({
    enum: QuestionMode,
    description: 'Question mode',
    example: QuestionMode.PICTURE_NAMING,
  })
  mode: QuestionMode;

  @ApiProperty({
    description: 'Order position within stage',
    example: 4,
  })
  sortOrder: number;

  @ApiProperty({
    description: 'Prompt or instruction text',
    example: 'ดูรูปแล้วพูดชื่อสิ่งนี้',
    nullable: true,
  })
  promptText: string | null;

  @ApiProperty({
    description: 'Target answer word or phrase',
    example: 'จาน',
    nullable: true,
  })
  targetText: string | null;

  @ApiProperty({
    description: 'List of accepted answers',
    example: ['จาน'],
    type: [String],
  })
  acceptedAnswers: string[];

  @ApiProperty({
    description: 'Meaning hint',
    example: 'ภาชนะแบน ใส่ข้าวไว้กิน',
    nullable: true,
  })
  hintMeaning: string | null;

  @ApiProperty({
    description: 'First syllable hint',
    example: 'จ...',
    nullable: true,
  })
  hintSyllable: string | null;

  @ApiProperty({
    description: 'Situation context for phrases',
    example: null,
    nullable: true,
  })
  situation: string | null;

  @ApiProperty({
    description: 'Key words',
    example: [],
    type: [String],
  })
  keyWords: string[];

  @ApiProperty({
    description: 'Example answers for conversation',
    example: [],
    type: [String],
  })
  exampleAnswers: string[];

  @ApiProperty({
    description: 'Expected conversation topic',
    example: null,
    nullable: true,
  })
  expectedTopic: string | null;

  @ApiProperty({
    description: 'Public image URL from R2',
    example:
      'https://pub-55c54a64a4904de38ffb99bcd80e714b.r2.dev/picture_naming_level1_colorful/pn-l1-s2-04_%E0%B8%88%E0%B8%B2%E0%B8%99.png',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Accessibility alt text for image',
    example: 'ภาพจานสำหรับฝึกพูด',
    nullable: true,
  })
  imageAlt: string | null;

  @ApiProperty({
    description: 'Image generation prompt',
    example:
      'Flat illustration in a soft blue palette of an empty round dinner plate, plain white background, no text',
    nullable: true,
  })
  imagePrompt: string | null;
}
