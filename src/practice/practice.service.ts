import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async getPretestQuestions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        surname: true,
        is_pretest_passed: true,
        current_level: true,
        current_stage: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_pretest_passed) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'PRETEST_ALREADY_PASSED',
        message: 'ผู้ใช้งานผ่านการประเมินแบบทดสอบก่อนเรียน (Pre-test) แล้ว',
      });
    }

    const questions = await this.prisma.question.findMany({
      where: {
        isPretest: true,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        level: true,
        stage: true,
        mode: true,
        sortOrder: true,
        promptText: true,
        targetText: true,
        acceptedAnswers: true,
        hintMeaning: true,
        hintSyllable: true,
        situation: true,
        keyWords: true,
        exampleAnswers: true,
        expectedTopic: true,
        imageUrl: true,
        imageAlt: true,
        imagePrompt: true,
      },
      orderBy: [{ level: 'asc' }, { stage: 'asc' }, { sortOrder: 'asc' }],
    });

    return {
      total: questions.length,
      questions,
    };
  }

  async completePretest(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        is_pretest_passed: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_pretest_passed) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'PRETEST_ALREADY_PASSED',
        message: 'ผู้ใช้งานผ่านการประเมินแบบทดสอบก่อนเรียน (Pre-test) แล้ว',
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { is_pretest_passed: true },
      select: {
        id: true,
        name: true,
        surname: true,
        is_pretest_passed: true,
        current_level: true,
        current_stage: true,
      },
    });

    return {
      success: true,
      user: updatedUser,
    };
  }
}
